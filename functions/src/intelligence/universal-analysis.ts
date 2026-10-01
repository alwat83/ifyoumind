import { getFirestore } from 'firebase-admin/firestore';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { authorizeOrganization } from './authorization';

const organizations = () => getFirestore().collection('intelligenceOrganizations');
const readMembership = async (organizationId: string, uid: string) =>
  (await organizations().doc(organizationId).collection('members').doc(uid).get()).data();

interface Observation { value: number; period: string; geography?: string | null; entity?: string | null; }
interface DatasetView { id: string; name: string; metric: string; unit: string; sourceLabel: string; observations: Observation[]; }

function pearson(xs: number[], ys: number[]): number | null {
  if (xs.length < 3 || xs.length !== ys.length) return null;
  const meanX = xs.reduce((a,b)=>a+b,0)/xs.length;
  const meanY = ys.reduce((a,b)=>a+b,0)/ys.length;
  let numerator=0, dx2=0, dy2=0;
  for (let i=0;i<xs.length;i++) {
    const dx=xs[i]-meanX, dy=ys[i]-meanY;
    numerator += dx*dy; dx2 += dx*dx; dy2 += dy*dy;
  }
  const denominator=Math.sqrt(dx2*dy2);
  return denominator ? numerator/denominator : null;
}

function strength(r: number | null): string {
  if (r === null) return 'insufficient';
  const a=Math.abs(r);
  if (a >= .8) return 'strong';
  if (a >= .5) return 'moderate';
  if (a >= .3) return 'weak';
  return 'little';
}

export const analyzeUniversalDatasets = onCall(async (request) => {
  const scope = await authorizeOrganization(
    request.auth?.uid, request.data?.organizationId, readMembership,
  );

  const ids: unknown = request.data?.datasetIds;
  if (!Array.isArray(ids) || ids.length < 2 || ids.length > 8 ||
      ids.some((id) => typeof id !== 'string' || !/^[A-Za-z0-9_-]{1,128}$/.test(id))) {
    throw new HttpsError('invalid-argument', 'Choose between 2 and 8 datasets.');
  }

  const datasets: DatasetView[] = [];
  for (const id of ids as string[]) {
    const ref = organizations().doc(scope.organizationId).collection('datasets').doc(id);
    const snap = await ref.get();
    if (!snap.exists) throw new HttpsError('not-found', 'Dataset not found.');
    const data = snap.data()!;
    const obs = await ref.collection('observations').orderBy('period', 'asc').limit(500).get();
    datasets.push({
      id, name:data.name, metric:data.metric, unit:data.unit, sourceLabel:data.sourceLabel,
      observations: obs.docs.map((doc)=>doc.data() as Observation),
    });
  }

  const relationships = [];
  for (let i=0;i<datasets.length;i++) {
    for (let j=i+1;j<datasets.length;j++) {
      const a=datasets[i], b=datasets[j];
      const byPeriodA=new Map(a.observations.map(o=>[o.period,o]));
      const matched=b.observations
        .filter(o=>byPeriodA.has(o.period))
        .map(o=>({period:o.period,a:byPeriodA.get(o.period)!.value,b:o.value}));
      const r=pearson(matched.map(x=>x.a), matched.map(x=>x.b));
      const s=strength(r);
      const direction=r===null?'unknown':r>0?'positive':r<0?'negative':'none';
      relationships.push({
        datasetA:{id:a.id,name:a.name,metric:a.metric,unit:a.unit},
        datasetB:{id:b.id,name:b.name,metric:b.metric,unit:b.unit},
        matchedPeriods:matched.length,
        correlation:r,
        strength:s,
        direction,
        conclusion:r===null
          ? `There is not enough overlapping data to evaluate the relationship between ${a.name} and ${b.name}.`
          : `${a.name} and ${b.name} show a ${s} ${direction} relationship across ${matched.length} matching periods.`,
        caveat:'This is an observed association, not proof that one dataset causes changes in the other.',
        evidence:matched,
      });
    }
  }

  const usable=relationships.filter(r=>r.correlation!==null);
  const strongest=[...usable].sort((a,b)=>Math.abs(b.correlation!)-Math.abs(a.correlation!))[0] || null;

  return {
    datasetCount: datasets.length,
    relationships,
    summary: strongest
      ? `The strongest observed relationship is between ${strongest.datasetA.name} and ${strongest.datasetB.name}: ${strongest.strength} ${strongest.direction} association (r=${strongest.correlation!.toFixed(2)}).`
      : 'There is not yet enough overlapping data to draw a cross-dataset relationship.',
    confidence: strongest
      ? strongest.matchedPeriods >= 12 ? 'medium' : 'low'
      : 'low',
    limitations:[
      'Correlation does not establish causation.',
      'Different geographic, entity, or collection definitions can make datasets incomparable even when periods align.',
      'More observations and independent supporting datasets improve confidence.',
    ],
  };
});
