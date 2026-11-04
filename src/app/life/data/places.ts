// ifYouMind Life, place data contract (L2): official price levels and rents per metro/micro area.
// Built by scripts/life-data/build.py from BEA, ACS and OMB files; see docs/life/l2-data-sources.md.
// Pure functions, no I/O: the caller loads the JSON and passes it in.
import type {OptionInput} from '../engine/types';

export const PLACES_SCHEMA='ifyoumind.life.places/1';

/** BEA Regional Price Parities, U.S. = 100, plus the derived non-housing composite. */
export interface PriceLevels { all:number; goods:number; housing:number; utilities:number; other:number; nonHousing:number }
export interface AreaPrice extends PriceLevels {
  /** 'metro': the area's own BEA value. 'state_nonmetro': the state's nonmetropolitan portion (includes micropolitan counties). */
  source:'metro'|'state_nonmetro';
  /** BEA GeoFIPS of the value used, e.g. "12420" or "46999". */
  geo:string;
}
/** ACS 5-year estimate and its 90 percent margin of error, dollars per month. */
export interface Estimate { e:number; m:number|null }
export interface Area {
  name:string;
  type:'metro'|'micro';
  states:string[];
  primaryState:string;
  /** null when BEA has no value for the area or a fallback (e.g. Puerto Rico). */
  price:AreaPrice|null;
  /** Median gross rent: all units, 1 bedroom, 2 bedrooms. null when the ACS has no usable estimate. */
  rent:{all:Estimate|null; br1:Estimate|null; br2:Estimate|null};
}
export interface PlacesDataset {
  schema:string;
  version:string;
  sources:Record<string,{title:string; files:{url:string; sha256:string}[]; [k:string]:unknown}>;
  method:{priceLevel:'nonHousing'; nonHousing:{status:string; weights:{goods:number; other:number}; [k:string]:unknown}; [k:string]:unknown};
  national:{us:PriceLevels; usNonmetro:PriceLevels};
  stateNonmetro:Record<string,PriceLevels&{name:string; geo:string}>;
  areas:Record<string,Area>;
  /** [principal city, USPS state, CBSA code] */
  places:[string,string,string][];
  gaps:[string,string,string][];
  excluded:[string,string,string][];
}

const PRICE_KEYS:(keyof PriceLevels)[]=['all','goods','housing','utilities','other','nonHousing'];
// Housing and utility parities spread much wider than the rest (2024: 42–212 and 70–203).
const level=(v:unknown,k:keyof PriceLevels)=>typeof v==='number'&&Number.isFinite(v)&&(k==='housing'||k==='utilities'?v>=20&&v<=400:v>=50&&v<=200);
const dollars=(v:unknown)=>typeof v==='number'&&Number.isInteger(v)&&v>0&&v<10000;

