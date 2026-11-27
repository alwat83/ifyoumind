import { SiteFooterComponent } from '../../site-footer.component';
import { JourneyNavigationComponent } from '../../journey-navigation.component';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector:'app-terms-of-conduct',
  standalone:true,
  imports:[SiteFooterComponent,JourneyNavigationComponent,RouterLink],
  templateUrl:'./terms-of-conduct.component.html',
  styleUrl:'./terms-of-conduct.component.scss',
})
export class TermsOfConductComponent {}
