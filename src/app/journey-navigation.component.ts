import { CommonModule } from '@angular/common';
import { Component, Input, inject } from '@angular/core';
import { SITE_NAVIGATE, followAppLink } from './site-navigation';

/** What a visitor can do, in the order they would look for it. Destinations are existing pages. */
export const CONSUMER_LINKS = [
  { key: 'bills', label: 'Check a bill', href: '/discover/' },
  { key: 'cities', label: 'Compare cities', href: '/?example=cities#business' },
  { key: 'guides', label: 'Guides', href: '/guides/' },
  { key: 'pricing', label: 'Pricing', href: '/pricing' },
] as const;

/**
 * Account state as the page knows it: 'Account' = signed in, 'Sign In' = signed out,
 * '' = unknown (the browser-local /discover/ island never reads Auth), shown as signed out.
 */
export type AccountState = 'Account' | 'Sign In' | '';

// Presentation only. Safe for the browser-local island: no Auth, Router, storage,
// analytics or network dependencies. Navigation never carries bill rows.
@Component({
  selector: 'app-journey-navigation',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './journey-navigation.component.html',
  styleUrls: ['./journey-navigation.component.scss'],
})
export class JourneyNavigationComponent {
  /** Key of the current section: bills, cities, guides, pricing, saved or account. */
  @Input() current = '';
  @Input() accountLabel: AccountState = 'Account';
  readonly links = CONSUMER_LINKS;
  get signedIn(): boolean { return this.accountLabel === 'Account'; }
  private readonly navigate = inject(SITE_NAVIGATE, { optional: true });
  follow(event: MouseEvent, menu?: HTMLDetailsElement): void {
    followAppLink(event, this.navigate);
    if (menu && event.defaultPrevented) menu.open = false;
  }
}
