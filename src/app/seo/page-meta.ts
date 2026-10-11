export const SITE_URL='https://ifyoumind.com';
export const DEFAULT_TITLE='ifYouMind';
export const DEFAULT_DESCRIPTION='Compare the U.S. cities you\'re considering with Census-cited population, growth, income and home values.';

export interface PublicPage{path:string;title:string;description:string;priority:string;}
export interface PageMeta{title:string;description:string;canonical:string|null;robots:string;}

/** Path only: no query, no fragment, no trailing slash except the root. */
export function normalizePath(url:string):string{
  const path=(url||'/').split(/[?#]/)[0]||'/';
  const trimmed=path.length>1?path.replace(/\/+$/,''):path;
  return trimmed.startsWith('/')?trimmed:`/${trimmed}`;
}

/**
 * Public pages listed in public-pages.json are indexable and canonical to themselves.
 * Everything else (sign-in, the signed-in app, private reports) is noindex with no canonical.
 */
export function pageMetaFor(url:string,pages:readonly PublicPage[]):PageMeta{
  const path=normalizePath(url);
  const page=pages.find(entry=>entry.path===path);
  if(!page)return {title:DEFAULT_TITLE,description:DEFAULT_DESCRIPTION,canonical:null,robots:'noindex,nofollow'};
  return {title:page.title,description:page.description,canonical:`${SITE_URL}${page.path}`,robots:'index,follow'};
}
