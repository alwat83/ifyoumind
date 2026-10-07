import { FieldValue, getFirestore, Timestamp } from 'firebase-admin/firestore';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { authorizeOrganization } from './authorization';

const organizations = () => getFirestore().collection('intelligenceOrganizations');
const readMembership = async (organizationId: string, uid: string) =>
  (await organizations().doc(organizationId).collection('members').doc(uid).get()).data();

const STATE_FIPS: Record<string,string> = {
  AL:'01',AK:'02',AZ:'04',AR:'05',CA:'06',CO:'08',CT:'09',DE:'10',DC:'11',FL:'12',GA:'13',HI:'15',
  ID:'16',IL:'17',IN:'18',IA:'19',KS:'20',KY:'21',LA:'22',ME:'23',MD:'24',MA:'25',MI:'26',MN:'27',
  MS:'28',MO:'29',MT:'30',NE:'31',NV:'32',NH:'33',NJ:'34',NM:'35',NY:'36',NC:'37',ND:'38',OH:'39',
  OK:'40',OR:'41',PA:'42',RI:'44',SC:'45',SD:'46',TN:'47',TX:'48',UT:'49',VT:'50',VA:'51',WA:'53',
  WV:'54',WI:'55',WY:'56'
};

const STATE_NAMES: Record<string,string> = {
  Alabama:'AL',Alaska:'AK',Arizona:'AZ',Arkansas:'AR',California:'CA',Colorado:'CO',Connecticut:'CT',
  Delaware:'DE','District of Columbia':'DC',Florida:'FL',Georgia:'GA',Hawaii:'HI',Idaho:'ID',Illinois:'IL',
  Indiana:'IN',Iowa:'IA',Kansas:'KS',Kentucky:'KY',Louisiana:'LA',Maine:'ME',Maryland:'MD',Massachusetts:'MA',
  Michigan:'MI',Minnesota:'MN',Mississippi:'MS',Missouri:'MO',Montana:'MT',Nebraska:'NE',Nevada:'NV',
  'New Hampshire':'NH','New Jersey':'NJ','New Mexico':'NM','New York':'NY','North Carolina':'NC',
  'North Dakota':'ND',Ohio:'OH',Oklahoma:'OK',Oregon:'OR',Pennsylvania:'PA','Rhode Island':'RI',
  'South Carolina':'SC','South Dakota':'SD',Tennessee:'TN',Texas:'TX',Utah:'UT',Vermont:'VT',Virginia:'VA',
  Washington:'WA','West Virginia':'WV',Wisconsin:'WI',Wyoming:'WY'
};

interface CensusPlace {
  location:string;
  population:number;
  income:number;
  homeValue:number;
  populationFiveYearsAgo:number|null;
  populationChangePct:number|null;
  placeFips:string;
  stateFips:string;
}

function text(value: unknown, label: string, max: number): string {
  if (typeof value !== 'string' || !value.trim() || value.trim().length > max) {
    throw new HttpsError('invalid-argument', `${label} is required.`);
  }
  return value.trim();
}

function normalize(value:string):string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
}

function parseLocation(location:string):{city:string;state:string;stateFips:string}{
  const parts=location.split(',').map(part=>part.trim()).filter(Boolean);
  if(parts.length<2){
    throw new HttpsError('invalid-argument','For live data, enter a U.S. city and state, for example Birmingham, AL.');
  }
  const city=parts[0];
  const rawState=parts[parts.length-1];
  const state=rawState.length===2 ? rawState.toUpperCase() : STATE_NAMES[rawState.replace(/\b\w/g,c=>c.toUpperCase())];
  const stateFips=state ? STATE_FIPS[state] : '';
  if(!city||!state||!stateFips){
    throw new HttpsError('invalid-argument','For live data, enter a valid U.S. city and state, for example Birmingham, AL.');
  }
  return {city,state,stateFips};
}

