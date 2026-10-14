// What the Census figures in a brief actually show, place by place, in neutral words.
// Replaces the verdict that was chosen by counting "supports" against "gives us pause" bullets:
// four demographic measures describe residents, not demand, competition or rent, so they can
// describe where a place stands but never recommend it. "No clear difference" is a valid result.
//
// The figures carry no margins of error yet (PR #29 adds the Census difference tests). Until then a
// conservative closeness band stands in for them: a gap smaller than it is called "about the same",
// because survey error alone can produce gaps of that size. The band is stated to the reader.

export interface SummaryMetric { key:string; label:string; value:number; unit:string }
export interface SummaryPlace { location:string; metrics:SummaryMetric[] }

export type Position='higher'|'lower'|'similar'|'mixed';

export interface MeasureFinding {
  key:string;
  label:string;
  position:Position;
  /** Plain sentence about this measure, e.g. "Higher than Madison, WI ($77,000 vs $61,000)." */
  detail:string;
}

export interface EvidenceSummary {
  kind:'differences'|'no_clear_difference'|'single_place';
  headline:string;
  findings:MeasureFinding[];
  /** Always shown: what these measures cannot settle. */
  limits:string;
  /** How "about the same" was decided, shown under the findings. */
  method:string;
}

/** Relative gap (levels) or percentage-point gap (rates) below which two values are "about the same". */
export const CLOSE_RELATIVE=0.05;
export const CLOSE_POINTS=2;

const ORDER=['income','population','growth','homeValue'];

function format(value:number,unit:string):string{
  if(unit==='USD')return new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0}).format(value);
  if(unit==='%')return `${value}%`;
  return new Intl.NumberFormat('en-US').format(value);
}

/** -1 lower, 0 about the same, 1 higher: primary compared with one other value. */
export function compareValues(primary:number,other:number,unit:string):-1|0|1{
  if(unit==='%'){
    const gap=primary-other;
    return Math.abs(gap)<CLOSE_POINTS?0:gap>0?1:-1;
  }
  if(other===0)return primary===0?0:primary>0?1:-1;
  const gap=(primary-other)/Math.abs(other);
  return Math.abs(gap)<CLOSE_RELATIVE?0:gap>0?1:-1;
}

function listPlaces(names:string[]):string{
  if(names.length<=1)return names.join('');
  return `${names.slice(0,-1).join(', ')} and ${names.at(-1)}`;
}

function listLabels(labels:string[]):string{
  const lower=labels.map(label=>label.charAt(0).toLowerCase()+label.slice(1));
  return listPlaces(lower);
}

export function summarizeEvidence(primary:SummaryPlace,comparisons:SummaryPlace[]):EvidenceSummary{
  const limits='These figures describe the people who live in each place. They do not measure demand for your business, competitors, rent or foot traffic, so on their own they cannot recommend a location.';
  const method=`“About the same” means a gap under ${Math.round(CLOSE_RELATIVE*100)}% (or under ${CLOSE_POINTS} percentage points for population change). Census survey estimates carry error, so gaps that small may not be real.`;
  const keyed=(place:SummaryPlace)=>new Map(place.metrics.map(metric=>[metric.key,metric]));
  const mine=keyed(primary);
  const theirs=comparisons.map(place=>({location:place.location,metrics:keyed(place)}));

  if(!comparisons.length){
    return {
      kind:'single_place',
      headline:`These figures describe ${primary.location} on its own. Add a comparison place to see where it stands.`,
      findings:[],
      limits,
      method,
    };
  }

  const findings:MeasureFinding[]=[];
  const keys=[...ORDER.filter(key=>mine.has(key)),...[...mine.keys()].filter(key=>!ORDER.includes(key))];
  for(const key of keys){
    const metric=mine.get(key)!;
    const others=theirs.filter(place=>place.metrics.has(key));
    if(!others.length)continue;
    const results=others.map(place=>({location:place.location,value:place.metrics.get(key)!.value,cmp:compareValues(metric.value,place.metrics.get(key)!.value,metric.unit)}));
    const higher=results.filter(r=>r.cmp===1), lower=results.filter(r=>r.cmp===-1), same=results.filter(r=>r.cmp===0);
    let position:Position;
    if(higher.length===results.length)position='higher';
    else if(lower.length===results.length)position='lower';
    else if(same.length===results.length)position='similar';
    else position='mixed';
    const vs=(rows:typeof results)=>listPlaces(rows.map(r=>`${r.location} (${format(r.value,metric.unit)})`));
    const parts:string[]=[];
    if(higher.length)parts.push(`higher than ${vs(higher)}`);
    if(lower.length)parts.push(`lower than ${vs(lower)}`);
    if(same.length)parts.push(`about the same as ${vs(same)}`);
    const sentence=parts.join('; ');
    findings.push({
      key,
      label:metric.label,
      position,
      detail:`${format(metric.value,metric.unit)}: ${sentence}.`,
    });
  }

  const higher=findings.filter(f=>f.position==='higher').map(f=>f.label);
  const lower=findings.filter(f=>f.position==='lower').map(f=>f.label);
  const others=listPlaces(comparisons.map(place=>place.location));
  const all=comparisons.length===1?others:comparisons.length===2?`both ${others}`:`each of ${others}`;

  if(!higher.length&&!lower.length&&findings.every(f=>f.position==='similar')){
    return {
      kind:'no_clear_difference',
      headline:`On these Census measures, ${primary.location} shows no clear difference from ${others}.`,
      findings,
      limits,
      method,
    };
  }
  const clauses:string[]=[];
  if(higher.length)clauses.push(`higher ${listLabels(higher)} than ${all}`);
  if(lower.length)clauses.push(`lower ${listLabels(lower)} than ${higher.length?(comparisons.length===1?'it':'each of them'):all}`);
  const headline=clauses.length
    ? `${primary.location} has ${clauses.join(', and ')}.`
    : `${primary.location} is higher than some places and lower than others; no measure sets it apart from ${all}.`;
  return {kind:'differences',headline,findings,limits,method};
}
