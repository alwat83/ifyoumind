export type DecisionType = 'business' | 'compare' | 'growth' | 'custom';
export type BillIntent = 'local-tax' | 'tax-check' | 'tax-bill' | 'local-electricity' | 'electricity-bill' | 'mixed';

export const decisionPrompts: Record<DecisionType, string> = {
  business: 'Should I open this business here?',
  compare: 'How do these cities compare?',
  growth: 'Is this area growing?',
  custom: '',
};

export function decisionType(value: unknown): DecisionType {
  return value === 'business' || value === 'compare' || value === 'growth' ? value : 'custom';
}

/** Route supported topics conservatively. Never infer a jurisdiction, amount or cause. */
export function billIntent(question: string): BillIntent | null {
  const tax = /\b(?:(?:property|real estate)[ -]+tax(?:es)?|millage)\b/i.test(question);
  const electricity = /\b(?:electricity|electric|energy|power)[ -]+(?:bill|statement|rate|tariff|price|cost)s?\b|\b(?:cost|price) of electricity\b/i.test(question);
  if (tax && electricity) return 'mixed';

  const personalTax = /\b(?:my|our) (?:(?:property|real estate)[ -]+tax(?:es)?|tax (?:bill|statement)s?)\b/i.test(question);
  const personalElectricity = /\b(?:my|our) (?:electricity|electric|energy|power)[ -]+(?:bill|statement|cost)s?\b/i.test(question);
  const change = /\b(?:chang(?:e[ds]?|ing)|increas(?:e[ds]?|ing)|decreas(?:e[ds]?|ing)|rose|fell|went (?:up|down)|go(?:ne|ing)? (?:up|down)|higher than last|lower than last|compare (?:my|our))\b/i.test(question);
  if (tax) {
    if (/\b(?:appeal\w*|contest|dispute|overpa\w+|assessment (?:error|correct|wrong)|wrong|incorrect|should (?:be|pay)|fair|exemptions?|(?:owe|pay)|parcel|(?:this|my|our|a) (?:house|home)|this property)\b/i.test(question)) return 'tax-check';
    if (/\b(?:rates?|millage|average|median|which (?:city|county|state)|(?:in|across) (?:my|our|this|the) (?:city|county|state|area))\b/i.test(question)) return 'local-tax';
    if (personalTax && change) return 'tax-bill';
    return personalTax ? 'tax-check' : 'local-tax';
  }
  if (electricity) {
    if (/\b(?:rates?|tariffs?|prices?|overpay\w*|wrong|should (?:be|pay)|fair)\b/i.test(question)) return 'local-electricity';
    return personalElectricity && change ? 'electricity-bill' : 'local-electricity';
  }
  return null;
}

/** Suggestions are illustrative shortcuts, not a city directory or proof of a Census match. */
const sampleCities = ['Austin, TX', 'Charlotte, NC', 'Columbus, OH', 'Denver, CO', 'Madison, WI', 'Nashville, TN', 'Raleigh, NC', 'Springfield, IL'];
const states = 'AL AK AZ AR CA CO CT DE DC FL GA HI ID IL IN IA KS KY LA ME MD MA MI MN MS MO MT NE NV NH NJ NM NY NC ND OH OK OR PA RI SC SD TN TX UT VT VA WA WV WI WY'.split(' ');
const stateNames = 'Alabama|Alaska|Arizona|Arkansas|California|Colorado|Connecticut|Delaware|District of Columbia|Florida|Georgia|Hawaii|Idaho|Illinois|Indiana|Iowa|Kansas|Kentucky|Louisiana|Maine|Maryland|Massachusetts|Michigan|Minnesota|Mississippi|Missouri|Montana|Nebraska|Nevada|New Hampshire|New Jersey|New Mexico|New York|North Carolina|North Dakota|Ohio|Oklahoma|Oregon|Pennsylvania|Rhode Island|South Carolina|South Dakota|Tennessee|Texas|Utah|Vermont|Virginia|Washington|West Virginia|Wisconsin|Wyoming'.split('|');

