export type DecisionType = 'business' | 'compare' | 'growth' | 'custom';
export type BillExample = 'tax' | 'electricity';

export const decisionPrompts: Record<DecisionType, string> = {
  business: 'Should I open this business here?',
  compare: 'How do these cities compare?',
  growth: 'Is this area growing?',
  custom: '',
};

export function decisionType(value: unknown): DecisionType {
  return value === 'business' || value === 'compare' || value === 'growth' ? value : 'custom';
}

/** Only recognize clearly named bill topics. This is routing, never an interpretation of the question. */
export function billExample(question: string): BillExample | null {
  const tax = /\bproperty[ -]+tax(?:es)?\b/i.test(question) && /\b(?:my|our|bill|statement)\b/i.test(question);
  const electricity = /\b(?:electricity|electric|energy|power)\s+(?:bill|statement)s?\b/i.test(question);
  return tax === electricity ? null : tax ? 'tax' : 'electricity';
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
