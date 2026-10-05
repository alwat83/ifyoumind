const fs = require('fs');
const path = require('path');

const angular = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'angular.json'), 'utf8'));
const budgets = angular.projects?.ifyoumind?.architect?.build?.configurations?.production?.budgets || [];
const styleBudget = budgets.find((budget) => budget.type === 'anyComponentStyle');

function toBytes(value) {
  if (typeof value !== 'string') return null;
  const match = value.trim().match(/^(\d+(?:\.\d+)?)(kb|kB|mb|mB|b)?$/i);
  if (!match) return null;
  const amount = Number(match[1]);
  const unit = (match[2] || 'b').toLowerCase();
  if (unit === 'kb') return Math.round(amount * 1024);
  if (unit === 'mb') return Math.round(amount * 1024 * 1024);
  return Math.round(amount);
}

const hardLimit = toBytes(styleBudget?.maximumError);
if (!hardLimit) {
  console.error('Preflight could not resolve the Angular anyComponentStyle maximumError budget.');
  process.exit(1);
}

// Leave a small buffer because compiled component CSS can differ slightly from source size.
const safeLimit = hardLimit - 32;
const root = path.join(__dirname, '..', 'src');

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });
}

const styles = walk(root).filter((file) => file.endsWith('.component.scss'));
const oversized = styles
  .map((file) => ({
    file: path.relative(path.join(__dirname, '..'), file),
    bytes: fs.statSync(file).size,
  }))
  .filter((item) => item.bytes > safeLimit)
  .sort((a, b) => b.bytes - a.bytes);

if (oversized.length) {
  console.error(`Component style preflight failed. Keep source styles at or below ${safeLimit} bytes (Angular hard limit: ${hardLimit} bytes).`);
  for (const item of oversized) console.error(`- ${item.file}: ${item.bytes} bytes`);
  process.exit(1);
}

console.log(`Component style preflight passed: ${styles.length} files checked, safe limit ${safeLimit} bytes.`);
