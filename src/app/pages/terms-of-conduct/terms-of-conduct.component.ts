import { Component, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SeoService } from '../../services/seo.service';

@Component({
  selector:'app-terms-of-conduct',
  standalone:true,
  imports:[RouterLink],
  templateUrl:'./terms-of-conduct.component.html',
  styleUrl:'./terms-of-conduct.component.scss',
})
export class TermsOfConductComponent implements OnInit {
  private seoService=inject(SeoService);
  ngOnInit():void{
    this.seoService.generateTags({
      title:'Terms of Service',
      description:'ifYouMind Terms of Service',
    });
  }
}
