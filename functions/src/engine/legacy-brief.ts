// Turns the CURRENT production brief (buildLiveBrief in ../intelligence/market-intelligence.ts) into
// evidence and claims, so the evaluation suite can grade today's output without changing it.
// Test-only: imported by functions/test/engine-evals.test.cjs, never by index.ts.
import { Claim, Evidence, EvidenceStore, Fact } from './evidence';

export interface LegacyPlace {
  location:string;
  population:number;
  income:number;
  homeValue:number;
  populationChangePct:number|null;
}
export interface LegacyBrief {
  opportunities:string[];
  risks:string[];
  decisionReport?:{posture?:'favorable'|'caution'|'mixed'};
}
/** Optional 90% margins of error per place (the live brief does not carry them yet). */
export type Margins=Record<string,{income?:number;population?:number;homeValue?:number;growth?:number}>;

/** The sentences the result page shows for each posture (market-report.component.ts on master). */
export const LEGACY_VERDICT_TEXT={
  favorable:'The available evidence leans favorable, with important items to validate before committing.',
  caution:'The available evidence suggests caution. Resolve the major risks before committing.',
  mixed:'The evidence is mixed. Treat this as a validation decision rather than a clear go/no-go.',
} as const;

export const evidenceId=(location:string,measure:string)=>`${location.toLowerCase().replace(/[^a-z0-9]+/g,'-')}:${measure}`;

export function legacyEvidence(places:LegacyPlace[],margins:Margins={}):EvidenceStore{
  const items:Evidence[]=[];
  for(const place of places){
    const m=margins[place.location]||{};
    const fact=(measure:string,value:number|null,unit:string,moe:number|undefined,period:string,table:string):Fact=>({
      id:evidenceId(place.location,measure),kind:'fact',subject:place.location,measure,unit,value,moe:moe??null,period,
      geography:{level:'place',name:place.location},
      source:{publisher:'U.S. Census Bureau',dataset:'ACS 5-year',table},
    });
    items.push(fact('population',place.population,'people',m.population,'2020-2024','B01003'));
    items.push(fact('income',place.income,'USD',m.income,'2020-2024','B19013'));
    items.push(fact('homeValue',place.homeValue,'USD',m.homeValue,'2020-2024','B25077'));
    items.push(fact('growth',place.populationChangePct,'%',m.growth,'2015-2019 to 2020-2024','B01003'));
  }
  return new EvidenceStore(items);
}

/**
 * The claims today's result page makes: the verdict, each "What supports it" line and each
 * "What gives us pause" line, with the assertion each sentence implies.
 */
export function legacyClaims(primary:LegacyPlace,comparisons:LegacyPlace[],brief:LegacyBrief):Claim[]{
  const claims:Claim[]=[];
  const all=[primary,...comparisons];
  const ids=(measure:string)=>all.map(place=>evidenceId(place.location,measure));
  const posture=brief.decisionReport?.posture??'mixed';
  claims.push({
    id:'verdict',role:'verdict',text:LEGACY_VERDICT_TEXT[posture],
    evidence:['income','population','homeValue','growth'].flatMap(ids),
    // Today's verdict weighs no criteria and no user priorities: it compares bullet counts.
    assertion:{type:'recommendation',options:all.map(p=>p.location),criteria:[],
      chosen:posture==='favorable'?primary.location:posture==='caution'?`against:${primary.location}`:null},
  });
  brief.opportunities.forEach((text,i)=>{
    const measure=/income/i.test(text)?'income':'growth';
    claims.push({id:`support-${i}`,role:'support',text,evidence:[evidenceId(primary.location,measure)],
      assertion:{type:'value',evidence:evidenceId(primary.location,measure)}});
  });
  brief.risks.forEach((text,i)=>{
    const income=/higher median household income/i.test(text);
    const growth=/higher estimated 5-year population change/i.test(text);
    if(income||growth){
      const measure=income?'income':'growth';
      const own=primary[measure==='income'?'income':'populationChangePct'];
      for(const other of comparisons){
        const theirs=other[measure==='income'?'income':'populationChangePct'];
        if(own===null||theirs===null||!(theirs>own))continue;
        claims.push({id:`concern-${i}-${evidenceId(other.location,measure)}`,role:'concern',text,
          evidence:[evidenceId(other.location,measure),evidenceId(primary.location,measure)],
          assertion:{type:'compare',left:evidenceId(other.location,measure),right:evidenceId(primary.location,measure),relation:'higher'}});
      }
    }else if(/decreased/i.test(text)){
      claims.push({id:`concern-${i}`,role:'concern',text,evidence:[evidenceId(primary.location,'growth')],
        assertion:{type:'value',evidence:evidenceId(primary.location,'growth')}});
    }else{
      claims.push({id:`limitation-${i}`,role:'limitation',text,evidence:[]});
    }
  });
  return claims;
}
