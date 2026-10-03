import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { authorizeOrganization } from './authorization';

const organizations = () => getFirestore().collection('intelligenceOrganizations');
const readMembership = async (organizationId: string, uid: string) =>
  (await organizations().doc(organizationId).collection('members').doc(uid).get()).data();

function text(value: unknown, label: string, max: number): string {
  if (typeof value !== 'string' || !value.trim() || value.trim().length > max) {
    throw new HttpsError('invalid-argument', `${label} is required.`);
  }
  return value.trim();
}

function hash(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function between(seed: number, min: number, max: number, salt: number): number {
  const x = (Math.imul(seed ^ salt, 1103515245) + 12345) >>> 0;
  return min + (x / 0xffffffff) * (max - min);
}

function buildDemoBrief(location: string, concept: string) {
  const seed = hash(`${location.toLowerCase()}|${concept.toLowerCase()}`);
  const metrics = [
    { key:'population', label:'Population', value:Math.round(between(seed, 28000, 165000, 11)), unit:'people', direction:'context' },
    { key:'income', label:'Median household income', value:Math.round(between(seed, 48000, 118000, 23)), unit:'USD', direction:'higher' },
    { key:'growth', label:'Population growth', value:Number(between(seed, -0.8, 5.2, 37).toFixed(1)), unit:'%', direction:'higher' },
    { key:'homeValue', label:'Median home value', value:Math.round(between(seed, 175000, 560000, 41)), unit:'USD', direction:'context' },
    { key:'rentPressure', label:'Commercial rent pressure', value:Math.round(between(seed, 72, 138, 53)), unit:'index', direction:'lower' },
    { key:'competition', label:'Category competition', value:Math.round(between(seed, 4, 38, 67)), unit:'nearby businesses', direction:'lower' },
    { key:'spending', label:'Consumer spending proxy', value:Math.round(between(seed, 78, 136, 79)), unit:'index', direction:'higher' },
  ];

  const positive = [
    metrics.find(m=>m.key==='income')!,
    metrics.find(m=>m.key==='growth')!,
    metrics.find(m=>m.key==='spending')!,
  ].sort((a,b)=>Number(b.value)-Number(a.value));
  const risk = [
    metrics.find(m=>m.key==='rentPressure')!,
    metrics.find(m=>m.key==='competition')!,
  ].sort((a,b)=>Number(b.value)-Number(a.value));

  return {
    metrics,
    opportunities: [
      `${positive[0].label} is one of the stronger signals in this demo market profile.`,
      `${positive[1].label} adds supporting context for demand potential.`,
    ],
    risks: [
      `${risk[0].label} is a material pressure to validate before committing capital.`,
      `${risk[1].label} could limit upside depending on concept differentiation.`,
    ],
    questions: [
      `How does ${location} compare with nearby alternatives for ${concept}?`,
      `What would make this market a bad fit for ${concept}?`,
      `Which local signal should I validate next?`,
    ],
  };
}

export const createMarketIntelligenceProject = onCall(async (request) => {
  const scope = await authorizeOrganization(
    request.auth?.uid, request.data?.organizationId, readMembership, ['owner','admin'],
  );
  const location = text(request.data?.location, 'Location', 160);
  const concept = text(request.data?.concept, 'Business concept', 160);
  const decision = text(request.data?.decision || 'Evaluate this market', 'Decision', 240);

  const ref = organizations().doc(scope.organizationId).collection('marketProjects').doc();
  const brief = buildDemoBrief(location, concept);
  await ref.set({
    schemaVersion:1,
    location,
    concept,
    decision,
    mode:'demo',
    brief,
    status:'ready',
    createdBy:scope.uid,
    createdAt:FieldValue.serverTimestamp(),
    updatedAt:FieldValue.serverTimestamp(),
  });

  return {
    id:ref.id,
    location,
    concept,
    decision,
    mode:'demo',
    brief,
    dataNotice:'Synthetic demo enrichment — not real market data.',
  };
});

export const getRecentMarketIntelligenceProjects = onCall(async (request) => {
  const scope = await authorizeOrganization(
    request.auth?.uid, request.data?.organizationId, readMembership,
  );
  const snapshot = await organizations().doc(scope.organizationId)
    .collection('marketProjects').orderBy('createdAt','desc').limit(12).get();

  return {
    projects:snapshot.docs.map(doc=>{
      const d=doc.data();
      return {
        id:doc.id,
        location:d.location,
        concept:d.concept,
        decision:d.decision,
        mode:d.mode,
        createdAt:d.createdAt?.toDate?.().toISOString?.() || null,
      };
    }),
  };
});
