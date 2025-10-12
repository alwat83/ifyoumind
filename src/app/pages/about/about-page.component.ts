import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SeoService } from '../../services/seo.service';

@Component({
  selector: 'app-about-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './about-page.component.html',
  styleUrls: ['./about-page.component.scss'],
})
export class AboutPageComponent implements OnInit {
  constructor(private seoService: SeoService) {}

  ngOnInit(): void {
    this.seoService.generateTags({
      title: 'About ifYouMind | Collaborative Innovation',
      description:
        'Learn about ifYouMind, a platform for sharing, refining, and collaborating on ideas to solve real-world problems. Join our community of innovators.',
    });
  }
}
