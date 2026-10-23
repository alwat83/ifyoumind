const fs = require("fs");
const path = require("path");
const { marked } = require("marked");
const { loadGuides } = require("./guides");

const SITE_URL = "https://ifyoumind.com";
const ROOT = path.join(__dirname, "..");
const OUT_DIR = path.join(ROOT, "public", "guides");
const STYLES = path.join(ROOT, "src", "guides", "guide.css");

const escapeHtml = (value) => String(value)
  .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
  .replace(/"/g, "&quot;").replace(/'/g, "&#39;");

const formatDate = (iso) => new Date(`${iso}T12:00:00Z`)
  .toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" });

/** Markdown to accessible HTML: scrollable labelled tables, header scope, external links marked. */
function renderBody(markdown) {
  let tableCount = 0;
  return marked.parse(markdown, { gfm: true })
    .replace(/<table>/g, () => `<div class="table-wrap" role="region" tabindex="0" aria-label="Table ${++tableCount}, scrolls sideways on small screens"><table>`)
    .replace(/<\/table>/g, '</table></div><p class="table-hint" aria-hidden="true">Swipe the table sideways to see every column.</p>')
    .replace(/<th>/g, '<th scope="col">')
    .replace(/<input (?:checked="" )?disabled="" type="checkbox">\s?/g, '<span class="check" aria-hidden="true"></span>')
    .replace(/<ul>(\s*<li><span class="check")/g, '<ul class="checklist">$1')
    .replace(/<a href="(https?:\/\/(?!ifyoumind\.com)[^"]+)">/g, '<a href="$1" rel="noopener">');
}

function shell({ title, description, canonical, type, jsonLd, main }) {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}">
  <meta name="robots" content="index,follow">
  <link rel="canonical" href="${canonical}">
  <meta property="og:type" content="${type}">
  <meta property="og:site_name" content="ifYouMind">
  <meta property="og:title" content="${escapeHtml(title)}">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:url" content="${canonical}">
  <meta name="twitter:card" content="summary">
  <meta name="twitter:title" content="${escapeHtml(title)}">
  <meta name="twitter:description" content="${escapeHtml(description)}">
  <link rel="icon" type="image/png" href="/favicon.png">
  <link rel="apple-touch-icon" href="/apple-touch-icon.png">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="/guides/guide.css">
  <script type="application/ld+json">${JSON.stringify(jsonLd).replace(/</g, "\\u003c")}</script>
</head>
<body>
  <a class="skip" href="#content">Skip to content</a>
  <header class="site-header">
    <nav class="nav" aria-label="Main">
      <a class="brand" href="/">ifYouMind</a>
      <div class="nav-links">
        <a href="/guides/">Guides</a>
        <a href="/sample-report">Sample report</a>
        <a class="nav-cta" href="/register">Try it free</a>
      </div>
    </nav>
  </header>
  <main id="content">
${main}
  </main>
  <footer class="site-footer">
    <p><a class="brand" href="/">ifYouMind</a> · Evidence for real decisions. Business city reports available today.</p>
    <p><a href="/guides/">Guides</a> · <a href="/sample-report">Sample report</a> · <a href="/privacy-policy">Privacy</a> · <a href="/terms-of-conduct">Terms</a></p>
  </footer>
</body>
</html>
`;
}

const ctaBox = `    <aside class="cta" aria-labelledby="cta-title">
      <h2 id="cta-title">See a finished market analysis</h2>
      <p>The sample Decision Report compares three U.S. cities on Census-cited population, growth, income and home values, with an action plan and clear limits.</p>
      <p class="cta-actions"><a class="button primary" href="/sample-report">View the sample report</a> <a class="button secondary" href="/register">Start a free brief</a></p>
    </aside>`;

function guidePage(guide) {
  const canonical = `${SITE_URL}${guide.path}`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        headline: guide.title,
        description: guide.description,
        datePublished: guide.published,
        dateModified: guide.updated,
        mainEntityOfPage: canonical,
        author: { "@type": "Organization", name: "ifYouMind", url: `${SITE_URL}/` },
        publisher: { "@type": "Organization", name: "ifYouMind", url: `${SITE_URL}/` },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "ifYouMind", item: `${SITE_URL}/` },
          { "@type": "ListItem", position: 2, name: "Guides", item: `${SITE_URL}/guides/` },
          { "@type": "ListItem", position: 3, name: guide.title, item: canonical },
        ],
      },
    ],
  };
  const main = `    <article class="guide">
      <nav class="breadcrumb" aria-label="Breadcrumb"><a href="/">Home</a> <span aria-hidden="true">/</span> <a href="/guides/">Guides</a></nav>
      <header class="guide-header">
        <p class="eyebrow">Guide</p>
        <h1>${escapeHtml(guide.title)}</h1>
        <p class="lede">${escapeHtml(guide.lede)}</p>
        <p class="byline">By ifYouMind · Updated <time datetime="${guide.updated}">${formatDate(guide.updated)}</time></p>
      </header>
      <div class="prose">
${renderBody(guide.body)}
      </div>
${ctaBox}
    </article>`;
  return shell({ title: guide.seoTitle, description: guide.description, canonical, type: "article", jsonLd, main });
}

function indexPage(guides) {
  const canonical = `${SITE_URL}/guides/`;
  const items = guides.map((guide) => `        <li>
          <a href="${guide.path}"><strong>${escapeHtml(guide.title)}</strong></a>
          <p>${escapeHtml(guide.description)}</p>
        </li>`).join("\n");
  const main = `    <section class="guide">
      <header class="guide-header">
        <p class="eyebrow">Guides</p>
        <h1>Practical guides for decisions that matter</h1>
        <p class="lede">Compare job offers and relocation trade-offs, research business locations, and build useful comparisons from your own evidence. Personal tools and flexible dataset analysis are in development; these guides are manual workflows.</p>
      </header>
      <ul class="guide-list">
${items}
      </ul>
${ctaBox}
    </section>`;
  const jsonLd = { "@context": "https://schema.org", "@type": "CollectionPage", name: "ifYouMind guides", url: canonical };
  return shell({ title: "Decision guides: jobs, places and evidence | ifYouMind", description: "Source-cited guides for job offers, relocation, business locations and comparing your own evidence. Practical worksheets with clear limits and Business examples.", canonical, type: "website", jsonLd, main });
}

function buildGuides() {
  const guides = loadGuides();
  fs.rmSync(OUT_DIR, { recursive: true, force: true });
  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.copyFileSync(STYLES, path.join(OUT_DIR, "guide.css"));
  if (guides.length) fs.writeFileSync(path.join(OUT_DIR, "index.html"), indexPage(guides));
  for (const guide of guides) {
    const dir = path.join(OUT_DIR, guide.slug);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, "index.html"), guidePage(guide));
  }
  return guides;
}

if (require.main === module) {
  const guides = buildGuides();
  console.log(`Built ${guides.length} guide page(s) into ${OUT_DIR}`);
}

module.exports = { buildGuides, guidePage, indexPage, renderBody };
