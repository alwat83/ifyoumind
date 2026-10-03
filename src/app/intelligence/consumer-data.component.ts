import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { OrganizationService } from './organization.service';
import { UniversalDataService, UniversalDataset } from './universal-data.service';
import { CsvTable, parseCsv, suggestColumn } from './csv-parser';

@Component({
  selector:'app-consumer-data',
  standalone:true,
  imports:[CommonModule,FormsModule,RouterLink],
  templateUrl:'./consumer-data.component.html',
  styleUrls:['./consumer-data.component.scss'],
})
export class ConsumerDataComponent implements OnInit {
  private readonly organizations=inject(OrganizationService);
  private readonly data=inject(UniversalDataService);

  datasets:UniversalDataset[]=[];
  table:CsvTable|null=null;
  fileName='';
  datasetName='';
  unit='number';
  sourceLabel='My upload';
  valueColumn='';
  periodColumn='';
  geographyColumn='';
  entityColumn='';
  importing=false;
  importedCount:number|null=null;
  error='';

  async ngOnInit():Promise<void>{
    try{
      let workspace=await this.organizations.getMyWorkspace();
      if(!workspace){
        await this.organizations.createWorkspace('My ifYouMind');
        workspace=await this.organizations.getMyWorkspace();
      }
      if(workspace) this.datasets=await this.data.list(workspace.organizationId);
    }catch(error){this.error=this.message(error);}
  }

  async chooseFile(event:Event):Promise<void>{
    const input=event.target as HTMLInputElement;
    const file=input.files?.[0];
    if(!file)return;
    this.error=''; this.importedCount=null;
    try{
      if(file.size>2_000_000) throw new Error('That file is larger than 2 MB. Try a smaller CSV for now.');
      const text=await file.text();
      const table=parseCsv(text);
      if(table.rows.length>400) throw new Error('This version supports up to 400 rows per upload.');
      this.table=table;
      this.fileName=file.name;
      this.datasetName=this.datasetName||file.name.replace(/\.csv$/i,'').replace(/[-_]+/g,' ');
      this.valueColumn=suggestColumn(table.headers,['value','amount','price','rate','count','score','metric']);
      this.periodColumn=suggestColumn(table.headers,['period','date','month','year','time','timestamp']);
      this.geographyColumn=suggestColumn(table.headers,['geography','zip','zipcode','postalcode','city','county','state','location']);
      this.entityColumn=suggestColumn(table.headers,['entity','name','property','category','area','neighborhood']);
    }catch(error){
      this.table=null;
      this.error=this.message(error);
    }finally{input.value='';}
  }

  previewRows():string[][]{return this.table?.rows.slice(0,4)||[];}

  async import():Promise<void>{
    if(!this.table||!this.datasetName.trim()||!this.valueColumn||!this.periodColumn||this.importing)return;
    this.importing=true; this.error='';
    try{
      let workspace=await this.organizations.getMyWorkspace();
      if(!workspace) throw new Error('Workspace not found.');

      const metric=this.datasetName.trim().toLowerCase().replace(/[^a-z0-9]+/g,'_').replace(/^_+|_+$/g,'')||'uploaded_metric';
      const datasetId=await this.data.create(workspace.organizationId,{
        name:this.datasetName.trim(),
        metric,
        unit:this.unit.trim()||'number',
        sourceLabel:this.sourceLabel.trim()||'My upload',
        description:`Imported from ${this.fileName}`,
      });

      const index=new Map(this.table.headers.map((header,i)=>[header,i]));
      const valueIndex=index.get(this.valueColumn)!;
      const periodIndex=index.get(this.periodColumn)!;
      const geographyIndex=this.geographyColumn?index.get(this.geographyColumn):undefined;
      const entityIndex=this.entityColumn?index.get(this.entityColumn):undefined;
      const reserved=new Set([this.valueColumn,this.periodColumn,this.geographyColumn,this.entityColumn].filter(Boolean));

      const observations=this.table.rows.map((row,rowIndex)=>{
        const raw=row[valueIndex].replace(/[$,%]/g,'').trim();
        const value=Number(raw);
        if(!Number.isFinite(value)) throw new Error(`Row ${rowIndex+2} has a value I can't read as a number: "${row[valueIndex]}".`);
        const period=row[periodIndex].trim();
        if(!period) throw new Error(`Row ${rowIndex+2} is missing its date or period.`);
        const dimensions:Record<string,string>={};
        for(const header of this.table!.headers){
          if(reserved.has(header))continue;
          const cell=row[index.get(header)!].trim();
          if(cell) dimensions[header]=cell;
        }
        return{
          value,
          period,
          geography:geographyIndex===undefined?null:(row[geographyIndex].trim()||null),
          entity:entityIndex===undefined?null:(row[entityIndex].trim()||null),
          dimensions,
        };
      });

      this.importedCount=await this.data.importObservations(workspace.organizationId,datasetId,observations);
      this.datasets=await this.data.list(workspace.organizationId);
      this.table=null;
      this.fileName='';
      this.datasetName='';
    }catch(error){this.error=this.message(error);}
    finally{this.importing=false;}
  }

  private message(error:unknown):string{
    if(error&&typeof error==='object'&&'message' in error){
      return String((error as {message?:unknown}).message||'Something went wrong.');
    }
    return 'Something went wrong.';
  }
}