export function sampleCityMatches(value: string): string[] {
  const prefix = value.trim().toLowerCase();
  if (prefix.length < 2 || prefix.includes(',')) return [];
  return sampleCities.filter(city => city.toLowerCase().startsWith(prefix)).slice(0, 4);
}

/** Friendly format check only; the existing callable still verifies the actual place. */
export function formattedCity(value: string): string | null {
  const match = /^([^,]+),\s*([^,]+)$/.exec(value.trim());
  if (!match || value.trim().length > 160) return null;
  const city = match[1].trim().replace(/\s+/g, ' ');
  const rawState = match[2].trim().toUpperCase().replace(/\s+/g, ' ');
  const state = states.includes(rawState) ? rawState : states[stateNames.findIndex(name => name.toUpperCase() === rawState)];
  return state && /\p{L}/u.test(city) ? `${city}, ${state}` : null;
}

export function placeKey(formatted: string): string {
  return formatted.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

type CityIntent = 'cost-of-living' | 'housing' | 'city-comparison' | 'city' | 'unclear';
export interface CityQuestion {
  intent: CityIntent;
  location: string | null;
  comparison: string | null;
  needsComparison: boolean;
  annualSalary: number | null;
}

// Conventional names in a city question. Bare names with plausible alternatives (e.g. Birmingham
// or Springfield) need an explicit state. The callable still verifies every recognized place.
const establishedCities = new Map([
  ['los angeles', 'Los Angeles, CA'],
  ['new york city', 'New York, NY'],
]);
const stateAliases = new Map([['ala', 'AL'], ['calif', 'CA']]);
const stateSuffix = new RegExp(`^(.*?)\\s*(?:,\\s*|\\s+|\\(\\s*)(${[...stateNames, ...stateAliases.keys(), ...states].sort((a, b) => b.length - a.length).join('|')})\\.?\\s*\\)?$`, 'i');
const comparisonSeparator = /\s+(?:and|or|versus|vs\.?|compared? (?:with|to)|relative to|with|to)\s+/i;
const costTopic = /\b(?:cost[ -]of[ -]living|costs? (?:of|to) liv(?:e|ing)|living (?:costs?|expenses?)|purchasing power|salary equivalent|(?:cheaper|more expensive) to live)\b/i;
const housingTopic = /\b(?:housing|home (?:prices?|values?)|(?:median |average )?rent(?:s|al costs?)?)\b/i;
const salaryAmount = /\b(?:\d{1,3}(?:,\d{3})+|\d+)(?:\.\d{1,2})?[ \t]*[kK]?\b/g;

function annualSalary(question: string): number | null {
  if (/\b(?:hourly|monthly|weekly|biweekly|a month|a week|an hour|per (?:month|week|hour)|\/\s*(?:mo(?:nth)?|wk|hr|month|week|hour))\b/i.test(question)) return null;
  const amounts = [...question.matchAll(salaryAmount)].filter(match => {
    const start = match.index!;
    const before = question.slice(0, start);
    const after = question.slice(start + match[0].length);
    const money = /\$\s*$/.test(before) || /k$/i.test(match[0]);
    return /\b(?:(?:salary|income|earnings)(?:\s+(?:of|is))?|mak(?:e[sd]?|ing)|earn(?:s|ed|ing)?)\s+(?:an?\s+)?\$?\s*$/i.test(before) ||
      (money && /\b(?:on|with)\s+(?:an?\s+)?\$?\s*$/i.test(before)) ||
      /^\s*(?:a year|per year|annually|annual(?:ly)?\b|(?:annual\s+)?salary\b|(?:annual\s+)?income\b|\/\s*(?:yr|year)\b)/i.test(after);
  });
  if (amounts.length !== 1) return null;
  const match = amounts[0];
  const start = match.index!;
  const end = start + match[0].length;
  // Reject partial numbers, ranges, negatives and amounts explicitly using another currency.
  if (/(?:[\d.,+−€£-]|\b(?:CAD|EUR|GBP|AUD|about|around|roughly|over|under|at least|up to))\s*\$?\s*$/i.test(question.slice(0, start))) return null;
  if (/^\s*(?:[\d.,]\d|[+−–—-]|(?:to|or|plus)\s+\$?\d|(?:CAD|EUR|GBP|AUD|euros?|pounds?)\b)/i.test(question.slice(end))) return null;
  const amount = match[0].trim();
  const value = Number(amount.replace(/[,k]/gi, '').trim()) * (/k$/i.test(amount) ? 1000 : 1);
  return value > 0 && value <= 100_000_000 ? value : null;
}

function namedPlace(value: string): string | null {
  const phrase = value.trim().replace(/^the city of\s+/i, '').replace(/[,?.!]+$/, '').trim();
  if (phrase === 'LA' || /^L\.A\.?$/.test(phrase)) return 'Los Angeles, CA';
  if (phrase === 'NYC') return 'New York, NY';
  const familiar = establishedCities.get(phrase.toLowerCase());
  if (familiar) return familiar;
  const match = stateSuffix.exec(phrase);
  if (!match) return null;
  const city = match[1].trim();
  const state = match[2];
  if (!/^[\p{L}][\p{L}.'’ -]{0,99}$/u.test(city) || /\b(?:what|which|should|how|where|here|there|and|with|than|or|versus|cost|salary)\b/i.test(city)) return null;
  // With no comma, don't use lowercase words like “in” and “or” as postal codes.
  if (state.length === 2 && /^(?:in|or|me|hi|ok|id)$/i.test(state) && state !== state.toUpperCase() && !phrase.includes(',')) return null;
  return formattedCity(`${city.replace(/\s+/g, ' ')}, ${stateAliases.get(state.toLowerCase()) ?? state}`);
}

/** Extract only phrases grounded in the question. The existing manual fields handle all other wording. */
export function understandCityQuestion(value: string): CityQuestion {
  const question = value.trim();
  const cost = costTopic.test(question);
  const housing = housingTopic.test(question);
  const comparisonRequested = /\b(?:between|versus|vs\.?|compar(?:e[ds]?|ing|ison)|(?:mov\w*|relocat\w*) from)\b/i.test(question) ||
    (cost && /\bor\b/i.test(question));
  const geographic = /\b(?:city|cities|market|population|household income|area|here|grow\w*|relocat\w*|open (?:a|an|my|this))\b/i.test(question);
  const start = /\bbetween\s+|\b(?:mov\w*|relocat\w*) from\s+|\b(?:cost of living|living costs?|housing|rent) (?:in|for)\s+/i.exec(question) ??
    /\bin\s+/i.exec(question);
  let clause = start ? question.slice(start.index + start[0].length) : question.replace(
    /^(?:(?:please\s+)?compar(?:e|ing)\s+|how (?:do|does|would)\s+|(?:cost of living|living costs?)\s*:\s*)/i, '');
  clause = clause.replace(/(?:[,:]\s*|\s+)(?:if\b|assuming\b|on\s+(?:an?\s+)?\$?\s*\d|with\s+(?:an?\s+)?(?:(?:annual\s+)?(?:salary|income)\b|\$?\s*\d)|for\s+(?:someone|a person)\b).*$/i, '');
  clause = clause.replace(/\s+(?:for|on)\s+(?:housing|(?:the\s+)?cost of living|living costs?|population|(?:median\s+)?household income)\b.*$/i, '');
  clause = clause.replace(/\s+(?:cost of living|living costs?|housing costs?)\s*[?!]?$/i, '');
  const parts = comparisonRequested ? clause.split(comparisonSeparator) : [clause];
  const location = namedPlace(parts[0]);
  const comparison = parts.length === 2 ? namedPlace(parts[1]) : null;
  const candidatePair = parts.length === 2 && parts.every(part => /^\p{Lu}[\p{L}.'’ -]*[?.!]?$/u.test(part.trim()));
  const cityComparison = comparisonRequested && (geographic || !!location || !!comparison || candidatePair);
  const intent = cost ? 'cost-of-living' : housing ? 'housing' : cityComparison ? 'city-comparison' : geographic || location ? 'city' : 'unclear';
  return {
    intent, location, comparison: comparison && placeKey(comparison) !== placeKey(location ?? '') ? comparison : null,
    needsComparison: comparisonRequested, annualSalary: cost ? annualSalary(question) : null,
  };
}
