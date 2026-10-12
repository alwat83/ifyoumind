import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { MarketAnalysisSection } from './market-intelligence.service';

@Component({
  selector:'app-market-analysis',
  standalone:true,
  imports:[CommonModule],
  templateUrl:'./market-analysis.component.html',
  styleUrls:['./market-analysis.component.scss'],
})
export class MarketAnalysisComponent {
  @Input({required:true}) section!:MarketAnalysisSection;
  /** Sample report only: marks this section as part of the paid report. */
  @Input() includedInReport=false;
  copied=false;

  async copy():Promise<void>{
    try{
      await navigator.clipboard.writeText(this.section.plainText);
      this.copied=true;
      setTimeout(()=>this.copied=false,2500);
    }catch{
      this.copied=false;
    }
  }

  format(value:number,unit:string):string{
    if(unit==='USD')return new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0}).format(value);
    if(unit==='%')return `${value}%`;
    return new Intl.NumberFormat('en-US').format(value);
  }
}
