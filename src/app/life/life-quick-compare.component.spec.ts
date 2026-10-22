import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { LifeQuickCompareComponent } from './life-quick-compare.component';

describe('Life quick comparison', () => {
  beforeEach(() => TestBed.configureTestingModule({
    imports: [LifeQuickCompareComponent], providers: [provideRouter([])],
  }));

  it('shows illustrative gross money and independent commute trade-offs', () => {
    const fixture = TestBed.createComponent(LifeQuickCompareComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance;
    expect(component.valid()).toBeTrue();
    expect(component.leftovers()[0]).toBeCloseTo(80000 / 12 - 1800);
    expect(component.moneyLeader()).toBe('Offer B');
    expect(component.commuteLeader()).toBe('Offer A');
    expect(fixture.nativeElement.textContent).toContain('not take-home pay');
  });

  it('updates results and preserves ties and negative balances', () => {
    const fixture = TestBed.createComponent(LifeQuickCompareComponent);
    const component = fixture.componentInstance;
    component.setOffer(1, 'salary', 80000);
    component.setOffer(1, 'housing', 1800);
    component.setOffer(1, 'commute', 25);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Both offers leave the same amount');
    expect(fixture.nativeElement.textContent).toContain('commute times are equal');
    component.setOffer(0, 'salary', 0);
    expect(component.leftovers()[0]).toBe(-1800);
  });

  for (const value of [null, '', -1, Infinity, NaN, 100000001]) {
    it(`hides calculations for invalid salary ${value}`, () => {
      const fixture = TestBed.createComponent(LifeQuickCompareComponent);
      fixture.componentInstance.setOffer(0, 'salary', value);
      fixture.detectChanges();
      expect(fixture.componentInstance.valid()).toBeFalse();
      expect(fixture.nativeElement.querySelector('.numbers')).toBeNull();
    });
  }

  it('handles cleared number inputs through Angular forms and recovers after editing', async () => {
    const fixture = TestBed.createComponent(LifeQuickCompareComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    const salary: HTMLInputElement = fixture.nativeElement.querySelector('input[type="number"]');
    salary.value = '';
    salary.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(fixture.componentInstance.valid()).toBeFalse();
    salary.value = '72000';
    salary.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(fixture.componentInstance.valid()).toBeTrue();
    expect(fixture.componentInstance.leftovers()[0]).toBe(4200);
  });

  it('rejects housing and commute outside supported ranges and treats labels as text', () => {
    const fixture = TestBed.createComponent(LifeQuickCompareComponent);
    const component = fixture.componentInstance;
    component.setOffer(0, 'housing', 1000001);
    expect(component.valid()).toBeFalse();
    component.setOffer(0, 'housing', 0);
    component.setOffer(0, 'commute', 1441);
    expect(component.valid()).toBeFalse();
    component.setOffer(0, 'commute', 0);
    component.setOffer(0, 'city', '<img src=x onerror=alert(1)>');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.numbers img')).toBeNull();
    expect(fixture.nativeElement.textContent).toContain('<img src=x onerror=alert(1)>');
  });
});
