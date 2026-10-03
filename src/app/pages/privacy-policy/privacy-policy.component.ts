import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector:'app-privacy-policy',
  standalone:true,
  imports:[RouterLink],
  templateUrl:'./privacy-policy.component.html',
  styleUrl:'./privacy-policy.component.scss',
})
export class PrivacyPolicyComponent {
  effectiveDate='October 2, 2026';
  lastUpdated='October 2, 2026';
  contactEmail='privacy@ifyoumind.com';
}
