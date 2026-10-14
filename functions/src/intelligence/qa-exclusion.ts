// Keeps QA and test activity out of founder metrics, computed at read time so nothing is written
// and accounts created before this code shipped are covered too.
//
// A workspace is excluded when its creator's Auth account is a QA identity:
// - an address on the reserved fixture domain (@qa.ifyoumind.test), always;
// - an address listed in Firestore `adminConfig/qaExclusion.emails` (the founder edits this in the
//   console; clients can never read or write it: firestore.rules has no match for adminConfig);
//   Gmail-style "+tag" aliases of a listed address match it;
// - an Auth account with the custom claim `qa: true`;
// - or the workspace id is listed in `adminConfig/qaExclusion.organizationIds`.

export const FIXTURE_DOMAIN='qa.ifyoumind.test';

export interface QaExclusionConfig{emails:string[];organizationIds:string[]}

export function parseQaExclusionConfig(data:unknown):QaExclusionConfig{
  const d=(data&&typeof data==='object'?data:{}) as Record<string,unknown>;
  const list=(value:unknown)=>Array.isArray(value)?value.filter((v):v is string=>typeof v==='string'&&v.trim().length>0).map(v=>v.trim()):[];
  return {emails:list(d.emails).map(canonicalEmail).filter(Boolean),organizationIds:list(d.organizationIds)};
}

/** Lower-cases and drops a "+tag" from the local part, so name+r1@x matches name@x. */
export function canonicalEmail(email:unknown):string{
  if(typeof email!=='string')return '';
  const trimmed=email.trim().toLowerCase();
  const at=trimmed.lastIndexOf('@');
  if(at<1)return '';
  return `${trimmed.slice(0,at).split('+')[0]}${trimmed.slice(at)}`;
}

export function isQaIdentity(user:{email?:string|null;customClaims?:Record<string,unknown>|null}|undefined|null,config:QaExclusionConfig):boolean{
  if(!user)return false;
  if(user.customClaims?.qa===true)return true;
  const email=canonicalEmail(user.email);
  if(!email)return false;
  if(email.endsWith(`@${FIXTURE_DOMAIN}`))return true;
  return config.emails.includes(email);
}

export interface ExclusionDeps{
  /** Workspace id → creator uid (null when the workspace no longer exists). */
  creatorsOf(organizationIds:string[]):Promise<Map<string,string|null>>;
  /** uid → Auth user record (email and custom claims); missing users are omitted. */
  usersOf(uids:string[]):Promise<Map<string,{email?:string|null;customClaims?:Record<string,unknown>|null}>>;
}

/** The subset of `organizationIds` that belong to QA identities. */
export async function excludedOrganizations(organizationIds:Iterable<string>,config:QaExclusionConfig,deps:ExclusionDeps):Promise<Set<string>>{
  const ids=[...new Set(organizationIds)].filter(Boolean);
  const excluded=new Set(ids.filter(id=>config.organizationIds.includes(id)));
  const remaining=ids.filter(id=>!excluded.has(id));
  if(!remaining.length)return excluded;
  const creators=await deps.creatorsOf(remaining);
  const uids=[...new Set([...creators.values()].filter((uid):uid is string=>!!uid))];
  const users=uids.length?await deps.usersOf(uids):new Map();
  for(const id of remaining){
    const uid=creators.get(id);
    if(uid&&isQaIdentity(users.get(uid),config))excluded.add(id);
  }
  return excluded;
}
