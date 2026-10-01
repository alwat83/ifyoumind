import { FieldValue, getFirestore, Timestamp } from 'firebase-admin/firestore';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { authorizeOrganization } from './authorization';

const organizations = () => getFirestore().collection('intelligenceOrganizations');
const readMembership = async (organizationId: string, uid: string) =>
  (await organizations().doc(organizationId).collection('members').doc(uid).get()).data();

interface ImportObservation {
  value: number;
  period: string;
  geography?: string | null;
  entity?: string | null;
  note?: string | null;
  dimensions?: Record<string, string>;
}

function validateText(value: unknown, label: string, max: number, optional = false): string | null {
  if ((value === null || value === undefined || value === '') && optional) return null;
  if (typeof value !== 'string' || !value.trim() || value.trim().length > max) {
    throw new HttpsError('invalid-argument', `${label} is invalid.`);
  }
  return value.trim();
}

export const importUniversalObservations = onCall(
  { timeoutSeconds: 120 },
  async (request) => {
    const scope = await authorizeOrganization(
      request.auth?.uid,
      request.data?.organizationId,
      readMembership,
      ['owner', 'admin'],
    );

    const datasetId = validateText(request.data?.datasetId, 'Dataset ID', 128);
    if (!datasetId || !/^[A-Za-z0-9_-]+$/.test(datasetId)) {
      throw new HttpsError('invalid-argument', 'Invalid dataset ID.');
    }

    const observations: unknown = request.data?.observations;
    if (!Array.isArray(observations) || observations.length < 1 || observations.length > 400) {
      throw new HttpsError('invalid-argument', 'Import must contain between 1 and 400 observations.');
    }

    const datasetRef = organizations().doc(scope.organizationId).collection('datasets').doc(datasetId);
    if (!(await datasetRef.get()).exists) throw new HttpsError('not-found', 'Dataset not found.');

    const validated: ImportObservation[] = observations.map((raw, index) => {
      if (!raw || typeof raw !== 'object') {
        throw new HttpsError('invalid-argument', `Row ${index + 1} is invalid.`);
      }
      const row = raw as Record<string, unknown>;
      const value = Number(row.value);
      if (!Number.isFinite(value)) {
        throw new HttpsError('invalid-argument', `Row ${index + 1} has a non-numeric value.`);
      }

      const period = validateText(row.period, `Row ${index + 1} period`, 80);
      const geography = validateText(row.geography, 'Geography', 160, true);
      const entity = validateText(row.entity, 'Entity', 160, true);
      const note = validateText(row.note, 'Note', 500, true);

      const dimensions: Record<string, string> = {};
      if (row.dimensions && typeof row.dimensions === 'object' && !Array.isArray(row.dimensions)) {
        for (const [key, rawValue] of Object.entries(row.dimensions as Record<string, unknown>)) {
          if (!key.trim() || key.length > 80 || typeof rawValue !== 'string' || rawValue.length > 200) {
            throw new HttpsError('invalid-argument', `Row ${index + 1} has invalid dimensions.`);
          }
          dimensions[key.trim()] = rawValue.trim();
        }
      }

      return { value, period: period!, geography, entity, note, dimensions };
    });

    const db = getFirestore();
    const batch = db.batch();
    const observedAt = Timestamp.now();

    for (const observation of validated) {
      const ref = datasetRef.collection('observations').doc();
      batch.set(ref, {
        schemaVersion: 1,
        datasetId,
        ...observation,
        observedAt,
        createdBy: scope.uid,
        importSource: 'csv',
      });
    }

    batch.set(datasetRef, {
      updatedAt: FieldValue.serverTimestamp(),
      lastImportAt: FieldValue.serverTimestamp(),
      lastImportCount: validated.length,
    }, { merge: true });

    await batch.commit();
    return { imported: validated.length };
  },
);
