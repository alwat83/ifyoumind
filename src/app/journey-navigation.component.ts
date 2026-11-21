import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

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
  @Input() compact = false;
  @Input() current = '';
  @Input() accountLabel = 'Account';
  @Input() example = '';
  destination(link: {key: string; href: string}): string {
    return link.key === 'explore' && ['tax','electricity','cities'].includes(this.example)
      ? '/?example=' + this.example + '#business' : link.href;
  }
  readonly links = [
    { key: 'explore', label: 'Explore examples', href: '/#business' },
    { key: 'saved', label: 'Your decisions', href: '/decisions' },
    { key: 'reports', label: 'Sample report', href: '/sample-report' },
    { key: 'pricing', label: 'Pricing', href: '/pricing' },
  ];
}
