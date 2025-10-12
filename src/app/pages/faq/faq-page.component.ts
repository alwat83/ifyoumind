import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SeoService } from '../../services/seo.service';

interface FaqItem {
  q: string;
  a: string;
}

@Component({
  selector: 'app-faq-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './faq-page.component.html',
  styleUrls: ['./faq-page.component.scss'],
})
export class FaqPageComponent implements OnInit {
  faqs: FaqItem[] = [
    {
      q: 'How do I get the best experience on ifYouMind?',
      a: 'Engage early. Post ideas even if rough; refine through feedback; upvote and bookmark to signal interest.',
    },
    {
      q: 'What makes a good idea submission?',
      a: 'Clear problem framing, concise solution, potential impact, feasibility hints, and openness to iteration.',
    },
    {
      q: 'Why votes and bookmarks?',
      a: 'Votes surface broadly compelling ideas. Bookmarks show personal follow interest and may guide future signals.',
    },
    {
      q: 'Can I edit an idea?',
      a: 'You can update within allowed rules. Significant edits should clarify progress rather than erase history.',
    },
    {
      q: 'How is trending decided?',
      a: 'Weighted recent upvotes + sustained engagement + freshness. Periodically recalculated by a Cloud Function.',
    },
  ];

  constructor(private seoService: SeoService) {}

  ngOnInit(): void {
    this.seoService.generateTags({
      title: 'FAQ | ifYouMind',
      description:
        'Frequently asked questions about ifYouMind. Learn about submitting ideas, voting, bookmarks, and how our platform works.',
    });
  }
}
