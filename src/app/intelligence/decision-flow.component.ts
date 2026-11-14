import { NgTemplateOutlet } from '@angular/common';
import { Component, ElementRef, OnDestroy, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { intentParams, parseIntent, readIntent, rememberIntent } from '../purchase-intent';
import { OrganizationService } from './organization.service';
import { MarketIntelligenceService } from './market-intelligence.service';
import { ProductAnalyticsService } from './product-analytics.service';
import { billExample, decisionPrompts, decisionType, DecisionType, formattedCity, placeKey, sampleCityMatches } from './decision-steps';

interface Comparison { id: number; value: string }

@Component({
  selector: 'app-decision-flow',
  standalone: true,
  imports: [FormsModule, NgTemplateOutlet, RouterLink],
  templateUrl: './decision-flow.component.html',
  styleUrl: './decision-flow.component.scss',
})
export class DecisionFlowComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly organizations = inject(OrganizationService);
  private readonly market = inject(MarketIntelligenceService);
  private readonly analytics = inject(ProductAnalyticsService);
  private destroyed = false;
  private nextComparisonId = 1;

  screen: 'question' | 'place' = 'question';
  type: DecisionType = 'custom';
  question = '';
  location = '';
  comparisons: Comparison[] = [];
  concept = '';
  showConcept = false;
  working = false;
  questionError = '';
  placeErrors: Record<string, string> = {};
  error = '';
  limited = false;
  suggestionField = '';

  ngOnInit(): void {
    rememberIntent(parseIntent(this.route.snapshot.queryParamMap.get('intent')));
    this.type = decisionType(this.route.snapshot.queryParamMap.get('type'));
    this.question = decisionPrompts[this.type];
  }

  ngOnDestroy(): void { this.destroyed = true; }

  get bill() { return billExample(this.question); }

  get billPath(): string {
    return '/discover/?example=' + this.bill;
  }

  continueToPlace(): void {
    if (!this.question.trim() || this.question.trim().length > 240) {
      this.questionError = 'Enter a question of up to 240 characters.';
      this.focus('decision-question');
      return;
    }
    if (this.bill) return;
    this.questionError = '';
    this.screen = 'place';
    if (this.type === 'compare' && !this.comparisons.length) this.appendComparison();
    this.focus('place-heading');
  }

  backToQuestion(): void {
    this.screen = 'question';
    this.error = '';
    this.suggestionField = '';
    this.focus('decision-question-heading');
  }

  changePlace(key: string, value: string, comparison?: Comparison): void {
    if (comparison) comparison.value = value;
    else this.location = value;
    delete this.placeErrors[key];
    this.error = '';
    this.limited = false;
    this.suggestionField = key;
  }

  suggestions(key: string, value: string): string[] {
    return this.suggestionField === key ? sampleCityMatches(value) : [];
  }

  chooseSuggestion(city: string, comparison?: Comparison): void {
    const key = comparison ? 'comparison-' + comparison.id : 'main-location';
    this.focus(key, false);
    this.changePlace(key, city, comparison);
    this.suggestionField = '';
  }

  chooseNoSuggestion(key: string): void {
    this.focus(key, false);
    this.suggestionField = '';
  }

  appendComparison(): void {
    if (this.comparisons.length === 3) return;
    this.comparisons.push({ id: this.nextComparisonId++, value: '' });
  }

  addComparison(): void {
    this.appendComparison();
    this.focus('comparison-' + this.comparisons.at(-1)?.id);
  }

  removeComparison(comparison: Comparison): void {
    const key = 'comparison-' + comparison.id;
    this.comparisons = this.comparisons.filter(row => row !== comparison);
    delete this.placeErrors[key];
    this.error = '';
    this.focus('add-comparison');
  }

  toggleConcept(): void {
    this.showConcept = !this.showConcept;
    if (this.showConcept) this.focus('business-concept');
  }

  async analyze(): Promise<void> {
    if (this.working || this.bill) return;
    this.suggestionField = '';
    this.error = '';
    this.limited = false;
    this.placeErrors = {};
    const location = formattedCity(this.location);
    if (!location) this.placeErrors['main-location'] = 'Enter a U.S. city and state, like Denver, CO.';
    const seen = new Set(location ? [placeKey(location)] : []);
    const comparisons: string[] = [];
    for (const [index, row] of this.comparisons.entries()) {
      const key = 'comparison-' + row.id;
      if (!row.value.trim()) {
        if (index === 0 && this.type === 'compare') this.placeErrors[key] = 'Add a second city to compare.';
        continue;
      }
      const city = formattedCity(row.value);
      if (!city) this.placeErrors[key] = 'Enter a U.S. city and state, like Raleigh, NC.';
      else if (seen.has(placeKey(city))) this.placeErrors[key] = 'Choose a different city.';
      else {
        seen.add(placeKey(city));
        comparisons.push(city);
      }
    }
    const firstError = Object.keys(this.placeErrors)[0];
    if (firstError || !location) {
      if (firstError) this.focus(firstError);
      return;
    }

    this.working = true;
    try {
      let workspace = await this.organizations.getMyWorkspace();
      if (this.destroyed) return;
      if (!workspace) {
        await this.organizations.createWorkspace('My ifYouMind');
        workspace = await this.organizations.getMyWorkspace();
      }
      if (this.destroyed) return;
      if (!workspace) throw new Error('Missing workspace');
      const concept = this.concept.trim() || (
        this.type === 'compare' ? 'Location comparison' : this.type === 'growth' ? 'Market growth' : 'Location decision');
      const project = await this.market.create(workspace.organizationId, location, concept, this.question.trim(), comparisons);
      if (this.destroyed) return;
      void this.analytics.track(workspace.organizationId, 'decision_created', {
        type: this.type,
        comparisons: String(comparisons.length),
      });
      await this.router.navigate(['/app/result', project.id], { queryParams: intentParams({}, readIntent()) });
    } catch (error) {
      if (this.destroyed) return;
      const code = String((error as { code?: unknown } | null)?.code ?? '').replace('functions/', '');
      if (code === 'resource-exhausted') {
        this.limited = true;
        this.error = 'You have used your 3 free decisions this month. They reset on the 1st (UTC). You can still open your saved decisions.';
      } else if (code === 'not-found' || code === 'invalid-argument') {
        this.error = 'We couldn’t match one of those places. Check the spelling and state, or remove an optional comparison.';
      } else if (code === 'permission-denied' || code === 'unauthenticated') {
        this.error = 'We couldn’t create a brief in this workspace. Check your account access and try again.';
      } else {
        this.error = 'We couldn’t build your brief right now. Your entries are still here. Try again in a moment.';
      }
      this.focus('brief-error');
    } finally {
      this.working = false;
    }
  }

  private focus(id: string, waitForRender = true): void {
    const apply = () => {
      if (!this.destroyed) this.element.nativeElement.querySelector<HTMLElement>('#' + id)?.focus();
    };
    if (waitForRender) requestAnimationFrame(apply);
    else apply();
  }
}
