import { CommonModule } from '@angular/common';
import { Component, ElementRef, Input, ViewChild } from '@angular/core';
import { analyzeTypedBill } from './typed-bill';
import type { BillCategory, BillDraft, BillField, BillSide } from './typed-bill';

interface Field {
  id: BillField;
  label: string;
  inputMode?: 'decimal' | 'numeric';
  example?: string;
}

@Component({
  selector: 'app-typed-bill',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './typed-bill.component.html',
  styleUrls: ['./typed-bill.component.scss'],
})
export class TypedBillComponent {
  @Input({ required: true }) category!: BillCategory;
  @ViewChild('heading') heading?: ElementRef<HTMLElement>;
  @ViewChild('resultHeading') resultHeading?: ElementRef<HTMLElement>;
  @ViewChild('errors') errors?: ElementRef<HTMLElement>;
  @ViewChild('form') form?: ElementRef<HTMLFormElement>;

  drafts: Record<BillSide, BillDraft> = { current: {}, earlier: {} };
  analysis: ReturnType<typeof analyzeTypedBill> | null = null;
  comparing = false;
  sameBill = false;
  message = '';

  private readonly taxFields: readonly Field[] = [
    { id: 'year', label: 'Tax year', inputMode: 'numeric', example: '2026' },
    { id: 'total', label: 'Annual property tax (USD)', inputMode: 'decimal', example: '4620.00' },
  ];

  private readonly electricityFields: readonly Field[] = [
    { id: 'total', label: 'Current electric charges (USD)', inputMode: 'decimal', example: '145.20' },
    { id: 'usage', label: 'Electricity used (kWh)', inputMode: 'decimal', example: '660' },
    { id: 'start', label: 'Start meter-read date' },
    { id: 'end', label: 'End meter-read date' },
  ];

  get isTax(): boolean { return this.category === 'tax'; }
  get fields(): readonly Field[] { return this.isTax ? this.taxFields : this.electricityFields; }
  get sides(): BillSide[] { return this.comparing ? ['current', 'earlier'] : ['current']; }
  get hasData(): boolean {
    return this.comparing || Boolean(this.analysis) || Object.values(this.drafts.current).some(Boolean);
  }

  fieldError(side: BillSide, field: BillField): string | undefined {
    return this.analysis?.issues.find(issue => issue.side === side && issue.field === field)?.message;
  }

  get comparisonError(): string | undefined {
    return this.analysis?.issues.find(issue => !issue.field)?.message;
  }

  update(side: BillSide, field: BillField, event: Event): void {
    this.drafts[side][field] = (event.target as HTMLInputElement).value;
    this.analysis = null;
    this.message = '';
  }

  checkMatch(event: Event): void {
    this.sameBill = (event.target as HTMLInputElement).checked;
    this.analysis = null;
  }

  calculate(event: Event): void {
    event.preventDefault();
    this.message = '';
    this.analysis = analyzeTypedBill(this.category, this.drafts.current, this.comparing ? this.drafts.earlier : undefined, this.sameBill);
    if (this.analysis.finding) this.focus(() => this.resultHeading);
    else this.focus(() => this.errors);
  }

  edit(): void {
    this.analysis = null;
    this.focus(() => this.heading);
  }

  compare(): void {
    this.comparing = true;
    this.analysis = null;
    requestAnimationFrame(() => this.form?.nativeElement.querySelector<HTMLElement>('input[id^="earlier-"]')?.focus());
  }

  removeEarlier(): void {
    this.drafts.earlier = {};
    this.comparing = false;
    this.sameBill = false;
    this.edit();
  }

  clear(announce = true): void {
    this.drafts = { current: {}, earlier: {} };
    this.comparing = false;
    this.sameBill = false;
    this.analysis = null;
    this.message = announce ? 'Your bill details were cleared from this page.' : '';
    if (announce) this.focus(() => this.heading);
  }

  private focus(target: () => ElementRef<HTMLElement> | undefined): void {
    requestAnimationFrame(() => target()?.nativeElement.focus());
  }
}
