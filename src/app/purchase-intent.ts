// Remembers that a visitor came from the sample report wanting the $79 Decision Report, so the
// prompt can reappear once their first decision exists. It only changes what the app suggests:
// sign-up, email verification and Stripe checkout all still happen as usual.
// Kept free of Angular so test/purchase-intent.test.mjs can run it directly.

export type PurchaseIntent='report';

const KEY='ifm_purchase_intent';
const MAX_AGE_MS=24*60*60*1000;

export function parseIntent(value:unknown):PurchaseIntent|null{
  return value==='report'?'report':null;
}

interface StorageLike { getItem(key:string):string|null; setItem(key:string,value:string):void; removeItem(key:string):void; }

function storage():StorageLike|null{
  try{return typeof sessionStorage==='undefined'?null:sessionStorage;}catch{return null;}
}

export function rememberIntent(intent:PurchaseIntent|null,now=Date.now(),store:StorageLike|null=storage()):void{
  if(!intent||!store)return;
  try{store.setItem(KEY,JSON.stringify({intent,at:now}));}catch{/* storage blocked: the query parameter still carries it */}
}

export function readIntent(now=Date.now(),store:StorageLike|null=storage()):PurchaseIntent|null{
  if(!store)return null;
  try{
    const saved=JSON.parse(store.getItem(KEY)||'null');
    if(!saved||now-Number(saved.at)>MAX_AGE_MS)return null;
    return parseIntent(saved.intent);
  }catch{return null;}
}

export function clearIntent(store:StorageLike|null=storage()):void{
  try{store?.removeItem(KEY);}catch{/* nothing to clear */}
}

/** Query parameters for the next step, carrying the intent when there is one. */
export function intentParams(base:Record<string,string>,intent:PurchaseIntent|null):Record<string,string>{
  return intent?{...base,intent}:base;
}
