import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges } from '@angular/core';
import { proofNumber } from './report-proof';
import type { ProofKey, ReportProof } from './report-proof';

@Component({
  selector:'app-report-proof', standalone:true, imports:[CommonModule],
  templateUrl:'./report-proof.component.html', styleUrl:'./report-proof.component.scss',
})
export class ReportProofComponent implements OnChanges {
  @Input({required:true}) proof!: ReportProof;
  selected: ProofKey = 'income';
  readonly number = proofNumber;
  ngOnChanges(): void {
    this.selected = this.proof?.lenses[0]?.key || 'income';
  }
  jump(event: Event, id: string): void {
    const target = document.getElementById(id);
    if (!target) return;
    event.preventDefault();
    target.setAttribute('tabindex','-1');
    target.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth', block:'start'});
    target.focus({preventScroll:true});
  }
}
