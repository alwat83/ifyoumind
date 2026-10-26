import {CommonModule} from '@angular/common';
import {Component,Input} from '@angular/core';
import {signedUsd,usd} from './discovery-core';
import type {DiscoveryAnalysis} from './discovery-core';
@Component({selector:'app-discovery-findings',standalone:true,imports:[CommonModule],templateUrl:'./discovery-findings.component.html',styleUrls:['./discovery-findings.component.scss']})
export class DiscoveryFindingsComponent {
 @Input({required:true}) report!:DiscoveryAnalysis;
 @Input() source='none';
 @Input() edited=false;
 readonly usd=usd;readonly signedUsd=signedUsd;
 totalWidth(value:number):number{return value/Math.max(...this.report.totals,1)*100;}
 changeWidth(value:number):number{return Math.abs(value)/Math.max(...this.report.changes.map(c=>Math.abs(c.delta)),1)*50;}
}
