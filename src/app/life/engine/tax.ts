// Rough federal income tax + FICA estimate for a single filer on the standard deduction.
// It is shown to the user as an editable ESTIMATE, never as a tax calculation. State and local
// income tax are not included (the page says so). Sources: IRS Rev. Proc. 2025-32 (tax year 2026)
// and SSA's 2026 wage base, per docs/research/life/appendix-data-sources.md. The 0.9% Additional
// Medicare tax threshold is statutory ($200,000 single) and still marked "to confirm" there.

export interface TaxConstants {
  year:number;
  standardDeduction:number;
  /** [upper bound of the bracket, rate]; the last bound is Infinity. */
  brackets:ReadonlyArray<readonly [number,number]>;
  socialSecurityRate:number;
  socialSecurityWageBase:number;
  medicareRate:number;
  additionalMedicareRate:number;
  additionalMedicareThreshold:number;
}

export const TAX_2026_SINGLE:TaxConstants=Object.freeze({
  year:2026,
  standardDeduction:16100,
  brackets:[[12400,.10],[50400,.12],[105700,.22],[201775,.24],[256225,.32],[640600,.35],[Infinity,.37]] as const,
  socialSecurityRate:.062,
  socialSecurityWageBase:184500,
  medicareRate:.0145,
  additionalMedicareRate:.009,
  additionalMedicareThreshold:200000,
});

export interface TaxEstimate { federal:number; socialSecurity:number; medicare:number; total:number; share:number }

export function estimateTax(salary:number,c:TaxConstants=TAX_2026_SINGLE):TaxEstimate{
  const wages=Math.max(0,Number.isFinite(salary)?salary:0);
  const taxable=Math.max(0,wages-c.standardDeduction);
  let federal=0, lower=0;
  for(const [upper,rate] of c.brackets){
    if(taxable<=lower)break;
    federal+=(Math.min(taxable,upper)-lower)*rate;
    lower=upper;
  }
  const socialSecurity=Math.min(wages,c.socialSecurityWageBase)*c.socialSecurityRate;
  const medicare=wages*c.medicareRate+Math.max(0,wages-c.additionalMedicareThreshold)*c.additionalMedicareRate;
  const total=federal+socialSecurity+medicare;
  return {federal,socialSecurity,medicare,total,share:wages?total/wages:0};
}
