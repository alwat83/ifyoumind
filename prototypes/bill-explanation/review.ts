import { explainFixture, reviewFixture } from './experience';

function control<T extends HTMLElement = HTMLElement>(id: string): T {
  const element = document.getElementById(id);
  if (!element) throw new Error(`Missing control: ${id}`);
  return element as T;
}
const fixture = control<HTMLSelectElement>('fixture');
const evidence = control<HTMLDetailsElement>('evidence');
const explain = control<HTMLButtonElement>('explain');
const consent = control('consent');
const agree = control<HTMLButtonElement>('agree');
const explanation = control('explanation');
const status = control('status');
let sequence = 0;
let review = reviewFixture(fixture.value);

function appendText(parent: HTMLElement, tag: string, text: string) {
  const element = document.createElement(tag);
  element.textContent = text;
  parent.append(element);
}

function closeExplanation() {
  sequence++;
  agree.disabled = false;
  explain.hidden = !review.editorial;
  consent.hidden = true;
  explanation.hidden = true;
  control('takeaway').textContent = '';
  control('observations').replaceChildren();
  control('limit').textContent = '';
  control('next').textContent = '';
  status.textContent = '';
}

function showFixture() {
  closeExplanation();
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
  explain.hidden = !review.editorial;
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

fixture.addEventListener('change', showFixture);
explain.addEventListener('click', () => {
  explain.hidden = true;
  consent.hidden = false;
  control('consent-title').focus();
});
for (const name of ['cancel', 'hide-explanation']) {
  control(name).addEventListener('click', () => {
    closeExplanation();
    explain.focus();
  });
}
agree.addEventListener('click', async () => {
  agree.disabled = true;
  const active = ++sequence;
  const result = await explainFixture(review, true);
  if (active !== sequence) return;
  closeExplanation();
  if (result.kind !== 'mock') {
    status.textContent = 'No explanation was added. Your local finding and evidence are still above.';
    explain.focus();
    return;
  }
  explain.hidden = true;
  control('takeaway').textContent = result.takeaway;
  const observations = control('observations');
  for (const item of result.observations) {
    const li = document.createElement('li');
    addPoint(li, item);
    observations.append(li);
  }
  control('limit').textContent = result.limit;
  control('next').textContent = `Next: ${result.nextStep}`;
  explanation.hidden = false;
  control('explanation-title').focus();
});
showFixture();
