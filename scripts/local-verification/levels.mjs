import { plan } from './core.mjs';

export const LEVELS = Object.freeze(['prototype', 'consumer', 'backend', 'release']);
const prototype = new Set(['fast-web', 'production-build', 'production-bundle', 'production-isolation', 'local-build', 'hosting-browser']);
const backend = new Set(['functions-build', 'functions-tests', 'fast-web', 'local-build', 'firestore-rules', 'organizations', 'commerce-entitlements', 'fixtures-access', 'authenticated-browser', 'transaction-transport']);
const sensitiveOnly = new Set(['functions-tests', 'firestore-rules', 'organizations', 'commerce-entitlements', 'fixtures-access', 'transaction-transport']);
export const KNOWN_FAILURES = Object.freeze([
  { id: 'transaction-read-abort', status: 'UNRESOLVED', releaseBlocker: true, evidence: 'https://github.com/alwat83/ifyoumind/pull/120', detail: 'Strict document and aggregate abort recovery fail; no qualified supported correction.' },
  { id: 'city-save-month-boundary', status: 'UNRESOLVED', releaseBlocker: true, evidence: 'https://github.com/alwat83/ifyoumind/blob/76ece8d911f7cec1dd269da732478b66199c2f12/docs/design/consumer-pricing/VERIFIED_76b4ca2.md', detail: 'Concurrent new-month save returned INTERNAL; original wire error not captured. A later pass cannot close this finding.' },
  { id: 'dataset-cap-intermittent', status: 'UNRESOLVED', releaseBlocker: true, evidence: 'https://github.com/alwat83/ifyoumind/pull/119', detail: 'Historical dataset-cap aggregate failure remains distinct; no supported correction verified.' },
]);
export function verificationSelection(level = 'release') {
  if (!LEVELS.includes(level)) throw Error('Unknown verification level: ' + level);
  const all = plan();
  const selected = all.filter(step => level === 'release' || (level === 'prototype' ? prototype.has(step.id) : level === 'backend' ? backend.has(step.id) : !sensitiveOnly.has(step.id)));
  const ids = new Set(selected.map(step => step.id));
  for (const step of selected) for (const need of step.needs) if (!ids.has(need)) throw Error('Profile prerequisite missing: ' + need);
  return { level, selected, notRun: all.filter(step => !ids.has(step.id)).map(step => ({ id: step.id, status: 'NOT_RUN', reason: 'Outside selected development level; not a pass or a waiver.' })),
    knownUnresolvedFailures: KNOWN_FAILURES, releaseAuthorized: false,
    manualGates: ['Founder experience review', 'Applicable branch protections and independent source review', 'Linux visual review where affected; device/assistive-technology gaps recorded', '#111 live retry and unresolved reliability findings', 'Fresh deployment-specific identity, configuration, rollback and smoke evidence', 'Explicit exact-scope founder merge/deployment authorization'] };
}
export function developmentStatus(report) {
  if (!report.integrity.valid) return 'INVALID';
  if (report.checks.some(c => c.status === 'FAIL')) return 'FAIL';
  if (report.checks.some(c => c.status === 'BLOCKED')) return 'BLOCKED';
  return 'PASS'; // Executed selected checks only, never Linux approval or release authorization.
}
export function selectionMarkdown(report) {
  const s = report.selection;
  return `\n## Risk-based scope\n\nLevel: **${s.level}**. Selected-check development status: **${developmentStatus(report)}**. Overall environmental/coverage status above remains separate. Production readiness: **NO-GO; no deployment authorization**.\n\nNot executed at this level: ${s.notRun.map(c => c.id).join(', ') || 'None of the full local plan'}. These are not passes.\n\nKnown unresolved findings (not cleared by this run):\n\n${s.knownUnresolvedFailures.map(f => '- [' + f.id + '](' + f.evidence + '): ' + f.detail).join('\n')}\n\nManual release gates:\n\n${s.manualGates.map(g => '- ' + g).join('\n')}\n`;
}

export function assertRiskScope(level, changedPaths) {
  verificationSelection(level);
  const sensitive = changedPaths.filter(p => /^(?:functions\/|firestore\.(?:rules|indexes\.json)$|storage\.rules$|firebase\.json$|\.github\/workflows\/|scripts\/(?:verify-local\.mjs|local-verification\/)|src\/app\/auth\/|src\/environments\/)/.test(p) || /(?:\.service|\.guard|\.routes)\.ts$|^src\/app\/app\.config\.ts$/.test(p));
  if (sensitive.length && !['backend', 'release'].includes(level)) throw Error('Sensitive scope requires backend or release verification: ' + sensitive.join(', '));
  return { changedPaths, minimumLevel: sensitive.length ? 'backend' : 'prototype', sensitivePaths: sensitive };
}
