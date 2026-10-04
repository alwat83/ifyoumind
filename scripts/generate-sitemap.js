const fs = require("fs");
const path = require("path");

const BASE_URL = "https://ifyoumind.com";

async function generateSitemap() {
  console.log("Generating sitemap...");

  const routes = [
    { path: "/", priority: "1.0" },
    { path: "/privacy-policy", priority: "0.4" },
    { path: "/terms-of-conduct", priority: "0.4" },
  ];

  const lastmod = new Date().toISOString().split("T")[0];
  const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${routes.map(route => `
  <url>
    <loc>${BASE_URL}${route.path}</loc>
    <lastmod>${lastmod}</lastmod>
    <priority>${route.priority}</priority>
  </url>`).join("")}
</urlset>`;

  const sitemapPath = path.join(__dirname, "..", "src", "sitemap.xml");
  fs.writeFileSync(sitemapPath, sitemapXml);
  console.log(`Sitemap successfully generated at ${sitemapPath}`);
}

generateSitemap().catch((error) => {
  console.error("Sitemap generation failed:", error);
  process.exit(1);
});
