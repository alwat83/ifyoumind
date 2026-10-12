// Business-plan-style market analysis written deterministically from sourced Census figures.
// Every number in the output comes from the input; nothing is estimated or invented.

export interface AnalysisPlace {
  location:string;
  population:number;
  income:number;
  homeValue:number;
  populationChangePct:number|null;
  placeFips:string;
  stateFips:string;
}

export type AnalysisMetric='population'|'income'|'homeValue'|'growth';
export type AnalysisVerdict='higher'|'lower'|'similar'|'not-testable';
/** Difference-test results for the primary place against each comparison (from evidence.ts). */
export type AnalysisConfidence=(metric:AnalysisMetric,otherLocation:string)=>AnalysisVerdict|undefined;

export interface MarketAnalysisSection {
  title:string;
  intro:string;
  paragraphs:Array<{heading:string;text:string}>;
  rankings:Array<{metric:string;unit:'people'|'USD'|'%';ordered:Array<{location:string;value:number}>;note?:string}>;
  nextResearch:string[];
  citations:string[];
  disclaimer:string;
}

const usd=(value:number)=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0}).format(value);
const count=(value:number)=>new Intl.NumberFormat('en-US').format(value);
const ordinal=(n:number)=>{
  const suffix=n%100>=11&&n%100<=13?'th':({1:'st',2:'nd',3:'rd'} as Record<number,string>)[n%10]||'th';
  return `${n}${suffix}`;
};

/** "Specialty coffee shop." -> "specialty coffee shop"; keeps acronyms such as "HVAC company". */
export function conceptPhrase(concept:string):string{
  const cleaned=concept.trim().replace(/[.!?]+$/,'').replace(/\s+/g,' ');
  if(!cleaned)return 'business';
  const [first,...rest]=cleaned.split(' ');
  const keep=first.length>1&&first===first.toUpperCase();
  return [keep?first:first.charAt(0).toLowerCase()+first.slice(1),...rest].join(' ');
}

// The decision flow saves these labels when the customer leaves the business field blank.
// They describe the kind of decision, not a business, so they must not be written as one.
const GENERIC_CONCEPTS=new Set(['business','business concept','location decision','location comparison','market growth']);

/** The customer's business as a phrase, or null when no specific business was given. */
export function businessPhrase(concept:string):string|null{
  const phrase=conceptPhrase(concept);
  return GENERIC_CONCEPTS.has(phrase.toLowerCase())?null:phrase;
}

function rank(places:AnalysisPlace[],pick:(place:AnalysisPlace)=>number|null){
  return places
    .map(place=>({location:place.location,value:pick(place)}))
    .filter((row):row is {location:string;value:number}=>row.value!==null)
    .sort((a,b)=>b.value-a.value);
}

function positionOf(ordered:Array<{location:string}>,location:string):number{
  return ordered.findIndex(row=>row.location===location)+1;
}

function growthPhrase(pct:number|null):string{
  if(pct===null)return 'Five-year population change is not available for this place.';
  if(pct>1)return `Population grew ${pct}% between the 2015–2019 and 2020–2024 ACS 5-year estimates, indicating an expanding resident base.`;
  if(pct<0)return `Population declined ${Math.abs(pct)}% between the 2015–2019 and 2020–2024 ACS 5-year estimates, so the resident base is shrinking rather than growing.`;
  return `Population was broadly stable (${pct}%) between the 2015–2019 and 2020–2024 ACS 5-year estimates.`;
}

