// Decides where someone goes after signing in. Only pages inside the signed-in app are accepted,
// and the address is rebuilt from an allowlist of paths and query parameters, so a link can never
// send a visitor to another site or replay something like ?checkout=success.
// Kept free of Angular so test/return-url.test.mjs can run it directly.

export const DEFAULT_RETURN_URL='/decisions';

export const LEGACY_CONSUMER_ROUTES = [
  { from: 'app', to: 'decisions' },
  { from: 'app/decide', to: 'decide' },
  { from: 'app/result/:projectId', to: 'decisions' },
  { from: 'app/pricing', to: 'pricing' },
  { from: 'app/growth', to: 'growth' },
  { from: 'app/account', to: 'account' },
  { from: 'app/data', to: 'data' },
  { from: 'app/ask', to: 'ask' },
  { from: 'app/advanced', to: 'advanced' },
] as const;

const PATHS=[
  /^\/decisions$/,
  /^\/decide$/,
  /^\/pricing$/,
  /^\/account$/,
  /^\/decisions\/[A-Za-z0-9_-]{1,64}$/,
];

const PARAMS:Record<string,RegExp>={
  type:/^[a-z_]{1,32}$/,
  intent:/^report$/,
  offer:/^(report|pro)$/,
  projectId:/^[A-Za-z0-9_-]{1,64}$/,
};

const BASE='https://return-url.invalid';

/** A safe in-app path to return to, or null when the value is missing or not allowed. */
export function safeReturnUrl(value:unknown):string|null{
  if(typeof value!=='string'||value.length===0||value.length>512)return null;
  if(!value.startsWith('/')||value.startsWith('//'))return null;
  if(/[\\\s\u0000-\u001f\u007f]/.test(value)||/%(2f|5c|00)/i.test(value))return null;
  let url:URL;
  try{url=new URL(value,BASE);}catch{return null;}
  if(url.origin!==BASE||url.hash||url.username||url.password)return null;
  const legacy = LEGACY_CONSUMER_ROUTES.find(route => '/' + route.from === url.pathname);
  const pathname = legacy ? '/' + legacy.to : url.pathname.replace(/^\/app\/result\//, '/decisions/');
  if(!PATHS.some(path=>path.test(pathname)))return null;
  const kept=new URLSearchParams();
  url.searchParams.forEach((v,k)=>{if(PARAMS[k]?.test(v)&&!kept.has(k))kept.set(k,v);});
  const query=kept.toString();
  return query?`${pathname}?${query}`:pathname;
}

/** Query parameters for the sign-in page, carrying a return path only when it is safe and useful. */
export function loginParams(currentUrl:string):Record<string,string>{
  const back=safeReturnUrl(currentUrl);
  return back&&back!==DEFAULT_RETURN_URL?{returnUrl:back}:{};
}


/** Only known decision context survives account creation and verification. */
export function decisionReturnUrl(value: unknown): string | null {
  const safe = safeReturnUrl(value);
  if (!safe) return null;
  const url = new URL(safe, BASE);
  if (url.pathname !== '/decide') return null;
  const params = new URLSearchParams();
  const type = url.searchParams.get('type');
  if (type === 'business' || type === 'compare' || type === 'growth') params.set('type', type);
  if (url.searchParams.get('intent') === 'report') params.set('intent', 'report');
  return url.pathname + (params.size ? '?' + params : '');
}
