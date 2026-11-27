import { CommonModule } from '@angular/common';
import { Component, Input, inject } from '@angular/core';
import { SITE_NAVIGATE, followAppLink } from './site-navigation';
import { AccountState, CONSUMER_LINKS } from './journey-navigation.component';

// One footer for every page, grouped by what people come to do. Presentation only and
// safe for the browser-local /discover/ island: plain links, no Auth, Router or analytics.
@Component({
  selector: 'app-site-footer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './site-footer.component.html',
  styleUrls: ['./site-footer.component.scss'],
})
export class SiteFooterComponent {
  @Input() accountLabel: AccountState = 'Account';
  readonly links = CONSUMER_LINKS;
  get signedIn(): boolean { return this.accountLabel === 'Account'; }
  private readonly navigate = inject(SITE_NAVIGATE, { optional: true });

  follow(event: MouseEvent): void { followAppLink(event, this.navigate); }
}
