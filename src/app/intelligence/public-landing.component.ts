import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HOME_EXAMPLES } from './home-discovery-examples';

@Component({
  selector: 'app-public-landing',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './public-landing.component.html',
  styleUrls: [
    './public-landing.component.scss',
    './public-landing-visual-offers.component.scss',
    './public-landing-visual-mobile.component.scss',
    './public-landing-discovery.component.scss',
  ],
})
export class PublicLandingComponent {
  readonly examples = HOME_EXAMPLES;
  example = this.examples[0];
  discoveryAnnouncement = '';
  plansExpanded = false;

  chooseExample(example: typeof HOME_EXAMPLES[number], evidence: HTMLDetailsElement): void {
    if (this.example === example) return;
    evidence.open = false;
    this.example = example;
    this.discoveryAnnouncement = `${example.title}. ${example.takeaway}`;
  }
}
