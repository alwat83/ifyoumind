import { CommonModule } from '@angular/common';
import { Component, ElementRef, HostListener, ViewChild } from '@angular/core';
import { analyzeTax, blankRow, EXAMPLE_CSV, LABELS, parseTaxCsv, signedUsd, TAX_FIELDS, TaxAnalysis, TaxDraft, TaxField, usd } from './tax-discovery';

@Component({
  selector:'app-tax-discovery',standalone:true,imports:[CommonModule],
  templateUrl:'./tax-discovery.component.html',styleUrls:['./tax-discovery.component.scss','./tax-discovery-mobile.component.scss'],
})
export class TaxDiscoveryComponent {
  readonly fields=TAX_FIELDS;
  readonly labels=LABELS;
  readonly usd=usd;
  readonly signedUsd=signedUsd;
  rows:TaxDraft[]=[blankRow(),blankRow()];
  columns:TaxField[]=[...TAX_FIELDS];
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
    const input=parseTaxCsv(EXAMPLE_CSV);
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
      const parsed=parseTaxCsv(text);
      this.rows=parsed.rows.length===1?[...parsed.rows,blankRow()]:parsed.rows;
      this.columns=parsed.columns;this.source='csv';this.run();
    }catch(error){
      if(version!==this.readVersion)return;
      this.fileError=error instanceof Error?error.message:'The CSV could not be read. Try the example or choose the file again.';
      this.status='No findings created. The file was not uploaded.';
    }finally{
      if(version===this.readVersion){this.reading=false;input.value='';}
    }
  }
  change(row:number,field:TaxField,event:Event):void {
    this.rows=this.rows.map((value,index)=>index===row?{...value,[field]:(event.target as HTMLInputElement).value}:value);
    this.analysis=null;this.edited=true;this.followup='';this.fileError='';
    this.status='Data changed. Rerun discovery to calculate new findings.';
  }
  run():void {
    this.fileError='';this.followup='';this.analysis=analyzeTax(this.rows,this.columns);
    if(this.analysis.status!=='ready')this.editorOpen=true;
    this.status=this.analysis.status==='ready'?`${this.analysis.findings.length} findings ready. Calculated locally from your two rows.`:'No findings created. Review the data below.';
    setTimeout(()=>this.heading?.nativeElement.focus());
  }
  fieldError(row:number,field:TaxField):string {
    return this.analysis?.issues.filter(issue=>issue.row===row&&issue.field===field).map(issue=>issue.message).join(' ')||'';
  }
  totalWidth(value:number):number{return value/Math.max(...(this.ready?.totals||[1]),1)*100;}
  changeWidth(value:number):number{return Math.abs(value)/Math.max(...(this.ready?.changes.map(c=>Math.abs(c.delta))||[1]),1)*50;}
  clear(announce=true):void {
    this.readVersion++;this.rows=[blankRow(),blankRow()];this.columns=[...TAX_FIELDS];
    this.analysis=null;this.source='none';this.edited=false;this.editorOpen=false;
    this.fileError='';this.reading=false;this.followup='';this.status=announce?'Data cleared from this page.':'';
    if(this.fileInput)this.fileInput.nativeElement.value='';
    if(announce)setTimeout(()=>this.heading?.nativeElement.focus());
  }
  @HostListener('window:pagehide') leave():void{this.clear(false);}
  @HostListener('window:pageshow',['$event']) restore(event:PageTransitionEvent):void{if(event.persisted)this.clear(false);}
  downloadExample():void {
    const url=URL.createObjectURL(new Blob([EXAMPLE_CSV],{type:'text/csv'}));
    const anchor=document.createElement('a');anchor.href=url;anchor.download='ifyoumind-example-tax-v1.csv';anchor.click();
    setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
}
