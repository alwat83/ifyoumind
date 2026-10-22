const fs = require("fs");
const path = require("path");

const BASE_URL = "https://ifyoumind.com";
// One list of indexable public pages, shared with the app's canonical/robots tags.
const pages = require(path.join(__dirname, "..", "src", "public-pages.json"));
const { loadGuides } = require("./guides");

/** App pages from public-pages.json, then the static guides (index first, newest guide first). */
function sitemapEntries() {
  const guides = loadGuides();
  return [
    ...pages.map(page => ({ path: page.path, lastmod: page.updated, priority: page.priority })),
    ...(guides.length ? [{ path: "/guides/", lastmod: guides.map(g => g.updated).sort().pop(), priority: "0.6" }] : []),
    ...guides.map(guide => ({ path: guide.path, lastmod: guide.updated, priority: "0.7" })),
  ];
}

function buildSitemap() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapEntries().map(entry => `  <url>
    <loc>${BASE_URL}${entry.path}</loc>
    <lastmod>${entry.lastmod}</lastmod>
    <priority>${entry.priority}</priority>
  </url>`).join("\n")}
</urlset>
`;
}

if (require.main === module) {
  const sitemapPath = path.join(__dirname, "..", "src", "sitemap.xml");
  fs.writeFileSync(sitemapPath, buildSitemap());
  console.log(`Sitemap generated at ${sitemapPath} with ${sitemapEntries().length} URLs`);
}

module.exports = { buildSitemap, sitemapEntries };