async function fetchPlaceRows(year:number,stateFips:string):Promise<string[][]>{
  const url=new URL(`https://api.census.gov/data/${year}/acs/acs5`);
  url.searchParams.set('get','NAME,B01003_001E,B19013_001E,B25077_001E');
  url.searchParams.set('for','place:*');
  url.searchParams.set('in',`state:${stateFips}`);
  const response=await fetch(url);
  if(!response.ok){
    console.error('Census API failed',year,response.status);
    throw new HttpsError('unavailable','Live Census data is temporarily unavailable.');
  }
  return await response.json() as string[][];
}

function findPlace(rows:string[][],city:string):string[]|null{
  const target=normalize(city);
  const headers=rows[0]||[];
  const nameIndex=headers.indexOf('NAME');
  if(nameIndex<0)return null;
  const candidates=rows.slice(1).filter(row=>{
    const placeName=(row[nameIndex]||'').split(',')[0].replace(/\b(city|town|village|borough|CDP|municipality)\b/ig,'').trim();
    return normalize(placeName)===target;
  });
  return candidates[0]||null;
}

function numberCell(row:string[],headers:string[],key:string):number{
  const value=Number(row[headers.indexOf(key)]);
  if(!Number.isFinite(value)||value<0){
    throw new HttpsError('unavailable',`Census did not return a usable value for ${key}.`);
  }
  return value;
}

async function fetchCensusPlace(location:string):Promise<CensusPlace>{
  const parsed=parseLocation(location);
  const cacheId=`acs5-2024-2019-${parsed.stateFips}-${normalize(parsed.city).replace(/\s+/g,'_')}`;
  const cacheRef=getFirestore().collection('censusPlaceCache').doc(cacheId);
  const cached=await cacheRef.get();
  if(cached.exists){
    const data=cached.data() as CensusPlace;
    return {...data,location};
  }

  const [latest,prior]=await Promise.all([
    fetchPlaceRows(2024,parsed.stateFips),
    fetchPlaceRows(2019,parsed.stateFips),
  ]);
  const latestHeaders=latest[0]||[];
  const latestRow=findPlace(latest,parsed.city);
  if(!latestRow){
    throw new HttpsError('not-found',`I couldn't match "${location}" to a Census place. Try city, state such as Birmingham, AL.`);
  }
  const priorHeaders=prior[0]||[];
  const priorRow=findPlace(prior,parsed.city);
  const population=numberCell(latestRow,latestHeaders,'B01003_001E');
  const populationFiveYearsAgo=priorRow ? numberCell(priorRow,priorHeaders,'B01003_001E') : null;
  const populationChangePct=populationFiveYearsAgo && populationFiveYearsAgo>0
    ? Number((((population-populationFiveYearsAgo)/populationFiveYearsAgo)*100).toFixed(1))
    : null;

  const place:CensusPlace={
    location,
    population,
    income:numberCell(latestRow,latestHeaders,'B19013_001E'),
    homeValue:numberCell(latestRow,latestHeaders,'B25077_001E'),
    populationFiveYearsAgo,
    populationChangePct,
    placeFips:latestRow[latestHeaders.indexOf('place')],
    stateFips:parsed.stateFips,
  };

  await cacheRef.set({
    ...place,
    cachedAt:FieldValue.serverTimestamp(),
    sourceYears:[2019,2024],
  });

  return place;
}

function metricsFor(place:CensusPlace){
  const sourceUrl=`https://api.census.gov/data/2024/acs/acs5?get=NAME%2CB01003_001E%2CB19013_001E%2CB25077_001E&for=place%3A${place.placeFips}&in=state%3A${place.stateFips}`;
  const metrics=[
    {key:'population',label:'Population',value:place.population,unit:'people',direction:'context',sourceLabel:'U.S. Census Bureau · 2024 ACS 5-year',sourceUrl},
    {key:'income',label:'Median household income',value:place.income,unit:'USD',direction:'higher',sourceLabel:'U.S. Census Bureau · 2024 ACS 5-year',sourceUrl},
    {key:'homeValue',label:'Median home value',value:place.homeValue,unit:'USD',direction:'context',sourceLabel:'U.S. Census Bureau · 2024 ACS 5-year',sourceUrl},
  ];
  if(place.populationChangePct!==null){
    metrics.push({
      key:'growth',
      label:'5-year population change',
      value:place.populationChangePct,
      unit:'%',
      direction:'higher',
      sourceLabel:'U.S. Census Bureau · 2019–2024 ACS 5-year estimates',
      sourceUrl,
    });
  }
  return metrics;
}

