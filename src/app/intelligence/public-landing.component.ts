import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-public-landing',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './public-landing.component.html',
  styleUrls: ['./public-landing.component.scss', './public-landing-visual-offers.component.scss', './public-landing-visual-mobile.component.scss'],
})
export class PublicLandingComponent {}