export function buildMarketAnalysis(input:{
  concept:string;
  primary:AnalysisPlace;
  comparisons:AnalysisPlace[];
  retrievedAt:string;
  /** When present, comparative wording follows the 90% difference tests instead of point estimates. */
  confidence?:AnalysisConfidence;
}):MarketAnalysisSection{
  const {primary,comparisons,confidence}=input;
  const business=businessPhrase(input.concept);
  const all=[primary,...comparisons];
  const n=all.length;
  const others=comparisons.map(place=>place.location);

  const byPopulation=rank(all,place=>place.population);
  const byIncome=rank(all,place=>place.income);
  const byHomeValue=rank(all,place=>place.homeValue);
  const byGrowth=rank(all,place=>place.populationChangePct);

  // Without difference tests, positions describe the estimates only and say so.
  const where=(ordered:Array<{location:string}>)=>{
    const position=positionOf(ordered,primary.location);
    if(position===1)return 'the highest estimate';
    if(position===ordered.length)return 'the lowest estimate';
    return `the ${ordinal(position)} highest estimate`;
  };
  const verdicts=(metric:AnalysisMetric)=>comparisons.map(place=>({location:place.location,verdict:confidence?.(metric,place.location)}));
  const tested=(metric:AnalysisMetric)=>!!confidence&&verdicts(metric).every(v=>v.verdict!==undefined);
  const clearlyAll=(metric:AnalysisMetric,verdict:'higher'|'lower')=>tested(metric)&&verdicts(metric).every(v=>v.verdict===verdict);
  /** "higher than A; statistically similar to B (within the margin of error)". */
  const relation=(metric:AnalysisMetric)=>{
    const groups:Record<AnalysisVerdict,string[]>={higher:[],lower:[],similar:[],'not-testable':[]};
    for(const v of verdicts(metric))groups[v.verdict as AnalysisVerdict].push(v.location);
    const parts:string[]=[];
    if(groups.higher.length)parts.push(`higher than ${groups.higher.join(' and ')}`);
    if(groups.lower.length)parts.push(`lower than ${groups.lower.join(' and ')}`);
    if(groups.similar.length)parts.push(`statistically similar to ${groups.similar.join(' and ')} (the difference is within the margin of error)`);
    if(groups['not-testable'].length)parts.push(`not reliably comparable with ${groups['not-testable'].join(' and ')}`);
    return parts.join('; ');
  };
  const standing=(metric:AnalysisMetric,ordered:Array<{location:string}>)=>{
    if(!tested(metric))return `${where(ordered)} of the ${n} locations evaluated (margins of error not checked)`;
    if(clearlyAll(metric,'higher'))return `clearly the highest of the ${n} locations evaluated`;
    if(clearlyAll(metric,'lower'))return `clearly the lowest of the ${n} locations evaluated`;
    return relation(metric);
  };

  const paragraphs:Array<{heading:string;text:string}>=[];

  paragraphs.push({
    heading:'Market size and growth',
    text:[
      `${primary.location} has an estimated population of ${count(primary.population)}.`,
      growthPhrase(primary.populationChangePct),
      n>1&&byGrowth.length===n
        ? `Its five-year growth rate is ${standing('growth',byGrowth)}.`
        : '',
    ].filter(Boolean).join(' '),
  });

  const incomeComparison=comparisons.length
    ? ` That is ${standing('income',byIncome)} (${comparisons.map(place=>`${place.location}: ${usd(place.income)}`).join('; ')}).`
    : '';
  paragraphs.push({
    heading:'Household purchasing power',
    text:`Median household income in ${primary.location} is ${usd(primary.income)}.${incomeComparison} Household income indicates how much local residents may be able to spend; it does not measure demand for ${business?`your ${business}`:'any specific business'}.`,
  });

  paragraphs.push({
    heading:'Property cost context',
    text:`The median home value in ${primary.location} is ${usd(primary.homeValue)}${comparisons.length?`, ${standing('homeValue',byHomeValue)}`:''}. Home values are a rough signal of local property costs, not commercial rents; occupancy costs${business?` for your ${business}`:''} need to be confirmed with lease quotes for the specific site.`,
  });

  if(comparisons.length){
    const leads:string[]=[];
    const trails:string[]=[];
    const unclear:string[]=[];
    for(const [label,metric,ordered] of [
      ['household income','income',byIncome],
      ['population growth','growth',byGrowth],
      ['population','population',byPopulation],
    ] as const){
      if(ordered.length!==n)continue;
      if(confidence){
        if(!tested(metric)){unclear.push(label);continue;}
        if(clearlyAll(metric,'higher'))leads.push(label);
        else if(clearlyAll(metric,'lower'))trails.push(label);
        else unclear.push(label);
        continue;
      }
      const position=positionOf(ordered,primary.location);
      if(position===1)leads.push(label);
      if(position===n)trails.push(label);
    }
    const parts=[`Compared with ${others.join(' and ')},`];
    const basis=confidence?'':' on the point estimates';
    if(leads.length)parts.push(`${primary.location} leads on ${leads.join(' and ')}${basis}`);
    if(leads.length&&trails.length)parts.push('but');
    if(trails.length)parts.push(`${leads.length?'':`${primary.location} `}trails on ${trails.join(' and ')}${basis}`);
    if(!leads.length&&!trails.length)parts.push(confidence?`${primary.location} is not clearly ahead or behind on any of these measures`:`${primary.location} sits between the comparison locations on every measure`);
    let text=`${parts.join(' ')}.`;
    if(confidence&&unclear.length)text+=` On ${unclear.join(' and ')}, the differences are within the margin of error or can't be tested, so the places shouldn't be ranked on them.`;
    if(!confidence)text+=' Margins of error were not checked, so small differences may not be real.';
    paragraphs.push({heading:'Comparative position',text});
  }

  const rankNote=(metric:AnalysisMetric)=>{
    if(!confidence||!tested(metric))return 'Ordered by estimate; margins of error not checked.';
    return verdicts(metric).every(v=>v.verdict==='higher'||v.verdict==='lower')
      ? undefined
      : 'Ordered by estimate. Some differences are within the margin of error, so the order is not a clear ranking.';
  };
  const rankings:MarketAnalysisSection['rankings']=[
    {metric:'Population',unit:'people',ordered:byPopulation,note:rankNote('population')},
    {metric:'Median household income',unit:'USD',ordered:byIncome,note:rankNote('income')},
    {metric:'Median home value',unit:'USD',ordered:byHomeValue,note:rankNote('homeValue')},
  ];
  if(byGrowth.length)rankings.push({metric:'5-year population change',unit:'%',ordered:byGrowth,note:rankNote('growth')});

  const retrieved=input.retrievedAt.slice(0,10);
  return {
    title:business?`Market analysis: ${business} in ${primary.location}`:`Market analysis: ${primary.location}`,
    intro:`This section summarizes public demographic evidence for ${business?`opening your ${business} in `:''}${primary.location}${comparisons.length?`, compared with ${others.join(' and ')}`:''}. It is written so it can be adapted for the market analysis section of a business plan.`,
    paragraphs,
    rankings: comparisons.length ? rankings : [],
    nextResearch:[
      `Count existing ${business?`${business} `:''}competitors serving the same customers in your intended trade area, and note their pricing and positioning.`,
      `Obtain two or three commercial lease quotes for suitable sites in ${primary.location} to replace home values with real occupancy costs.`,
      `Gather direct demand evidence for ${business?`your ${business}`:'your idea'}: customer interviews, pre-orders, a waitlist, or foot-traffic counts at candidate sites.`,
    ],
    citations:[
      `U.S. Census Bureau. American Community Survey 5-Year Estimates, 2020–2024: total population (B01003), median household income in 2024 inflation-adjusted dollars (B19013), median home value (B25077). Retrieved ${retrieved} from https://api.census.gov/data/2024/acs/acs5.`,
      `U.S. Census Bureau. American Community Survey 5-Year Estimates, 2015–2019: total population (B01003). Retrieved ${retrieved} from https://api.census.gov/data/2019/acs/acs5.`,
    ],
    disclaimer:'Prepared by ifYouMind from public U.S. Census Bureau data. Review and adapt it before using it in a business plan or sharing it with others. It is not financial, legal or lending advice, and it has not been reviewed or endorsed by any lender.',
  };
}

/** Plain-text version for pasting into a business plan document. */
export function marketAnalysisText(section:MarketAnalysisSection):string{
  return [
    section.title,
    '',
    section.intro,
    '',
    ...section.paragraphs.flatMap(p=>[p.heading,p.text,'']),
    'Further research before committing',
    ...section.nextResearch.map(item=>`- ${item}`),
    '',
    'Sources',
    ...section.citations,
  ].join('\n');
}
