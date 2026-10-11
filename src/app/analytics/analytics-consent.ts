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

/**
 * GA4 settings applied in code, whatever the property settings say: no Google signals
 * (cross-device / demographics) and no ad personalization signals.
 */
export const ANALYTICS_GTAG_CONFIG={
  allow_google_signals:false,
  allow_ad_personalization_signals:false,
} as const;

/** Consent Mode values sent once a visitor has allowed analytics. Advertising is never granted. */
export const ANALYTICS_CONSENT_GRANTED={
  analytics_storage:'granted',
  ad_storage:'denied',
  ad_user_data:'denied',
  ad_personalization:'denied',
  functionality_storage:'denied',
  personalization_storage:'denied',
  security_storage:'granted',
} as const;

/** The only custom GA4 events ifYouMind sends. Parameters never include names, emails or report contents. */
export const FUNNEL_EVENTS=['cta_click','sample_report_view','sign_up','decision_created','checkout_started'] as const;
export type FunnelEvent=typeof FUNNEL_EVENTS[number];
