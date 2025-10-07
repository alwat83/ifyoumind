import { Injectable } from '@angular/core';
import { Title, Meta } from '@angular/platform-browser';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class SeoService {
  private readonly appTitle = 'ifyoumind';
  private readonly appDescription = 'A platform for sharing, discovering, and discussing innovative ideas.';
  private readonly appImage = 'https://ifyoumind.com/image.png'; // Default share image
  private readonly siteUrl = 'https://ifyoumind.com';

  constructor(
    private title: Title,
    private meta: Meta,
    private router: Router
  ) { }

  generateTags({
    title = '',
    description = '',
    image = '',
  }: {
    title?: string;
    description?: string;
    image?: string;
  }) {
    const pageTitle = title ? `${title} | ${this.appTitle}` : this.appTitle;
    const pageDescription = description || this.appDescription;
    const pageImage = image || this.appImage;
    const canonicalUrl = `${this.siteUrl}${this.router.url}`;

    // Set browser title
    this.title.setTitle(pageTitle);

    // Standard meta tags
    this.meta.updateTag({ name: 'description', content: pageDescription });

    // Open Graph tags for social sharing (Facebook, LinkedIn, etc.)
    this.meta.updateTag({ property: 'og:title', content: pageTitle });
    this.meta.updateTag({ property: 'og:description', content: pageDescription });
    this.meta.updateTag({ property: 'og:image', content: pageImage });
    this.meta.updateTag({ property: 'og:url', content: canonicalUrl });
    this.meta.updateTag({ property: 'og:site_name', content: this.appTitle });
    this.meta.updateTag({ property: 'og:type', content: 'website' });

    // Twitter Card tags
    this.meta.updateTag({ name: 'twitter:card', content: 'summary_large_image' });
    this.meta.updateTag({ name: 'twitter:title', content: pageTitle });
    this.meta.updateTag({ name: 'twitter:description', content: pageDescription });
    this.meta.updateTag({ name: 'twitter:image', content: pageImage });
  }

  // You can add methods for specific pages here if needed
  setHomePageTags() {
    this.generateTags({
      title: 'ifyoumind | Share Your Ideas',
      description: 'A community-driven platform to share, discover, and discuss new and innovative ideas for startups, projects, and more.'
    });
  }
}
