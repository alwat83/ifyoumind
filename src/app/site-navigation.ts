import { InjectionToken } from '@angular/core';

/**
 * In-app navigation for the shared footer. Provided by the main app (Router), never by the
 * browser-local /discover/ island, where links stay ordinary page loads. Keeping footer links as
 * router navigations preserves the previous homepage footer's SPA behaviour (one GA4 tag per document).
 */
export const SITE_NAVIGATE = new InjectionToken<(url: string) => void>('SITE_NAVIGATE');

/** Footer destinations served by the main Angular app. /discover/, /guides/ and mailto stay full loads. */
const APP_PATHS = /^\/(?:|pricing|sample-report|privacy-policy|terms-of-conduct|login|register|decisions|account)(?:#[a-z-]+)?$/;

export function isAppPath(href: string): boolean { return APP_PATHS.test(href); }

/** Router navigation for plain left clicks on in-app links; anything else keeps the browser default. */
export function followAppLink(event: MouseEvent, navigate: ((url: string) => void) | null): void {
  const link = (event.target as HTMLElement | null)?.closest('a');
  const href = link?.getAttribute('href') ?? '';
  if (!navigate || !link || !isAppPath(href)) return;
  if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  event.preventDefault();
  navigate(href);
}
