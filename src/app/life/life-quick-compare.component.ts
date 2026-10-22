import { CommonModule } from '@angular/common';
import { Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

interface Offer { city: string; salary: number; housing: number; commute: number; }
@Component({
  selector: 'app-life-quick-compare',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <main class="life">
      <nav><a routerLink="/">← ifYouMind</a><span>Life · Early preview</span></nav>
      <header><p class="eyebrow">A small decision tool, built for real life</p><h1>Which job offer fits your life?</h1>
      <p>Compare the numbers you know, then decide which trade-offs matter to you. No account needed.</p></header>
      <div class="notice" role="note">This is a simple, illustrative comparison using only numbers you enter. It does not estimate taxes, insurance, other living expenses, or local prices. Nothing is saved or sent to a server.</div>
      <section class="offers" aria-label="Enter two job offers">
        <fieldset *ngFor="let item of [0,1]; let i=index"><legend>Offer {{i+1}}</legend>
          <label>City or label<input [name]="'city'+i" [ngModel]="offers()[i].city" (ngModelChange)="setOffer(i,'city',$event)" maxlength="80"></label>
          <label>Annual salary ($)<input type="number" [name]="'salary'+i" [ngModel]="offers()[i].salary" (ngModelChange)="setOffer(i,'salary',$event)" min="0" max="100000000" step="1000"></label>
          <label>Monthly housing ($)<input type="number" [name]="'housing'+i" [ngModel]="offers()[i].housing" (ngModelChange)="setOffer(i,'housing',$event)" min="0" max="1000000" step="50"></label>
          <label>One-way commute (minutes)<input type="number" [name]="'commute'+i" [ngModel]="offers()[i].commute" (ngModelChange)="setOffer(i,'commute',$event)" min="0" max="1440" step="5"></label>
        </fieldset>
      </section>
      <section class="result" aria-live="polite">
        <p class="eyebrow">Your side-by-side view</p>
        <h2>What the inputs show</h2>
        <p *ngIf="!valid()">Enter nonnegative, realistic amounts in both offers to see the comparison.</p>
        <ng-container *ngIf="valid()">
          <div class="numbers"><article *ngFor="let item of [0,1]; let i=index">
            <h3>{{offers()[i].city || 'Offer '+(i+1)}}</h3>
            <strong>{{leftovers()[i] | currency:'USD':'symbol':'1.0-0'}}<small> / month</small></strong>
            <p>Gross monthly salary minus housing only</p>
            <span>{{offers()[i].commute}} min one-way commute</span>
          </article></div>
          <p class="insight" *ngIf="moneyDifference() !== 0">{{moneyLeader()}} has {{absoluteMoneyDifference() | currency:'USD':'symbol':'1.0-0'}} more per month before taxes and other expenses.</p>
          <p class="insight" *ngIf="moneyDifference() === 0">Both offers leave the same amount before taxes and other expenses.</p>
          <p *ngIf="commuteDifference() !== 0">{{commuteLeader()}} has a {{absoluteCommuteDifference()}}-minute shorter one-way commute.</p>
          <p *ngIf="commuteDifference() === 0">The entered commute times are equal.</p>
          <p class="caveat">These numbers are not take-home pay or disposable income. Higher gross salary after housing does not automatically make an offer better. Consider taxes, benefits, moving costs, transportation, and what matters most to you.</p>
        </ng-container>
      </section>
      <footer><a routerLink="/">Back to ifYouMind</a><span>Life preview · No sign-in required</span></footer>
    </main>
  `,
  styles: [`
    :host{display:block;background:#f7f8fc;color:#182235;min-height:100vh;font-family:inherit}
    .life{max-width:1020px;margin:auto;padding:20px 18px 64px}
    nav,footer{display:flex;justify-content:space-between;align-items:center;gap:14px;color:#64748b;font-size:14px}
    a{color:#4338ca;font-weight:700}header{padding:64px 0 24px;max-width:780px}
    .eyebrow{font-size:12px;text-transform:uppercase;letter-spacing:.12em;color:#4f46e5;font-weight:800}
    h1{font-size:clamp(36px,6vw,68px);line-height:1.02;letter-spacing:-.055em;margin:10px 0 20px}
    header>p:last-child{font-size:19px;line-height:1.55;color:#526078}
    .notice{background:#eef2ff;border:1px solid #c7d2fe;border-radius:14px;padding:15px 18px;line-height:1.5;margin-bottom:24px}
    .offers,.numbers{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}
    fieldset,.result{min-width:0;background:white;border:1px solid #e0e5ef;border-radius:20px;padding:24px}
    legend{font-weight:800;padding:0 8px}label{display:block;font-weight:650;font-size:14px;margin:12px 0}
    input{display:block;box-sizing:border-box;width:100%;min-height:46px;margin-top:6px;border:1px solid #aab4c5;border-radius:10px;padding:10px 12px;font:inherit;color:#182235}
    input:focus-visible,a:focus-visible{outline:3px solid #6366f1;outline-offset:2px}
    .result{margin-top:20px}.result h2{font-size:30px;letter-spacing:-.04em}
    .numbers article{background:#f5f7ff;padding:20px;border-radius:14px}
    .numbers h3{margin:0 0 12px}.numbers strong{font-size:clamp(25px,4vw,40px);letter-spacing:-.04em}.numbers small{font-size:14px;letter-spacing:normal}
    .numbers p,.caveat{font-size:13px;line-height:1.5;color:#5f6b7d}
    .numbers span{font-size:14px}.insight{font-weight:750;margin-top:22px}
    .caveat{border-top:1px solid #e5e7eb;padding-top:15px}
    footer{margin-top:35px}
    @media(max-width:650px){header{padding-top:36px}.offers,.numbers{grid-template-columns:1fr}fieldset,.result{padding:18px}footer{align-items:flex-start;flex-direction:column}}
  `]
})
export class LifeQuickCompareComponent {
  readonly offers = signal<Offer[]>([
    {city:'Offer A',salary:80000,housing:1800,commute:25},
    {city:'Offer B',salary:90000,housing:2500,commute:40}
  ]);
  setOffer(index:number,key:keyof Offer,value:string|number):void {
    this.offers.update(items => items.map((item,i) => i===index ? {...item,[key]:key==='city'?String(value):value === '' ? NaN : Number(value)} : item));
  }
  readonly valid = computed(() => this.offers().every(o => Number.isFinite(o.salary) && o.salary>=0 && o.salary<=100000000 && Number.isFinite(o.housing) && o.housing>=0 && o.housing<=1000000 && Number.isFinite(o.commute) && o.commute>=0 && o.commute<=1440));
  readonly leftovers = computed(() => this.offers().map(o => o.salary/12-o.housing));
  readonly moneyDifference = computed(() => this.leftovers()[0]-this.leftovers()[1]);
  readonly absoluteMoneyDifference = computed(() => Math.abs(this.moneyDifference()));
  readonly moneyLeader = computed(() => this.offers()[this.moneyDifference()>0?0:1].city || (this.moneyDifference()>0?'Offer 1':'Offer 2'));
  readonly commuteDifference = computed(() => this.offers()[0].commute-this.offers()[1].commute);
  readonly absoluteCommuteDifference = computed(() => Math.abs(this.commuteDifference()));
  readonly commuteLeader = computed(() => this.offers()[this.commuteDifference()<0?0:1].city || (this.commuteDifference()<0?'Offer 1':'Offer 2'));
}
