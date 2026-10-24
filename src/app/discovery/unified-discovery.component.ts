import {CommonModule,NgComponentOutlet} from '@angular/common';
import {Component,ElementRef,HostListener,Injector,ViewChild,inject} from '@angular/core';
import {TaxDiscoveryComponent} from './tax-discovery.component';
import {ELECTRICITY_MODE,PUBLIC_DISCOVERY} from './discovery-mode';

@Component({selector:'app-unified-discovery',standalone:true,imports:[CommonModule,NgComponentOutlet],templateUrl:'./unified-discovery.component.html',styleUrls:['./unified-discovery.component.scss']})
export class UnifiedDiscoveryComponent {
 readonly publicEntry=inject(PUBLIC_DISCOVERY);
 readonly journeyComponent=TaxDiscoveryComponent;
 private readonly parentInjector=inject(Injector);
 category:'tax'|'electricity'|null=null;
 childInjector:Injector|null=null;
 journeyInputs={embedded:true,startWithExample:false,startAtFile:false};
 message='';
 @ViewChild(NgComponentOutlet) outlet?:NgComponentOutlet<TaxDiscoveryComponent>;
 @ViewChild('entryHeading') entryHeading?:ElementRef<HTMLElement>;
 get current():TaxDiscoveryComponent|null{return this.outlet?.componentInstance||null;}
 get hasData():boolean{return !!this.current&&(this.current.source!=='none'||this.current.reading||!!this.current.fileError);}
 choose(category:'tax'|'electricity',example=true):void {
  // Clear before destroying a journey; pending reads cannot repopulate its replacement.
  this.current?.clear(false);
  this.childInjector=Injector.create({parent:this.parentInjector,providers:[{provide:ELECTRICITY_MODE,useValue:category==='electricity'}]});
  this.journeyInputs={embedded:true,startWithExample:example,startAtFile:!example};
  this.category=category;this.message='';
 }
 home(announce=true):void {
  this.current?.clear(false);this.category=null;this.childInjector=null;
  this.message=announce?'Data cleared from this page. Choose another bill to explore.':'';
  if(announce)setTimeout(()=>this.entryHeading?.nativeElement.focus());
 }
 clear():void {this.current?.clear();}
 @HostListener('window:pagehide') leave():void{this.home(false);}
 @HostListener('window:pageshow',['$event']) restore(event:PageTransitionEvent):void{if(event.persisted)this.home(false);}
}
