const fs = require("fs");
const path = require("path");

const BASE_URL = "https://ifyoumind.com";
// One list of indexable public pages, shared with the app's canonical/robots tags.
const pages = require(path.join(__dirname, "..", "src", "public-pages.json"));

function buildSitemap(lastmod) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages.map(page => `  <url>
    <loc>${BASE_URL}${page.path}</loc>
    <lastmod>${lastmod}</lastmod>
    <priority>${page.priority}</priority>
  </url>`).join("\n")}
</urlset>
`;
}

if (require.main === module) {
  const lastmod = new Date().toISOString().split("T")[0];
  const sitemapPath = path.join(__dirname, "..", "src", "sitemap.xml");
  fs.writeFileSync(sitemapPath, buildSitemap(lastmod));
  console.log(`Sitemap generated at ${sitemapPath} with ${pages.length} pages`);
}

module.exports = { buildSitemap };