function buildLiveBrief(primary:CensusPlace,comparisons:CensusPlace[]){
  const metrics=metricsFor(primary);
  const growth=primary.populationChangePct;
  const opportunity:string[]=[];
  const risks:string[]=[];

  if(growth!==null){
    if(growth>1) opportunity.push(`Population increased ${growth}% between the 2019 and 2024 ACS 5-year estimates.`);
    else if(growth<0) risks.push(`Population decreased ${Math.abs(growth)}% between the 2019 and 2024 ACS 5-year estimates.`);
    else opportunity.push('Population was broadly stable across the 2019 and 2024 ACS 5-year estimates.');
  }
  opportunity.push(`Median household income is ${new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0}).format(primary.income)}.`);

  if(comparisons.length){
    const higherIncome=comparisons.filter(place=>place.income>primary.income).length;
    const strongerGrowth=comparisons.filter(place=>(place.populationChangePct??-999)>(primary.populationChangePct??-999)).length;
    if(higherIncome) risks.push(`${higherIncome} comparison market${higherIncome===1?' has':'s have'} a higher median household income.`);
    if(strongerGrowth) risks.push(`${strongerGrowth} comparison market${strongerGrowth===1?' shows':'s show'} stronger 5-year population change.`);
  }
  if(!risks.length) risks.push('Census demographics alone do not measure competition, commercial rent, foot traffic, or concept-level demand.');

  const questions=[
    `What local competitors serve the same customer as ${primary.location}?`,
    'What are current commercial rents and occupancy costs for the exact trade area?',
    'What foot-traffic or customer-demand signal would confirm this opportunity?',
  ];
  const trimmedOpportunities=opportunity.slice(0,2);
  const trimmedRisks=risks.slice(0,2);
  const sourcedMetrics=metrics.filter(metric=>!!metric.sourceLabel).length;
  const posture=trimmedOpportunities.length>trimmedRisks.length
    ? 'favorable'
    : trimmedRisks.length>trimmedOpportunities.length ? 'caution' : 'mixed';

  return {
    metrics,
    opportunities:trimmedOpportunities,
    risks:trimmedRisks,
    comparisons:comparisons.map(place=>({location:place.location,metrics:metricsFor(place)})),
    questions,
    sources:[
      {provider:'U.S. Census Bureau',dataset:'2024 ACS 5-year estimates',retrievedAt:new Date().toISOString(),url:'https://api.census.gov/data/2024/acs/acs5'},
      {provider:'U.S. Census Bureau',dataset:'2019 ACS 5-year estimates',retrievedAt:new Date().toISOString(),url:'https://api.census.gov/data/2019/acs/acs5'},
    ],
    decisionReport:{
      schemaVersion:1,
      posture,
      evidenceCoverage:{
        sourcedMetrics,
        totalMetrics:metrics.length,
        percent:metrics.length ? Math.round((sourcedMetrics/metrics.length)*100) : 0,
      },
      actionPlan:[
        {stage:'Validate first',title:'Resolve the biggest risk',detail:trimmedRisks[0]||'Confirm the most important downside assumption with a local source.'},
        {stage:'Then',title:'Confirm local demand',detail:questions[2]},
        {stage:'Before committing',title:'Verify operating economics',detail:questions[1]},
      ],
      comparisonFindings:comparisons.map(place=>{
        const findings:string[]=[];
        const incomeDelta=primary.income-place.income;
        findings.push(`Median household income is ${new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0}).format(Math.abs(incomeDelta))} ${incomeDelta>=0?'higher':'lower'} than ${place.location}.`);
        if(primary.populationChangePct!==null&&place.populationChangePct!==null){
          const delta=Number((primary.populationChangePct-place.populationChangePct).toFixed(1));
          findings.push(`Five-year population change is ${Math.abs(delta)} percentage points ${delta>=0?'stronger':'weaker'} than ${place.location}.`);
        }
        return {location:place.location,findings};
      }),
      decisionTriggers:{
        strengthens:trimmedOpportunities[0]||'Additional local evidence supports the core demand assumption.',
        weakens:trimmedRisks[0]||'New local evidence materially weakens the demand or economics case.',
        unresolved:questions[0],
      },
      limitations:[
        'ACS estimates describe demographic context, not concept-level demand.',
        'Commercial rent, foot traffic, competition, and site-specific operating economics are not yet included.',
      ],
    },
  };
}

