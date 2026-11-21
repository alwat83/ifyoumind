import test from 'node:test';
import assert from 'node:assert/strict';
import { editorialHtml, formats } from '../scripts/render-midnight-social.mjs';

test('editorial exports identify synthetic evidence and keep disclaimers in every format', () => {
  for (const category of ['tax', 'electricity']) for (const format of Object.keys(formats)) {
    const html = editorialHtml(category, format);
    assert.match(html, /Illustrative example/);
    assert.match(html, /Synthetic data\. Not a customer result\./);
    assert.match(html, category === 'tax' ? /Two bills cannot establish an error or grounds for appeal/ : /do not establish a tariff, cause or savings/);
    assert.doesNotMatch(html, /<script|https?:\/\//i, 'artwork has no tracking or remote assets');
  }
});

test('editorial data matches the supported fixture and refuses unsupported template requests', () => {
  assert.match(editorialHtml('tax', 'portrait'), />\$420<\/p>/);
  assert.match(editorialHtml('tax', 'portrait'), /\$240 of this illustrative increase/);
  assert.match(editorialHtml('electricity', 'square'), />\+21%<\/p>/);
  assert.match(editorialHtml('electricity', 'square'), /Electricity use rose 10%/);
  assert.throws(() => editorialHtml('custom', 'portrait'));
  assert.throws(() => editorialHtml('tax', 'unbounded'));
});
