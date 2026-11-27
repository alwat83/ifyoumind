import { JourneyNavigationComponent } from '../journey-navigation.component';
import { AfterRenderRef, AfterViewInit, Component, HostListener, Injector, OnDestroy, afterNextRender, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Auth, user } from '@angular/fire/auth';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AnalyticsService } from '../services/analytics.service';
import { CookieService } from '../services/cookie.service';
import { Subscription } from 'rxjs';
import { HOME_EXAMPLES, StatementVerdict } from './home-discovery-examples';

@Component({
  selector: 'app-public-landing',
  standalone: true,
  imports:[JourneyNavigationComponent,RouterLink],
  templateUrl: './public-landing.component.html',
  styleUrls: [
    './public-landing.component.scss',
    './public-landing-visual-offers.component.scss',
    './public-landing-discovery.component.scss',
    './public-landing-visual-mobile.component.scss',
    './public-landing-check.component.scss',
  ],
})
export class PublicLandingComponent implements AfterViewInit, OnDestroy {
  private readonly analytics=inject(AnalyticsService);
  private consentSubscription:Subscription|undefined;
  private readonly cookies=inject(CookieService);
  readonly examples = HOME_EXAMPLES;
  readonly taxIncrease = this.examples[0].finding.value;
  readonly viewer = toSignal(user(inject(Auth)));
  private readonly route = inject(ActivatedRoute);
  example = this.examples.find(option => option.id === this.route.snapshot.queryParamMap.get('example')) ?? this.examples[0];
  revealed = this.route.snapshot.fragment === 'business' || this.examples.some(option => option.id === this.route.snapshot.queryParamMap.get('example'));
  discoveryAnnouncement = '';
  /** Index of the open statement check, if any. Deep links open the first statement, as the old reveal showed the finding. */
  selected: number | null = this.revealed ? 0 : null;
  private readonly checked = new Set<string>();
  readonly verdictLabels: Record<StatementVerdict, string> = {
    supported: 'Supported by these numbers',
    'not-supported': 'Not supported by these numbers',
    'cannot-tell': 'Can’t tell from these numbers',
  };
  private pending: AfterRenderRef | undefined;
  private readonly injector = inject(Injector);

  ngAfterViewInit(): void {
    this.consentSubscription=this.cookies.consentStatus$.subscribe(()=>{queueMicrotask(()=>{if(this.revealed)this.analytics.exampleViewed(this.example.id);});});
    queueMicrotask(()=>{if(this.revealed)this.analytics.exampleViewed(this.example.id);});
    if (this.revealed) this.moveTo(document.getElementById('business'));
  }

  ngOnDestroy(): void {
    this.pending?.destroy();
    this.consentSubscription?.unsubscribe();
  }

  @HostListener('window:hashchange')
  followExampleLink(): void {
    if (window.location.hash === '#business') this.reveal(document.getElementById('business'));
  }

  reveal(target: HTMLElement | null): void {
    this.revealed = true;
    this.selected ??= 0;
    this.analytics.exampleViewed(this.example.id);
    this.discoveryAnnouncement = this.statementAnnouncement(this.selected);
    this.moveTo(target);
  }

  /** Opens one preset statement's check. Same analytics as the old reveal: the example's finding is now visible. */
  check(index: number, button: HTMLElement): void {
    this.revealed = true;
    this.selected = index;
    this.checked.add(this.example.id + ':' + index);
    this.analytics.exampleViewed(this.example.id);
    this.discoveryAnnouncement = this.statementAnnouncement(index);
    if (!window.matchMedia('(max-width: 740px)').matches) return;
    this.pending?.destroy();
    this.pending = afterNextRender({ write: () => {
      const panel = button.nextElementSibling;
      if (!panel || panel.getBoundingClientRect().top + 120 <= window.innerHeight - this.bannerHeight()) return;
      button.scrollIntoView({ block: 'start', behavior: this.motion() });
    } }, { injector: this.injector });
  }

  verdictShown(index: number): boolean {
    return this.checked.has(this.example.id + ':' + index) && this.selected !== index;
  }

  chooseExample(example: typeof HOME_EXAMPLES[number], evidence: HTMLDetailsElement): void {
    evidence.open = false;
    this.example = example;
    this.selected = null;
    this.revealed = true;
    this.analytics.exampleViewed(example.id);
    this.discoveryAnnouncement = `${example.title}. ${example.question} Choose a statement to see what the numbers show.`;
  }

  private statementAnnouncement(index: number): string {
    const statement = this.example.statements[index];
    return `${this.verdictLabels[statement.verdict]}. ${statement.finding}`;
  }

  private bannerHeight(): number {
    return parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--consent-banner-height')) || 0;
  }

  private motion(): ScrollBehavior {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth';
  }

  evidenceToggled(evidence:HTMLDetailsElement):void{if(evidence.open)this.analytics.evidenceRevealed(this.example.id);}

  showSources(evidence: HTMLDetailsElement): void {
    this.revealed = true;
    evidence.open = true;
    this.moveTo(document.getElementById('data-sources'));
  }

  private moveTo(target: HTMLElement | null): void {
    this.pending?.destroy();
    if (!target) return;
    const origin = document.activeElement;
    this.pending = afterNextRender({ write: () => {
      if (!target?.isConnected || (document.activeElement !== origin && document.activeElement !== document.body)) return;
      target.focus({ preventScroll: true });
      target.scrollIntoView({ block: 'start', behavior: this.motion() });
    } }, { injector: this.injector });
  }
}
