import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';

const read = (p) => fs.readFileSync(new URL(p, import.meta.url), 'utf8');
const compiled = ts.transpileModule(read('../src/app/intelligence/report-evidence-format.ts'), { compilerOptions: { module: ts.ModuleKind.ES2022, target: ts.ScriptTarget.ES2022 } }).outputText;
const fmt = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`);

test('margins are shown in the figure\'s own units, and missing margins are explained', () => {
  assert.equal(fmt.plusMinus({ value: 93658, moe: 1670, status: 'ok' }, 'usd'), '± $1,670');
  assert.equal(fmt.plusMinus({ value: 0.351, moe: 0.0384, status: 'ok' }, 'share'), '± 3.8 pts');
  assert.equal(fmt.plusMinus({ value: 3200, moe: 113.1, status: 'ok' }, 'count'), '± 113');
  assert.equal(fmt.plusMinus({ value: 5000, moe: null, status: 'ok' }, 'count'), 'no margin of error published');
  assert.equal(fmt.plusMinus({ value: 250001, moe: null, status: 'open-ended' }, 'usd'), 'open-ended range; no margin');
  assert.equal(fmt.plusMinus({ value: null, moe: null, status: 'unavailable' }, 'count'), '');
  assert.equal(fmt.formatCount(null), 'Not published');
  assert.equal(fmt.formatShare(0.3512), '35.1%');
});

test('verdict labels never rank places that are within the margin of error', () => {
  assert.deepEqual(fmt.verdictLabel('similar'), { text: 'Within the margin of error', tone: 'similar' });
  assert.equal(fmt.verdictLabel('not-testable').tone, 'unknown');
  assert.match(fmt.verdictLabel('higher').text, /Real difference/);
});

test('evidence appears only inside the paid report block, with the copy text extended', () => {
  const report = read('../src/app/intelligence/market-report.component.html');
  const paidBlock = report.slice(report.indexOf('<ng-container *ngIf="decisionReport as reportDetail">'));
  assert.ok(paidBlock.includes('<app-report-evidence'), 'evidence renders inside the decisionReport block');
  assert.equal(report.slice(0, report.indexOf('<ng-container *ngIf="decisionReport as reportDetail">')).includes('app-report-evidence'), false);
  assert.match(report, /\[extraText\]="evidenceText\(reportDetail\)"/);
  const evidence = read('../src/app/intelligence/report-evidence.component.html');
  assert.match(evidence, /Survey estimate/);
  assert.match(evidence, /Calculated/);
  assert.match(evidence, /Low reliability/);
  assert.match(evidence, /tabindex="0" role="region"/);
  assert.match(evidence, /\$any\(evidence\)\.message/, 'an unavailable result shows its message');
});
