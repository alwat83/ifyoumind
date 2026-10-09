import { createHmac, timingSafeEqual } from 'node:crypto';

export function validStripeSignature(
  payload:string,
  header:string,
  secret:string,
  nowSeconds=Math.floor(Date.now()/1000),
):boolean{
  const pieces=header.split(',');
  const timestamp=pieces.find(part=>part.startsWith('t='))?.slice(2);
  const signatures=pieces.filter(part=>part.startsWith('v1=')).map(part=>part.slice(3));
  if(!timestamp||!signatures.length)return false;
  const parsedTimestamp=Number(timestamp);
  if(!Number.isFinite(parsedTimestamp)||Math.abs(nowSeconds-parsedTimestamp)>300)return false;
  const expected=createHmac('sha256',secret).update(`${timestamp}.${payload}`).digest('hex');
  const expectedBuffer=Buffer.from(expected);
  return signatures.some(signature=>{
    const actual=Buffer.from(signature);
    return actual.length===expectedBuffer.length&&timingSafeEqual(actual,expectedBuffer);
  });
}

export function grantsPro(status:unknown):boolean{
  return status==='active'||status==='trialing';
}

export function shouldApplySubscriptionEvent(
  incomingCreated:unknown,
  lastAppliedCreated:unknown,
):boolean{
  const incoming=Number(incomingCreated);
  const previous=Number(lastAppliedCreated);
  if(!Number.isFinite(incoming))return false;
  if(!Number.isFinite(previous))return true;
  return incoming>=previous;
}
