import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

type DecisionKind = 'move' | 'career' | 'business' | 'compare';

@Component({
  selector: 'app-public-landing',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './public-landing.component.html',
  styleUrls: ['./public-landing-offers.component.scss', './public-landing-life.component.scss', './public-landing.component.scss'],
})
export class PublicLandingComponent {
  selected: DecisionKind = 'move';
  readonly decisions = [
    { id: 'move' as const, number: '01', label: 'Move somewhere new', hint: 'A different city. A new chapter.', title: 'See the move from more than one angle.', description: 'Start with a free guide to comparing places: housing, work, commuting and the life you want to build.', points: ['Look beyond salary to everyday costs.', 'Separate facts from assumptions.', 'Make your personal priorities visible.'], available: 'Free relocation checklist', upcoming: 'Personal relocation calculations are in development. This guide helps you compare manually.', path: '/guides/compare-job-offers-relocation/', action: 'Explore the relocation guide' },
    { id: 'career' as const, number: '02', label: 'Choose between job offers', hint: 'More to consider than the salary.', title: 'Two offers. A fuller picture.', description: 'Use a free guide to lay out compensation, housing, commute and the trade-offs that matter to you.', points: ['Compare the complete compensation package.', 'Check costs and assumptions yourself.', 'Consider time, flexibility and opportunity.'], available: 'Free job-offer checklist', upcoming: 'Automated job-offer comparisons are in development. No financial result is calculated here.', path: '/guides/compare-job-offers-relocation/', action: 'Explore the job-offer guide' },
    { id: 'business' as const, number: '03', label: 'Explore a business opportunity', hint: 'An idea. A place. A next step.', title: 'Give your business idea some real context.', description: 'Create a free Decision Brief comparing a U.S. city with one other using cited Census population, growth, income and home values.', points: ['Compare city-level market signals.', 'See the sources and evidence limits.', 'Decide what needs checking on the ground.'], available: 'Free Business Decision Brief', upcoming: 'Free account required; no credit card. City data cannot establish demand, rent, competition or foot traffic.', path: '/register', action: 'Start a free Business brief' },
    { id: 'compare' as const, number: '04', label: 'Make sense of other options', hint: 'Your choices. Your priorities.', title: 'Turn a big question into a useful comparison.', description: 'Use a free framework to choose factors, check your evidence and compare options without hiding the trade-offs.', points: ['Define what a good outcome means to you.', 'Use the same factors for each option.', 'Record what you still do not know.'], available: 'Free comparison framework', upcoming: 'Data uploads and flexible automated analysis are in development. This guide does not analyze a file or answer arbitrary questions.', path: '/guides/compare-options-with-your-own-data/', action: 'Explore the comparison guide' },
  ];

  get decision() { return this.decisions.find(item => item.id === this.selected) || this.decisions[0]; }
}
