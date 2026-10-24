import { CommonModule } from '@angular/common';
import { Component, ElementRef, HostListener, ViewChild, inject, Input, OnInit, OnDestroy } from '@angular/core';
import {DiscoveryFindingsComponent} from './discovery-findings.component';
import {ELECTRICITY_MODE} from './discovery-mode';
import {analyzeElectricity,blankElectricity,ELECTRICITY_CSV,ELECTRICITY_FIELDS,ELECTRICITY_LABELS,parseElectricityCsv} from './electricity-discovery';
import type {ElectricityDraft,ElectricityField} from './electricity-discovery';
import { analyzeTax, blankRow, EXAMPLE_CSV, LABELS, parseTaxCsv, signedUsd, TAX_FIELDS, TaxAnalysis, TaxDraft, TaxField, usd } from './tax-discovery';

@Component({
  selector:'app-tax-discovery',standalone:true,imports:[CommonModule,DiscoveryFindingsComponent],
  templateUrl:'./tax-discovery.component.html',styleUrls:['./tax-discovery.component.scss','./tax-discovery-mobile.component.scss'],
})
export class TaxDiscoveryComponent implements OnInit, OnDestroy {
  @Input() embedded=false;
  @Input() startWithExample=false;
  @Input() startAtFile=false;
  ngOnInit():void {
    if(this.startWithExample)this.tryExample();
    else if(this.startAtFile)setTimeout(()=>this.fileInput?.nativeElement.focus());
  }
  ngOnDestroy():void {this.clear(false);}
  readonly isElectricity=inject(ELECTRICITY_MODE);
  readonly fields:readonly string[]=this.isElectricity?ELECTRICITY_FIELDS:TAX_FIELDS;
  readonly labels:Record<string,string>=this.isElectricity?ELECTRICITY_LABELS:LABELS;
  readonly exampleCsv=this.isElectricity?ELECTRICITY_CSV:EXAMPLE_CSV;
  readonly questions=this.isElectricity?[
    {id:'unit',title:'Is this my electricity rate?',answer:'No. Total billed divided by kWh is a whole-bill average, including fixed and other charges. Check the provider tariff and line items before drawing a price conclusion.'},
    {id:'cause',title:'Why did my bill change?',answer:'These two rows cannot verify a cause. Check actual versus estimated readings, billing adjustments, plan notices and matching household conditions. This prototype does not fetch that evidence.'},
    {id:'split',title:'Which charges are fixed or variable?',answer:'Only explicit bill labels support the identified split. If those labels are unavailable, use unknown; this experience does not infer the types from amounts or usage.'},
  ]:[
    {id:'assessment',title:'Did my assessment or exemptions change?',answer:'Check the assessment notice and exemption entries for both tax years. The billed amounts alone cannot tell us whether either changed. This preview does not analyze those documents.'},
    {id:'rates',title:'Were the rates or jurisdictions different?',answer:'Look for official rate notices and the same taxing authorities in both years. A matching percentage change is not proof of a rate change. No cause has been verified here.'},
    {id:'nearby',title:'How would I compare nearby places?',answer:'Match the tax year, property class, assessment basis, exemptions and taxing jurisdictions before comparing. Nearby bills or city averages may not be comparable. This preview does not fetch other properties or recommend a cheaper place.'},
  ];
  get followupAnswer():string{return this.questions.find(q=>q.id===this.followup)?.answer||'';}
  private blank():Record<string,string>{return this.isElectricity?blankElectricity():blankRow();}
  private parse(text:string){return this.isElectricity?parseElectricityCsv(text):parseTaxCsv(text);}
  readonly usd=usd;
  readonly signedUsd=signedUsd;
  rows:Record<string,string>[]=[this.blank(),this.blank()];
  columns:string[]=[...this.fields];
  analysis:TaxAnalysis|null=null;
  source:'none'|'example'|'csv'='none';
  edited=false;
  editorOpen=false;
  reading=false;
  fileError='';
  status='';
  followup='';
  private readVersion=0;
  @ViewChild('fileInput') fileInput?:ElementRef<HTMLInputElement>;
  @ViewChild('heading') heading?:ElementRef<HTMLElement>;
  get ready():TaxAnalysis|null{return this.analysis?.status==='ready'?this.analysis:null;}
  trackRow(index:number):number{return index;}
  tryExample():void {
    this.clear(false);
    const input=this.parse(this.exampleCsv);
    this.rows=input.rows;this.columns=input.columns;this.source='example';this.run();
  }
  async chooseFile(event:Event):Promise<void> {
    const input=event.target as HTMLInputElement;
    const file=input.files?.[0];
    if(!file)return;
    this.clear(false);
    const version=++this.readVersion;
    this.reading=true;this.status='Reading the CSV on this device…';
    try{
      if(!/\.csv$/i.test(file.name))throw new Error('Choose the supported CSV. PDF, spreadsheets and scans are not supported.');
      if(file.size>2_000_000)throw new Error('The CSV must be 2 MB or smaller.');
      let text:string;
      try{text=await file.text();}
      catch(error){
        // Keep a useful diagnostic code, never a private filename or browser error message.
        console.warn('Discovery file read failed',error instanceof Error?error.name:'UnknownError');
        throw new Error('Your browser couldn’t open this file. Choose it again, or try the example.');
      }
      if(version!==this.readVersion)return;
      const parsed=this.parse(text);
      this.rows=parsed.rows.length===1?[...parsed.rows,this.blank()]:parsed.rows;
      this.columns=parsed.columns;this.source='csv';this.run();
    }catch(error){
      if(version!==this.readVersion)return;
      this.fileError=error instanceof Error?error.message:'The CSV could not be read. Try the example or choose the file again.';
      this.status='No findings created. The file was not uploaded.';
    }finally{
      if(version===this.readVersion){this.reading=false;input.value='';}
    }
  }
  change(row:number,field:string,event:Event):void {
    this.rows=this.rows.map((value,index)=>index===row?{...value,[field]:(event.target as HTMLInputElement).value}:value);
    this.analysis=null;this.edited=true;this.followup='';this.fileError='';
    this.status='Data changed. Rerun discovery to calculate new findings.';
  }
  run():void {
    this.fileError='';this.followup='';this.analysis=this.isElectricity?analyzeElectricity(this.rows as ElectricityDraft[],this.columns as ElectricityField[]):analyzeTax(this.rows as TaxDraft[],this.columns as TaxField[]);
    if(this.analysis.status!=='ready')this.editorOpen=true;
    this.status=this.analysis.status==='ready'?`${this.analysis.findings.length} findings ready. ${this.embedded?'Here’s what changed in these two bills.':'Calculated locally from your two rows.'}`:'No findings created. Review the data below.';
    setTimeout(()=>this.heading?.nativeElement.focus());
  }
  fieldError(row:number,field:string):string {
    return this.analysis?.issues.filter(issue=>issue.row===row&&issue.field===field).map(issue=>issue.message).join(' ')||'';
  }
  totalWidth(value:number):number{return value/Math.max(...(this.ready?.totals||[1]),1)*100;}
  changeWidth(value:number):number{return Math.abs(value)/Math.max(...(this.ready?.changes.map(c=>Math.abs(c.delta))||[1]),1)*50;}
  clear(announce=true):void {
    this.readVersion++;this.rows=[this.blank(),this.blank()];this.columns=[...this.fields];
    this.analysis=null;this.source='none';this.edited=false;this.editorOpen=false;
    this.fileError='';this.reading=false;this.followup='';this.status=announce?'Data cleared from this page.':'';
    if(this.fileInput)this.fileInput.nativeElement.value='';
    if(announce)setTimeout(()=>this.heading?.nativeElement.focus());
  }
  @HostListener('window:pagehide') leave():void{this.clear(false);}
  @HostListener('window:pageshow',['$event']) restore(event:PageTransitionEvent):void{if(event.persisted)this.clear(false);}
  downloadExample():void {
    const url=URL.createObjectURL(new Blob([this.exampleCsv],{type:'text/csv'}));
    const anchor=document.createElement('a');anchor.href=url;anchor.download=this.isElectricity?'ifyoumind-example-electricity-v1.csv':'ifyoumind-example-tax-v1.csv';anchor.click();
    setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
}
