export interface AnalyticsConsent{analytics:boolean;}

const LOCAL_HOSTS=new Set(['localhost','127.0.0.1']);

/**
 * Google Analytics may start only after the visitor has explicitly allowed analytics cookies
 * (a stored choice with analytics === true) and never on a local development host.
 * No stored choice (banner not answered yet) means no analytics.
 */
export function analyticsAllowed(consent:AnalyticsConsent|null|undefined,hostname:string):boolean{
  if(LOCAL_HOSTS.has(hostname))return false;
  return consent?.analytics===true;
}
