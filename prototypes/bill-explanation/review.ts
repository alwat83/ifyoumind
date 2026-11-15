import { explainFixture, fixedExplanation, isFixture, reviewFixture } from './experience';

function control<T extends HTMLElement = HTMLElement>(id: string): T {
  const element = document.getElementById(id);
  if (!element) throw new Error(`Missing control: ${id}`);
  return element as T;
}
const fixture = control<HTMLSelectElement>('fixture');
const mode = control<HTMLSelectElement>('mode');
const evidence = control<HTMLDetailsElement>('evidence');
const explanation = control('explanation');
const status = control('status');
let sequence = 0;
let review = reviewFixture(fixture.value);

function appendText(parent: HTMLElement, tag: string, text: string) {
  const element = document.createElement(tag);
  element.textContent = text;
  parent.append(element);
}

async function showExplanation() {
  const active = ++sequence;
  explanation.hidden = true;
  control('takeaway').textContent = '';
  control('observations').replaceChildren();
  control('limit').textContent = '';
  control('next').textContent = '';
  status.textContent = '';
  if (mode.value === '1' || !review.editorial) return;

  let content = null;
  if (mode.value === '2') {
    content = fixedExplanation(review);
  } else {
    const result = await explainFixture(review);
    if (active !== sequence) return;
    if (result.kind === 'mock') content = result.explanation;
    else status.textContent = 'The original finding and evidence are above.';
  }
  if (!content) return;

  control('takeaway').textContent = content.takeaway;
  const observations = control('observations');
  for (const item of content.observations) {
    const li = document.createElement('li');
    addPoint(li, item);
    observations.append(li);
  }
  control('limit').textContent = content.limit;
  control('next').textContent = `Next: ${content.nextStep}`;
  explanation.hidden = false;
}

function showFixture() {
  review = reviewFixture(fixture.value);
  const { finding, issues } = review;
  control('finding').textContent = finding?.title ?? 'A finding needs more evidence.';
  control('detail').textContent = finding?.detail ?? 'The local check stopped here without estimating a result.';
  const validation = control('validation');
  validation.textContent = issues.map(issue => issue.message).join(' ');
  validation.hidden = !issues.length;
  evidence.hidden = !finding;
  evidence.open = false;
  const arithmetic = control('arithmetic');
  const figures = control('figures');
  arithmetic.replaceChildren();
  figures.replaceChildren();
  finding?.steps.forEach(step => appendText(arithmetic, 'li', step));
  finding?.cells.forEach(cell => {
    appendText(figures, 'dt', `${cell.cell}: ${cell.label}`);
    appendText(figures, 'dd', cell.used);
  });
  void showExplanation();
}

function addPoint(parent: HTMLElement, item: { text: string; evidence: string }) {
  appendText(parent, 'div', item.text);
  const reference = document.createElement('button');
  reference.type = 'button';
  reference.className = 'reference';
  reference.textContent = `Evidence: ${item.evidence}`;
  reference.addEventListener('click', () => {
    evidence.open = true;
    control('evidence-toggle').focus();
  });
  parent.append(reference);
}

const trial = new URLSearchParams(location.search);
const trialFixture = trial.get('bill') ?? '';
const trialView = trial.get('view') ?? '';
if (isFixture(trialFixture) && ['1', '2', '3'].includes(trialView)) {
  fixture.value = trialFixture;
  mode.value = trialView;
} else {
  control('review-controls').hidden = false;
}
fixture.addEventListener('change', showFixture);
mode.addEventListener('change', showExplanation);
showFixture();
