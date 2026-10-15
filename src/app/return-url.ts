// Decides where someone goes after signing in. Only pages inside the signed-in app are accepted,
// and the address is rebuilt from an allowlist of paths and query parameters, so a link can never
// send a visitor to another site or replay something like ?checkout=success.
// Kept free of Angular so test/return-url.test.mjs can run it directly.

export const DEFAULT_RETURN_URL='/app';

const PATHS=[
  /^\/app$/,
  /^\/app\/decide$/,
  /^\/app\/pricing$/,
  /^\/app\/account$/,
  /^\/app\/result\/[A-Za-z0-9_-]{1,64}$/,
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
  if(!PATHS.some(path=>path.test(url.pathname)))return null;
  const kept=new URLSearchParams();
  url.searchParams.forEach((v,k)=>{if(PARAMS[k]?.test(v)&&!kept.has(k))kept.set(k,v);});
  const query=kept.toString();
  return query?`${url.pathname}?${query}`:url.pathname;
}

/** Query parameters for the sign-in page, carrying a return path only when it is safe and useful. */
export function loginParams(currentUrl:string):Record<string,string>{
  const back=safeReturnUrl(currentUrl);
  return back&&back!==DEFAULT_RETURN_URL?{returnUrl:back}:{};
}
