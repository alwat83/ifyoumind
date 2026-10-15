// Keeps QA and test activity out of founder metrics, computed at read time so nothing is written
// and accounts created before this code shipped are covered too.
//
// Only explicit identifiers exclude anything. A workspace is excluded when:
// - its id is listed in `adminConfig/qaExclusion.organizationIds`;
// - its creator's uid is listed in `uids`;
// - its creator has the Admin SDK custom claim `qa: true`;
// - its creator's address is on the reserved fixture domain (@qa.ifyoumind.test). `.test` is
//   reserved (RFC 2606) and cannot receive mail, so no real customer can hold one;
// - its creator's address is listed exactly in `emails`, or is a "+tag" alias of an address listed
//   in `qaMailboxes` (a mailbox the founder declares is used only for QA). Address matches count
//   only when Firebase has verified the address, so nobody can opt out of the metrics, or hide a
//   payment, by signing up with an address they do not control.
// There is no Gmail-wide, alias-wide or domain-pattern rule: anything else counts as a customer.
//
// The founder edits `adminConfig/qaExclusion` in the Firebase console; clients can never read or
// write it (firestore.rules has no match for adminConfig, so every client request is denied).

export const FIXTURE_DOMAIN='qa.ifyoumind.test';

export interface QaExclusionConfig{
  emails:string[];
  qaMailboxes:string[];
  uids:string[];
  organizationIds:string[];
  /** Entries that were ignored because they are not a usable value (shown to the founder). */
  ignoredEntries:number;
}

export interface QaUser{email?:string|null;emailVerified?:boolean;customClaims?:Record<string,unknown>|null}

const ADDRESS=/^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function parseQaExclusionConfig(data:unknown):QaExclusionConfig{
  const d=(data&&typeof data==='object'?data:{}) as Record<string,unknown>;
  let ignoredEntries=0;
  const list=(value:unknown,valid:(v:string)=>boolean,normalize:(v:string)=>string=v=>v)=>{
    if(value===undefined)return [];
    if(!Array.isArray(value)){ignoredEntries++;return [];}
    const out:string[]=[];
    for(const raw of value){
      const v=typeof raw==='string'?normalize(raw.trim()):'';
      if(v&&valid(v))out.push(v);else ignoredEntries++;
    }
    return [...new Set(out)];
  };
  const lower=(v:string)=>v.toLowerCase();
  return {
    emails:list(d.emails,v=>ADDRESS.test(v),lower),
    // A mailbox is a plain address; "name+x@…" would make every alias of name+x… match, so refuse it.
    qaMailboxes:list(d.qaMailboxes,v=>ADDRESS.test(v)&&!v.split('@')[0].includes('+'),lower),
    uids:list(d.uids,v=>/^[A-Za-z0-9_-]{1,128}$/.test(v)),
    organizationIds:list(d.organizationIds,v=>/^[A-Za-z0-9_-]{1,128}$/.test(v)),
    ignoredEntries,
  };
}

export function hasExplicitEntries(config:QaExclusionConfig):boolean{
  return config.emails.length+config.qaMailboxes.length+config.uids.length+config.organizationIds.length>0;
}

/** "name+tag@domain" → "name@domain" (lower-cased); other addresses are only lower-cased. */
function mailboxOf(email:string):string{
  const at=email.lastIndexOf('@');
  return `${email.slice(0,at).split('+')[0]}${email.slice(at)}`;
}

export type QaMatch='claim'|'uid'|'fixture'|'email'|'mailbox';

/**
 * Why `user` is a QA identity, or null when it is not. `unverifiedAddressMatch` is true when the
 * address would match the config but Firebase has not verified it, so it still counts as a customer.
 */
export function qaMatch(uid:string,user:QaUser|undefined|null,config:QaExclusionConfig):{match:QaMatch|null;unverifiedAddressMatch:boolean}{
  if(config.uids.includes(uid))return {match:'uid',unverifiedAddressMatch:false};
  if(!user)return {match:null,unverifiedAddressMatch:false};
  if(user.customClaims?.qa===true)return {match:'claim',unverifiedAddressMatch:false};
  const email=typeof user.email==='string'?user.email.trim().toLowerCase():'';
  if(!email||!ADDRESS.test(email))return {match:null,unverifiedAddressMatch:false};
  if(email.endsWith(`@${FIXTURE_DOMAIN}`))return {match:'fixture',unverifiedAddressMatch:false};
  const listed:QaMatch|null=config.emails.includes(email)?'email':config.qaMailboxes.includes(mailboxOf(email))?'mailbox':null;
  if(!listed)return {match:null,unverifiedAddressMatch:false};
  return user.emailVerified===true?{match:listed,unverifiedAddressMatch:false}:{match:null,unverifiedAddressMatch:true};
}

export interface ExclusionDeps{
  /** Workspace id → creator uid (null when the workspace no longer exists). */
  creatorsOf(organizationIds:string[]):Promise<Map<string,string|null>>;
  /** uid → Auth user record (email, verification and custom claims); missing users are omitted. */
  usersOf(uids:string[]):Promise<Map<string,QaUser>>;
}

export interface ExclusionResult{
  excluded:Set<string>;
  /** Excluded workspaces by the rule that excluded them, for the audit line on the dashboard. */
  byRule:Record<'organizationId'|QaMatch,number>;
  /** Workspaces whose creator's unverified address matches the config: still counted. */
  unverifiedAddressMatches:number;
}

/** Which of `organizationIds` belong to QA identities, and why. */
export async function excludedOrganizations(organizationIds:Iterable<string>,config:QaExclusionConfig,deps:ExclusionDeps):Promise<ExclusionResult>{
  const byRule:ExclusionResult['byRule']={organizationId:0,uid:0,claim:0,fixture:0,email:0,mailbox:0};
  const ids=[...new Set(organizationIds)].filter(Boolean);
  const excluded=new Set<string>();
  for(const id of ids)if(config.organizationIds.includes(id)){excluded.add(id);byRule.organizationId++;}
  const remaining=ids.filter(id=>!excluded.has(id));
  let unverifiedAddressMatches=0;
  if(!remaining.length)return {excluded,byRule,unverifiedAddressMatches};
  const creators=await deps.creatorsOf(remaining);
  const uids=[...new Set([...creators.values()].filter((uid):uid is string=>!!uid))];
  const users=uids.length?await deps.usersOf(uids):new Map<string,QaUser>();
  for(const id of remaining){
    const uid=creators.get(id);
    if(!uid)continue;
    const result=qaMatch(uid,users.get(uid),config);
    if(result.match){excluded.add(id);byRule[result.match]++;}
    else if(result.unverifiedAddressMatch)unverifiedAddressMatches++;
  }
  return {excluded,byRule,unverifiedAddressMatches};
}
