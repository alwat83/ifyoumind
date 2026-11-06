import {CommonModule} from '@angular/common';
import {Component,ElementRef,Input,OnChanges,QueryList,ViewChildren} from '@angular/core';
import {signedUsd,usd} from './discovery-core';
import type {DiscoveryAnalysis,DiscoveryFinding} from './discovery-core';
@Component({selector:'app-discovery-findings',standalone:true,imports:[CommonModule],templateUrl:'./discovery-findings.component.html',styleUrls:['./discovery-findings.component.scss','./discovery-findings-spotlight.component.scss']})
export class DiscoveryFindingsComponent implements OnChanges {
 @Input({required:true}) report!:DiscoveryAnalysis;
 @Input() source='none';
 @Input() edited=false;
 @ViewChildren('findingHeading') headings!:QueryList<ElementRef<HTMLElement>>;
 @ViewChildren('evidencePanel') evidencePanels!:QueryList<ElementRef<HTMLDetailsElement>>;
 exploredIndex:number|null=null;
 ngOnChanges():void{this.exploredIndex=null;}
 readonly usd=usd;readonly signedUsd=signedUsd;
 get spotlight():DiscoveryFinding|undefined{return this.report.findings.find(f=>!!f.highlight);}
 get billChangeValue():string{return this.spotlight?.id==='consumption'&&this.report.percent!==null?(this.report.delta>0?'+':'')+this.report.percent:signedUsd(this.report.delta);}
 showSpotlight():void{const finding=this.spotlight;if(finding)this.explore(this.report.findings.indexOf(finding),true);}
 topic(id:string):string{return ({total:'The big picture',consumption:'Energy used','unit-cost':'Bill average',components:'Charge changes',classification:'Charge labels',pattern:'Shared change'} as Record<string,string>)[id]||'Another finding';}
 symbol(id:string):string{return ({total:'↔',consumption:'ϟ','unit-cost':'÷',components:'≋',classification:'▤',pattern:'✳'} as Record<string,string>)[id]||'✦';}
 explore(index:number,reveal=false):void{
  const target=this.headings.get(index)?.nativeElement;
  if(!target)return;
  this.exploredIndex=index>0?index:null;
  const evidence=this.evidencePanels.get(index)?.nativeElement;
  if(reveal&&evidence)evidence.open=true;
  target.focus();
 }
 totalWidth(value:number):number{return value/Math.max(...this.report.totals,1)*100;}
 changeWidth(value:number):number{return Math.abs(value)/Math.max(...this.report.changes.map(c=>Math.abs(c.delta)),1)*50;}
}
