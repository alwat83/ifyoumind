import { readFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { build } from 'esbuild';
import * as sass from 'sass';

const here = path => fileURLToPath(new URL(path, import.meta.url));

export async function bundle(entry) {
  const { outputFiles } = await build({ entryPoints: [here(entry)], bundle: true, write: false, format: 'esm', target: 'es2022', minify: true });
  return outputFiles[0].text;
}

export async function startReview(port = 0) {
  const assets = new Map([
    ['/', ['text/html; charset=utf-8', await readFile(here('./index.html'))]],
    ['/review.css', ['text/css; charset=utf-8', sass.compile(here('./review.scss'), { style: 'compressed' }).css]],
    ['/review.js', ['text/javascript; charset=utf-8', await bundle('./review.ts')]],
    ['/fonts/instrument-serif/regular.woff2', ['font/woff2', await readFile(here('../../public/fonts/instrument-serif/regular.woff2'))]],
    ['/fonts/instrument-serif/italic.woff2', ['font/woff2', await readFile(here('../../public/fonts/instrument-serif/italic.woff2'))]],
  ]);
  const server = createServer((request, response) => {
    const path = request.url?.split('?', 1)[0];
    const asset = assets.get(path);
    response.setHeader('Cache-Control', 'no-store');
    response.setHeader('X-Robots-Tag', 'noindex, nofollow');
    response.setHeader('X-Content-Type-Options', 'nosniff');
    response.setHeader('Referrer-Policy', 'no-referrer');
    response.setHeader('Content-Security-Policy', "default-src 'none'; script-src 'self'; style-src 'self'; font-src 'self'; connect-src 'none'; form-action 'none'; base-uri 'none'; frame-ancestors 'none'");
    if (!asset || !['GET', 'HEAD'].includes(request.method)) { response.writeHead(404).end(); return; }
    response.writeHead(200, { 'Content-Type': asset[0] }).end(request.method === 'HEAD' ? undefined : asset[1]);
  });
  await new Promise((resolve, reject) => server.once('error', reject).listen(port, '127.0.0.1', resolve));
  return { server, url: `http://127.0.0.1:${server.address().port}/` };
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  const { url } = await startReview(4318);
  console.log(`Synthetic bill explanation review: ${url}`);
}
