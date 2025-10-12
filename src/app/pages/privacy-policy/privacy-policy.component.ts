import { Component } from '@angular/core';

@Component({
  selector: 'app-privacy-policy',
  standalone: true,
  imports: [],
  templateUrl: './privacy-policy.component.html',
})
export class PrivacyPolicyComponent {
  effectiveDate = 'October 12, 2025';
  lastUpdated = 'October 12, 2025';
  contactEmail = 'privacy@ifyoumind.com';
  companyAddress = '123 Main Street, Wilmington, DE, 19801, USA';

  scrollToAnchor(event: Event, anchor: string): void {
    event.preventDefault();
    const element = document.querySelector(`#${anchor}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
}
