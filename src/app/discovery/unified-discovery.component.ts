import {CommonModule,DOCUMENT,NgComponentOutlet} from '@angular/common';
import {Component,ElementRef,HostListener,Injector,OnInit,ViewChild,inject} from '@angular/core';
import {TaxDiscoveryComponent} from './tax-discovery.component';
import {TypedBillComponent} from './typed-bill.component';
import {ELECTRICITY_MODE,PUBLIC_DISCOVERY} from './discovery-mode';

@Component({selector:'app-unified-discovery',standalone:true,imports:[CommonModule,NgComponentOutlet,TypedBillComponent],templateUrl:'./unified-discovery.component.html',host:{'[class.public-discovery]':'publicEntry'},styleUrls:['./unified-discovery.component.scss']})
export class UnifiedDiscoveryComponent implements OnInit {
 readonly publicEntry=inject(PUBLIC_DISCOVERY);
 readonly journeyComponent=TaxDiscoveryComponent;
 private readonly parentInjector=inject(Injector);
 private readonly document=inject(DOCUMENT);
 category:'tax'|'electricity'|null=null;
 typed=false;
 childInjector:Injector|null=null;
 journeyInputs={embedded:true,startWithExample:false,startAtFile:false};
 message='';
 @ViewChild(NgComponentOutlet) outlet?:NgComponentOutlet<TaxDiscoveryComponent>;
 @ViewChild('entryHeading') entryHeading?:ElementRef<HTMLElement>;
 @ViewChild(TypedBillComponent) typedBill?:TypedBillComponent;
 get current():TaxDiscoveryComponent|null{return this.outlet?.componentInstance||null;}
 get hasData():boolean{return this.typedBill?.hasData === true || !!this.current&&(this.current.source!=='none'||this.current.reading||!!this.current.fileError);}
 ngOnInit():void {
  // Public links may open only these synthetic examples. No file data in URLs.
  if(!this.publicEntry)return;
  const example=new URLSearchParams(this.document.location?.search||'').get('example');
  if(example==='electricity'||example==='tax')this.choose(example);
 }
 choose(category:'tax'|'electricity',example=true):void {
  // Clear before destroying a journey; pending reads cannot repopulate its replacement.
  this.current?.clear(false);
  this.typedBill?.clear(false);
  this.typed=false;
  this.childInjector=Injector.create({parent:this.parentInjector,providers:[{provide:ELECTRICITY_MODE,useValue:category==='electricity'}]});
  this.journeyInputs={embedded:true,startWithExample:example,startAtFile:!example};
  this.category=category;this.message='';
 }
 enterNumbers(category:'tax'|'electricity'):void {
  this.current?.clear(false);
  this.typedBill?.clear(false);
  this.childInjector=null;
  this.typed=true;this.category=category;this.message='';
  requestAnimationFrame(()=>this.typedBill?.heading?.nativeElement.focus());
 }
 home(announce=true):void {
  this.clear(false);this.category=null;this.childInjector=null;this.typed=false;
  this.message=announce?'Data cleared from this page. Choose another bill to explore.':'';
  if(announce)setTimeout(()=>this.entryHeading?.nativeElement.focus());
 }
 clear(announce=true):void {this.current?.clear(announce);this.typedBill?.clear(announce);}
 @HostListener('window:pagehide') leave():void{this.home(false);}
 @HostListener('window:pageshow',['$event']) restore(event:PageTransitionEvent):void{if(event.persisted)this.home(false);}
}