export const createMarketIntelligenceProject = onCall(async (request) => {
  const scope = await authorizeOrganization(
    request.auth?.uid, request.data?.organizationId, readMembership, ['owner','admin'],
  );
  const orgRef = organizations().doc(scope.organizationId);
  const orgData = (await orgRef.get()).data() || {};
  const plan = orgData.plan === 'pro' ? 'pro' : 'free';
  const isLocalDemo = process.env.GCLOUD_PROJECT === 'demo-ifyoumind';

  if (!isLocalDemo && plan === 'free') {
    const now = new Date();
    const start = Timestamp.fromDate(new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)));
    const usage = await orgRef.collection('marketProjects')
      .where('createdAt', '>=', start)
      .count()
      .get();
    if (usage.data().count >= 3) {
      throw new HttpsError(
        'resource-exhausted',
        'Free plan limit reached. Upgrade to Pro or purchase a one-time Market Report.',
      );
    }
  }

  const location = text(request.data?.location, 'Location', 160);
  const concept = text(request.data?.concept, 'Business concept', 160);
  const decision = text(request.data?.decision || 'Evaluate this market', 'Decision', 240);
  const rawComparisons = Array.isArray(request.data?.comparisonLocations) ? request.data.comparisonLocations : [];
  const comparisonLocations = rawComparisons
    .filter((value: unknown): value is string => typeof value === 'string')
    .map((value: string) => value.trim())
    .filter(Boolean)
    .slice(0, isLocalDemo || plan === 'pro' ? 3 : 1);

  const [primary,...comparisonPlaces]=await Promise.all(
    [location,...comparisonLocations].map(value=>fetchCensusPlace(value)),
  );
  const brief=buildLiveBrief(primary,comparisonPlaces);

  const ref = organizations().doc(scope.organizationId).collection('marketProjects').doc();
  await ref.set({
    schemaVersion:2,
    location,
    concept,
    decision,
    comparisonLocations,
    mode:'live',
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
    comparisonLocations,
    mode:'live',
    brief,
    dataNotice:'Live demographic enrichment from U.S. Census Bureau ACS 5-year estimates. Competition, commercial rent, foot traffic, and concept-level demand are not yet included.',
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

export const getMarketIntelligenceProject = onCall(async (request) => {
  const scope = await authorizeOrganization(
    request.auth?.uid, request.data?.organizationId, readMembership,
  );
  const projectId = request.data?.projectId;
  if (typeof projectId !== 'string' || !/^[A-Za-z0-9_-]{1,128}$/.test(projectId)) {
    throw new HttpsError('invalid-argument', 'Invalid market project.');
  }

  const snapshot = await organizations().doc(scope.organizationId)
    .collection('marketProjects').doc(projectId).get();
  if (!snapshot.exists) throw new HttpsError('not-found', 'Market project not found.');

  const data = snapshot.data()!;
  return {
    id:snapshot.id,
    location:data.location,
    concept:data.concept,
    decision:data.decision,
    comparisonLocations:data.comparisonLocations || [],
    mode:data.mode || 'demo',
    brief:data.brief,
    dataNotice:data.mode === 'live'
      ? 'Live demographic enrichment from U.S. Census Bureau ACS 5-year estimates. Competition, commercial rent, foot traffic, and concept-level demand are not yet included.'
      : 'Synthetic demo enrichment — not real market data.',
    createdAt:data.createdAt?.toDate?.().toISOString?.() || null,
  };
});
