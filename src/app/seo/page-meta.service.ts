import { DOCUMENT } from '@angular/common';
import { Injectable, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs/operators';
import publicPages from '../../public-pages.json';
import homeStructuredData from '../../site-structured-data.json';
import { PageMeta, PublicPage, pageMetaFor } from './page-meta';

/** Keeps title, description, canonical, robots and share tags in step with the current route. */
@Injectable({providedIn:'root'})
export class PageMetaService{
  private readonly router=inject(Router);
  private readonly title=inject(Title);
  private readonly meta=inject(Meta);
  private readonly document=inject(DOCUMENT);
  private started=false;

  start():void{
    if(this.started)return;
    this.started=true;
    this.router.events.pipe(filter((event):event is NavigationEnd=>event instanceof NavigationEnd))
      .subscribe(event=>this.apply(pageMetaFor(event.urlAfterRedirects,publicPages as PublicPage[])));
  }

  private apply(page:PageMeta):void{
    this.title.setTitle(page.title);
    this.meta.updateTag({name:'description',content:page.description});
    this.meta.updateTag({name:'robots',content:page.robots});
    this.meta.updateTag({property:'og:title',content:page.title});
    this.meta.updateTag({property:'og:description',content:page.description});
    this.meta.updateTag({name:'twitter:title',content:page.title});
    this.meta.updateTag({name:'twitter:description',content:page.description});
    if(page.canonical)this.meta.updateTag({property:'og:url',content:page.canonical});
    else this.meta.removeTag("property='og:url'");
    this.setCanonical(page.canonical);
    // Application offers describe the homepage, not login, legal pages or private reports.
    this.document.getElementById('page-structured-data')?.remove();
    if(page.canonical==='https://ifyoumind.com/'){
      const script=this.document.createElement('script');
      script.id='page-structured-data';
      script.type='application/ld+json';
      script.textContent=JSON.stringify(homeStructuredData);
      this.document.head.appendChild(script);
    }
  }

  private setCanonical(href:string|null):void{
    let link=this.document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if(!href){link?.remove();return;}
    if(!link){
      link=this.document.createElement('link');
      link.setAttribute('rel','canonical');
      this.document.head.appendChild(link);
    }
    link.setAttribute('href',href);
  }
}