/** Every problem found, as text; empty when the dataset matches the contract. */
export function validatePlaces(d:any):string[] {
  const errors:string[]=[];
  if(!d||typeof d!=='object')return ['not an object'];
  if(d.schema!==PLACES_SCHEMA)errors.push(`schema is ${d.schema}, expected ${PLACES_SCHEMA}`);
  if(typeof d.version!=='string'||!/^\d{4}-\d+$/.test(d.version))errors.push('version must look like 2024-1');
  for(const [id,s] of Object.entries<any>(d.sources??{}))
    if(!s?.title||!Array.isArray(s.files)||!s.files.length||s.files.some((f:any)=>!/^https:\/\//.test(f.url)||!/^[0-9a-f]{64}$/.test(f.sha256)))errors.push(`source ${id}: needs a title and files with https url and sha256`);
  const w=d.method?.nonHousing?.weights;
  if(!w||Math.abs(w.goods+w.other-1)>1e-9||w.goods<=0||w.other<=0)errors.push('method.nonHousing.weights must be positive and sum to 1');
  const checkLevels=(where:string,p:any)=>{for(const k of PRICE_KEYS)if(!level(p?.[k],k))errors.push(`${where}: ${k} is not a price level`);};
  checkLevels('national.us',d.national?.us);
  checkLevels('national.usNonmetro',d.national?.usNonmetro);
  const areas=Object.entries<any>(d.areas??{});
  if(!areas.length)errors.push('no areas');
  for(const [code,a] of areas){
    if(!/^\d{5}$/.test(code))errors.push(`area ${code}: code must be 5 digits`);
    if(!a.name||!['metro','micro'].includes(a.type)||!Array.isArray(a.states)||!a.states.includes(a.primaryState))errors.push(`area ${code}: name, type or states invalid`);
    if(a.price!==null){
      checkLevels(`area ${code}`,a.price);
      if(!['metro','state_nonmetro'].includes(a.price?.source))errors.push(`area ${code}: unknown price source`);
      if(a.price?.source==='metro'&&a.price.geo!==code)errors.push(`area ${code}: metro price from another area`);
      if(a.price?.source==='state_nonmetro'&&!/^\d{2}999$/.test(a.price.geo))errors.push(`area ${code}: nonmetro price geo invalid`);
      if(a.price&&(a.price.nonHousing<Math.min(a.price.goods,a.price.other)-.001||a.price.nonHousing>Math.max(a.price.goods,a.price.other)+.001))errors.push(`area ${code}: nonHousing outside goods..other`);
    }
    for(const k of ['all','br1','br2']){
      const r=a.rent?.[k];
      if(r===undefined)errors.push(`area ${code}: rent.${k} missing (use null)`);
      else if(r!==null&&(!dollars(r.e)||(r.m!==null&&!(Number.isInteger(r.m)&&r.m>=0))))errors.push(`area ${code}: rent.${k} invalid`);
    }
  }
  for(const p of d.places??[])if(!Array.isArray(p)||p.length!==3||!d.areas?.[p[2]])errors.push(`place ${JSON.stringify(p)}: unknown area`);
  return errors;
}

/** Principal cities whose name starts with the query (case and accents ignored), best matches first. */
export function findPlaces(d:PlacesDataset,query:string,limit=8):{label:string; code:string; area:Area}[] {
  const norm=(s:string)=>s.normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase().replace(/[^a-z0-9 ]/g,' ').replace(/\s+/g,' ').trim();
  const q=norm(query);
  if(!q)return [];
  const [city,state]=q.split(/ (?=[a-z]{2}$)/);
  return d.places
    .filter(([name,st])=>norm(name).startsWith(state?city:q)&&(!state||st.toLowerCase()===state))
    .sort((a,b)=>(norm(a[0])===q?0:1)-(norm(b[0])===q?0:1)||(d.areas[a[2]].type==='metro'?0:1)-(d.areas[b[2]].type==='metro'?0:1)||a[0].localeCompare(b[0]))
    .slice(0,limit)
    .map(([name,st,code])=>({label:`${name}, ${st}`,code,area:d.areas[code]}));
}

/**
 * Engine price-level fields for an area. Uses the non-housing composite, because the engine subtracts
 * the user's own housing cost. With no BEA value, priceLevel is NaN so the engine warns and uses 100.
 */
export function priceInput(d:PlacesDataset,code:string):Pick<OptionInput,'priceLevel'|'priceLevelKind'|'priceLevelSource'|'priceLevelYear'|'priceLevelSourceId'> {
  const p=d.areas[code]?.price;
  const year=Number(d.version.slice(0,4));
  if(!p)return {priceLevel:NaN,priceLevelKind:'non_housing',priceLevelSource:'national_default',priceLevelYear:year,priceLevelSourceId:'bea-rpp-2024'};
  return {priceLevel:p.nonHousing,priceLevelKind:'non_housing',priceLevelSource:p.source,priceLevelYear:year,priceLevelSourceId:'bea-rpp-2024'};
}

/**
 * Rent estimate to prefill a housing cost, with its uncertainty, or null. Falls back from the asked
 * bedroom count to all units, and says so, rather than inventing a figure.
 */
export function rentEstimate(d:PlacesDataset,code:string,bedrooms:1|2):{monthly:number; moe:number|null; basis:'br1'|'br2'|'all'; sourceId:string}|null {
  const r=d.areas[code]?.rent;
  if(!r)return null;
  const key:'br1'|'br2'=bedrooms===1?'br1':'br2';
  const pick=r[key]?{v:r[key]!,basis:key}:r.all?{v:r.all,basis:'all' as const}:null;
  if(!pick)return null;
  return {monthly:pick.v.e,moe:pick.v.m,basis:pick.basis,sourceId:pick.basis==='all'?'acs5-2024-b25064':'acs5-2024-b25031'};
}
