import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SeoService } from '../../services/seo.service';

@Component({
  selector: 'app-mission-page',
  standalone: true,
  templateUrl: './mission-page.component.html',
  styleUrls: ['./mission-page.component.scss']
})
export class MissionPageComponent implements OnInit {

  constructor(private seoService: SeoService) { }

  ngOnInit(): void {
    this.seoService.generateTags({
      title: 'Our Mission | ifYouMind',
      description: 'Our mission is to accelerate innovation by providing a space where ideas can be shared, discovered, and developed collaboratively. Join us in building the future.'
    });
  }
}
