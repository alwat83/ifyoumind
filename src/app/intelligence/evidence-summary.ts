// What the Census figures in a brief actually show, place by place, in neutral words.
// Replaces the verdict that was chosen by counting "supports" against "gives us pause" bullets:
// four demographic measures describe residents, not demand, competition or rent, so they can
// describe where a place stands but never recommend it.
//
// Every gap is reported with its size and direction. Nothing is declared equal or "the same": the
// figures carry no margins of error yet (PR #29 adds the Census difference tests), so no gap here has
// been tested. Small gaps are flagged as uncertain, a reading aid that is stated to the reader as
// such, never a threshold for significance.

export interface SummaryMetric { key:string; label:string; value:number; unit:string }
export interface SummaryPlace { location:string; metrics:SummaryMetric[] }

export type Position='higher'|'lower'|'mixed'|'equal';

export interface MeasureFinding {
  key:string;
  label:string;
  position:Position;
  /** Plain sentence with every gap, e.g. "$77,000: $16,000 (26%) higher than Madison, WI ($61,000)." */
  detail:string;
  /** True when at least one gap is small enough that survey error alone could produce it. */
  smallGap:boolean;
}

export interface EvidenceSummary {
  kind:'differences'|'small_differences'|'single_place';
  headline:string;
  findings:MeasureFinding[];
  /** Always shown: what these measures cannot settle. */
  limits:string;
  /** What was and wasn't tested, and how small gaps are flagged; shown under the findings. */
  method:string;
}

/** Relative gap (levels) or percentage-point gap (rates) below which a gap is flagged as small. */
export const CLOSE_RELATIVE=0.05;
export const CLOSE_POINTS=2;

const ORDER=['income','population','growth','homeValue'];

function format(value:number,unit:string):string{
  if(unit==='USD')return new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0}).format(value);
  if(unit==='%')return `${value}%`;
  return new Intl.NumberFormat('en-US').format(value);
}

/** -1 lower, 0 equal, 1 higher: primary compared with one other value. Exact, no band. */
export function compareValues(primary:number,other:number):-1|0|1{
  return primary===other?0:primary>other?1:-1;
}

/** True when the gap is under the flagging band: survey error alone often produces gaps this size. */
export function isSmallGap(primary:number,other:number,unit:string):boolean{
  if(unit==='%')return Math.abs(primary-other)<CLOSE_POINTS;
  if(other===0)return primary===0;
  return Math.abs((primary-other)/other)<CLOSE_RELATIVE;
}

/** The gap in words: "$16,287 (21%)" for levels, "2.4 points" for rates. */
export function describeGap(primary:number,other:number,unit:string):string{
  const gap=Math.abs(primary-other);
  if(unit==='%'){
    const points=Math.round(gap*10)/10;
    return `${points} ${points===1?'point':'points'}`;
  }
  const amount=format(gap,unit);
  if(other===0)return amount;
  const relative=gap/Math.abs(other)*100;
  const rounded=relative<10?Math.round(relative*10)/10:Math.round(relative);
  return `${amount} (${rounded}%)`;
}

function listPlaces(names:string[]):string{
  if(names.length<=1)return names.join('');
  return `${names.slice(0,-1).join(', ')} and ${names.at(-1)}`;
}

function lowerFirst(label:string):string{
  return label.charAt(0).toLowerCase()+label.slice(1);
}

function listLabels(labels:string[]):string{
  return listPlaces(labels.map(lowerFirst));
}

