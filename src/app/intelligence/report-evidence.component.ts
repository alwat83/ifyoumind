import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { ComparisonCheck, EvidenceValue, PlaceEvidence, ReportEvidence, ReportEvidenceReady } from './market-intelligence.service';
import { formatCount, formatShare, formatUsd, plusMinus, verdictLabel } from './report-evidence-format';

@Component({
  selector:'app-report-evidence',
  standalone:true,
  imports:[CommonModule],
  templateUrl:'./report-evidence.component.html',
  styleUrls:['./report-evidence.component.scss'],
})
export class ReportEvidenceComponent {
  @Input({required:true}) evidence!:ReportEvidence;
  /** Sample report only: marks this section as part of the paid report. */
  @Input() includedInReport=false;
  selected:number|null=null;

  get ready():ReportEvidenceReady|null{
    return this.evidence.status==='unavailable'?null:this.evidence;
  }

  get threshold():number{
    return this.selected??this.ready?.defaultThreshold??75000;
  }

  affordable(place:PlaceEvidence){
    return place.affordable.find(a=>a.threshold===this.threshold);
  }

  readonly usd=formatUsd;
  readonly count=formatCount;
  readonly share=formatShare;
  readonly verdict=verdictLabel;

  pm(value:EvidenceValue,kind:'count'|'share'|'usd'|'points'):string{
    return plusMinus(value,kind);
  }

  checkValue(check:ComparisonCheck,value:EvidenceValue):string{
    if(value.value===null)return 'Not published';
    if(check.unit==='USD')return formatUsd(value.value);
    if(check.unit==='share')return formatShare(value.value);
    if(check.unit==='count')return formatCount(value.value);
    return `${value.value>=0?'+':''}${value.value.toFixed(1)}%`;
  }

  groups(e:ReportEvidenceReady):Array<{location:string;checks:ComparisonCheck[]}>{
    const out:Array<{location:string;checks:ComparisonCheck[]}>=[];
    for(const check of e.comparisons){
      let group=out.find(g=>g.location===check.otherLocation);
      if(!group){group={location:check.otherLocation,checks:[]};out.push(group);}
      group.checks.push(check);
    }
    return out;
  }

  low(value:EvidenceValue):boolean{
    return value.reliability==='low';
  }
}
