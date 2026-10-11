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

export interface MarketAnalysisSection {
  title:string;
  intro:string;
  paragraphs:Array<{heading:string;text:string}>;
  rankings:Array<{metric:string;unit:'people'|'USD'|'%';ordered:Array<{location:string;value:number}>}>;
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
  if(pct>1)return `Population grew ${pct}% between the 2019 and 2024 ACS 5-year estimates, indicating an expanding resident base.`;
  if(pct<0)return `Population declined ${Math.abs(pct)}% between the 2019 and 2024 ACS 5-year estimates, so the resident base is shrinking rather than growing.`;
  return `Population was broadly stable (${pct}%) between the 2019 and 2024 ACS 5-year estimates.`;
}

export function buildMarketAnalysis(input:{
  concept:string;
  primary:AnalysisPlace;
  comparisons:AnalysisPlace[];
  retrievedAt:string;
}):MarketAnalysisSection{
  const {primary,comparisons}=input;
  const business=businessPhrase(input.concept);
  const all=[primary,...comparisons];
  const n=all.length;
  const others=comparisons.map(place=>place.location);

  const byPopulation=rank(all,place=>place.population);
  const byIncome=rank(all,place=>place.income);
  const byHomeValue=rank(all,place=>place.homeValue);
  const byGrowth=rank(all,place=>place.populationChangePct);

  const where=(ordered:Array<{location:string}>)=>{
    const position=positionOf(ordered,primary.location);
    if(position===1)return 'the highest';
    if(position===ordered.length)return 'the lowest';
    return `${ordinal(position)} highest`;
  };

  const paragraphs:Array<{heading:string;text:string}>=[];

  paragraphs.push({
    heading:'Market size and growth',
    text:[
      `${primary.location} has an estimated population of ${count(primary.population)}.`,
      growthPhrase(primary.populationChangePct),
      n>1&&byGrowth.length===n
        ? `Of the ${n} locations evaluated, it has ${where(byGrowth)} five-year growth rate.`
        : '',
    ].filter(Boolean).join(' '),
  });

  const incomeComparison=comparisons.length
    ? ` That is ${where(byIncome)} of the ${n} locations evaluated (${comparisons.map(place=>`${place.location}: ${usd(place.income)}`).join('; ')}).`
    : '';
  paragraphs.push({
    heading:'Household purchasing power',
    text:`Median household income in ${primary.location} is ${usd(primary.income)}.${incomeComparison} Household income indicates how much local residents may be able to spend; it does not measure demand for ${business?`your ${business}`:'any specific business'}.`,
  });

  paragraphs.push({
    heading:'Property cost context',
    text:`The median home value in ${primary.location} is ${usd(primary.homeValue)}${comparisons.length?`, ${where(byHomeValue)} of the ${n} locations`:''}. Home values are a rough signal of local property costs, not commercial rents; occupancy costs${business?` for your ${business}`:''} need to be confirmed with lease quotes for the specific site.`,
  });

  if(comparisons.length){
    const leads:string[]=[];
    const trails:string[]=[];
    for(const [label,ordered] of [
      ['household income',byIncome],
      ['population growth',byGrowth],
      ['population',byPopulation],
    ] as const){
      if(ordered.length!==n)continue;
      const position=positionOf(ordered,primary.location);
      if(position===1)leads.push(label);
      if(position===n)trails.push(label);
    }
    const parts=[`Compared with ${others.join(' and ')},`];
    if(leads.length)parts.push(`${primary.location} leads on ${leads.join(' and ')}`);
    if(leads.length&&trails.length)parts.push('but');
    if(trails.length)parts.push(`trails on ${trails.join(' and ')}`);
    if(!leads.length&&!trails.length)parts.push(`${primary.location} sits between the comparison locations on every measure`);
    paragraphs.push({heading:'Comparative position',text:`${parts.join(' ')}.`});
  }

  const rankings:MarketAnalysisSection['rankings']=[
    {metric:'Population',unit:'people',ordered:byPopulation},
    {metric:'Median household income',unit:'USD',ordered:byIncome},
    {metric:'Median home value',unit:'USD',ordered:byHomeValue},
  ];
  if(byGrowth.length)rankings.push({metric:'5-year population change',unit:'%',ordered:byGrowth});

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