export function summarizeEvidence(primaryIn:SummaryPlace,comparisonsIn:SummaryPlace[]|undefined|null):EvidenceSummary{
  // Saved decisions from older schema versions may lack comparisons or carry non-numeric values.
  const usable=(place:SummaryPlace):SummaryPlace=>({location:place?.location||'This place',metrics:(place?.metrics||[]).filter(metric=>typeof metric?.value==='number'&&Number.isFinite(metric.value))});
  const primary=usable(primaryIn);
  const comparisons=(comparisonsIn||[]).map(usable);
  const limits='These figures describe the people who live in each place. They do not measure demand for your business, competitors, rent or foot traffic, so on their own they cannot recommend a location.';
  const method=`None of these differences has been tested for statistical significance. Census figures are survey estimates with margins of error, which this report does not show yet and which are wider for smaller places. Gaps under ${Math.round(CLOSE_RELATIVE*100)}% (or under ${CLOSE_POINTS} points for population change) are flagged as small because survey error alone often produces gaps that size. The flag is a reading aid, not a test: a larger gap can also fall within the error, especially for smaller places.`;
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
  const smallGaps:string[]=[];
  let everyGapSmall=true;
  const keys=[...ORDER.filter(key=>mine.has(key)),...[...mine.keys()].filter(key=>!ORDER.includes(key))];
  for(const key of keys){
    const metric=mine.get(key)!;
    const others=theirs.filter(place=>place.metrics.has(key));
    if(!others.length)continue;
    const results=others.map(place=>{
      const value=place.metrics.get(key)!.value;
      return {location:place.location,value,cmp:compareValues(metric.value,value),small:isSmallGap(metric.value,value,metric.unit),gap:describeGap(metric.value,value,metric.unit)};
    });
    const higher=results.filter(r=>r.cmp===1), lower=results.filter(r=>r.cmp===-1);
    let position:Position;
    if(!higher.length&&!lower.length)position='equal';
    else if(!lower.length)position='higher';
    else if(!higher.length)position='lower';
    else position='mixed';
    const parts=results.map(r=>{
      const other=`${r.location} (${format(r.value,metric.unit)})`;
      if(r.cmp===0)return `the same figure as ${other}`;
      return `${r.gap} ${r.cmp===1?'higher':'lower'} than ${other}${r.small?', a small gap that may not be real':''}`;
    });
    if(results.some(r=>!r.small))everyGapSmall=false;
    for(const r of results)if(r.small&&r.cmp!==0)smallGaps.push(`${lowerFirst(metric.label)} against ${r.location} (${r.gap})`);
    findings.push({
      key,
      label:metric.label,
      position,
      detail:`${format(metric.value,metric.unit)}: ${parts.join('; ')}.`,
      smallGap:results.some(r=>r.small),
    });
  }

  const others=listPlaces(comparisons.map(place=>place.location));
  const all=comparisons.length===1?others:comparisons.length===2?`both ${others}`:`each of ${others}`;

  // Every gap is small: say the figures cannot separate the places, without declaring them equal.
  if(findings.length&&everyGapSmall){
    return {
      kind:'small_differences',
      headline:`${primary.location} and ${others} differ only slightly on every measure here: each gap is under ${Math.round(CLOSE_RELATIVE*100)}% (or ${CLOSE_POINTS} points for population change). Gaps this small can come from survey error alone, so these figures do not tell the places apart.`,
      findings,
      limits,
      method,
    };
  }

  const higher=findings.filter(f=>f.position==='higher').map(f=>f.label);
  const lower=findings.filter(f=>f.position==='lower').map(f=>f.label);
  const mixed=findings.filter(f=>f.position==='mixed').map(f=>f.label);
  const clauses:string[]=[];
  if(higher.length)clauses.push(`higher ${listLabels(higher)} than ${all}`);
  if(lower.length)clauses.push(`lower ${listLabels(lower)} than ${higher.length?(comparisons.length===1?'it':comparisons.length===2?'both':'each of them'):all}`);
  // Conflicting results are named in the headline too, so it never reads as one-sided.
  const mixedNote=clauses.length&&mixed.length?` It is higher than some places and lower than others on ${listLabels(mixed)}.`:'';
  const smallNote=smallGaps.length
    ? smallGaps.length===1
      ? ` One gap is small and may not be real: ${smallGaps[0]}.`
      : ` Some gaps are small and may not be real: ${smallGaps.slice(0,3).join('; ')}${smallGaps.length>3?`; and ${smallGaps.length-3} more`:''}.`
    : '';
  const headline=clauses.length
    ? `${primary.location} has ${clauses.join(', and ')}.${mixedNote}${smallNote}`
    : `${primary.location} is higher than some places and lower than others; no measure sets it apart from ${all}.${smallNote}`;
  return {kind:'differences',headline,findings,limits,method};
}
