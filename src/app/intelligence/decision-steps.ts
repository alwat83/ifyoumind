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
  const electricity = /\b(?:electricity|electric|energy|power)[ -]+(?:bill|statement|rate|tariff|price)s?\b/i.test(question);
  if (tax && electricity) return 'mixed';

  const individual = /\b(?:my|our)\b/i.test(question);
  const change = /\b(?:chang(?:e[ds]?|ing)|increas(?:e[ds]?|ing)|decreas(?:e[ds]?|ing)|rose|fell|went (?:up|down)|go(?:ne|ing)? (?:up|down)|higher than last|lower than last|compare (?:my|our))\b/i.test(question);
  if (tax) {
    if (/\b(?:appeal\w*|contest|dispute|overpa\w+|assessment (?:error|correct|wrong)|wrong|incorrect|should (?:be|pay)|fair|exemptions?|(?:owe|pay)|parcel|(?:this|my|our|a) (?:house|home)|this property)\b/i.test(question)) return 'tax-check';
    if (/\b(?:rates?|millage|average|median|which (?:city|county|state))\b/i.test(question)) return 'local-tax';
    return individual && change ? 'tax-bill' : 'local-tax';
  }
  if (electricity) {
    if (/\b(?:rates?|tariffs?|prices?|overpay\w*|wrong|should (?:be|pay)|fair)\b/i.test(question)) return 'local-electricity';
    return individual && change ? 'electricity-bill' : 'local-electricity';
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
