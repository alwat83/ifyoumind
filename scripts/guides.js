const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const CONTENT_DIR = path.join(ROOT, "content", "guides");
const REQUIRED = ["title", "description", "lede", "published", "updated"];

/** Reads content/guides/*.md: a simple "key: value" front-matter block, then Markdown. */
function parseGuide(file) {
  const raw = fs.readFileSync(file, "utf8").replace(/\r\n/g, "\n");
  const match = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) throw new Error(`${file}: missing front matter`);
  const meta = {};
  for (const line of match[1].split("\n")) {
    const at = line.indexOf(":");
    if (at > 0) meta[line.slice(0, at).trim()] = line.slice(at + 1).trim();
  }
  for (const key of REQUIRED) {
    if (!meta[key]) throw new Error(`${file}: front matter needs "${key}"`);
  }
  const slug = path.basename(file, ".md");
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) throw new Error(`${file}: slug must be lowercase-hyphenated`);
  return { ...meta, seoTitle: meta.seoTitle || meta.title, slug, path: `/guides/${slug}/`, body: match[2] };
}

function loadGuides() {
  if (!fs.existsSync(CONTENT_DIR)) return [];
  return fs.readdirSync(CONTENT_DIR)
    .filter((name) => name.endsWith(".md"))
    .map((name) => parseGuide(path.join(CONTENT_DIR, name)))
    .sort((a, b) => b.published.localeCompare(a.published));
}

module.exports = { loadGuides, parseGuide, CONTENT_DIR };
