import { JourneyNavigationComponent } from '../journey-navigation.component';
import { AfterViewInit, Component, HostListener, OnDestroy, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Auth, user } from '@angular/fire/auth';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { HOME_EXAMPLES } from './home-discovery-examples';

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
  ],
})
export class PublicLandingComponent implements AfterViewInit, OnDestroy {
  readonly examples = HOME_EXAMPLES;
  readonly taxIncrease = this.examples[0].finding.value;
  readonly viewer = toSignal(user(inject(Auth)));
  private readonly route = inject(ActivatedRoute);
  example = this.examples.find(option => option.id === this.route.snapshot.queryParamMap.get('example')) ?? this.examples[0];
  revealed = this.route.snapshot.fragment === 'business' || this.examples.some(option => option.id === this.route.snapshot.queryParamMap.get('example'));
  discoveryAnnouncement = '';
  private frame: number | undefined;

  ngAfterViewInit(): void {
    if (this.revealed) this.moveTo(document.getElementById('business'));
  }

  ngOnDestroy(): void {
    if (this.frame !== undefined) cancelAnimationFrame(this.frame);
  }

  @HostListener('window:hashchange')
  followExampleLink(): void {
    if (window.location.hash === '#business') this.reveal(document.getElementById('business'));
  }

  reveal(target: HTMLElement | null): void {
    this.revealed = true;
    this.discoveryAnnouncement = `${this.example.label}. ${this.example.takeaway}`;
    this.moveTo(target);
  }

  chooseExample(example: typeof HOME_EXAMPLES[number], evidence: HTMLDetailsElement, target: HTMLElement): void {
    evidence.open = false;
    this.example = example;
    this.reveal(target);
  }

  showSources(evidence: HTMLDetailsElement): void {
    this.revealed = true;
    evidence.open = true;
    this.moveTo(document.getElementById('data-sources'));
  }

  private moveTo(target: HTMLElement | null): void {
    if (this.frame !== undefined) cancelAnimationFrame(this.frame);
    const origin = document.activeElement;
    this.frame = requestAnimationFrame(() => {
      if (!target?.isConnected || (document.activeElement !== origin && document.activeElement !== document.body)) return;
      target.focus({ preventScroll: true });
      target.scrollIntoView({ block: 'start', behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
    });
  }
}
