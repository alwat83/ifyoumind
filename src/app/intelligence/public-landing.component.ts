import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-public-landing',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './public-landing.component.html',
  styleUrls: ['./public-landing.component.scss', './public-landing-visual-offers.component.scss', './public-landing-visual-mobile.component.scss'],
})
export class PublicLandingComponent {
  selectedExample: 'electricity' | 'tax' = 'electricity';
  get examplePath(): string { return `/discover/?example=${this.selectedExample}`; }
}
