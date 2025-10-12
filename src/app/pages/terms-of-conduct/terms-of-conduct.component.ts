import { Component, inject, OnInit } from '@angular/core';
import { SeoService } from '../../services/seo.service';

@Component({
  selector: 'app-terms-of-conduct',
  standalone: true,
  imports: [],
  templateUrl: './terms-of-conduct.component.html',
})
export class TermsOfConductComponent implements OnInit {
  private seoService = inject(SeoService);

  ngOnInit(): void {
    this.seoService.generateTags({
      title: 'Terms of Conduct',
      description: 'IfYouMind Community Guidelines',
    });
  }
}
