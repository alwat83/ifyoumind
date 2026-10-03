import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AskService, RecentQuestion, SavedQuestion, UniversalAskResponse } from './ask.service';
import { IntelligenceOrganization, OrganizationService } from './organization.service';

@Component({
  selector:'app-ask-intelligence',
  standalone:true,
  imports:[CommonModule,FormsModule,RouterLink],
  templateUrl:'./ask.component.html',
  styleUrls:['./ask.component.scss'],
})
export class AskIntelligenceComponent implements OnInit {
  private readonly organizations=inject(OrganizationService);
  private readonly askService=inject(AskService);
  workspace:IntelligenceOrganization|null=null;
  question=''; response:UniversalAskResponse|null=null; lastAskedQuestion='';
  recent:RecentQuestion[]=[]; saved:SavedQuestion[]=[];
  loading=true; asking=false; error='';
  readonly prompts=[
    'What seems to be driving Median Home Price?',
    'What is most strongly related to Crime Rate?',
    'What else is related to Population Growth Index?',
    'What seems to explain Median Household Income?',
  ];
  async ngOnInit():Promise<void>{
    try{
      this.workspace=await this.organizations.getMyWorkspace();
      if(this.workspace){
        [this.recent,this.saved]=await Promise.all([
          this.askService.recent(this.workspace.organizationId),
          this.askService.saved(this.workspace.organizationId),
        ]);
      }
    }catch(error){this.error=this.message(error);}finally{this.loading=false;}
  }
  usePrompt(prompt:string):void{this.question=prompt;}
  useTarget(name:string):void{this.question=`What seems to be driving ${name}?`;}
  async submit():Promise<void>{
    const question=this.question.trim();
    if(!this.workspace||!question||this.asking)return;
    this.asking=true; this.error='';
    try{
      this.lastAskedQuestion=question;
      this.response=await this.askService.ask(this.workspace.organizationId,question);
      this.question='';
      this.recent=await this.askService.recent(this.workspace.organizationId);
    }catch(error){this.error=this.message(error);}finally{this.asking=false;}
  }
  async saveQuestion(question:string):Promise<void>{
    if(!this.workspace)return;
    try{await this.askService.save(this.workspace.organizationId,question);this.saved=await this.askService.saved(this.workspace.organizationId);}
    catch(error){this.error=this.message(error);}
  }
  async removeSaved(item:SavedQuestion):Promise<void>{
    if(!this.workspace)return;
    try{await this.askService.removeSaved(this.workspace.organizationId,item.id);this.saved=this.saved.filter(x=>x.id!==item.id);}
    catch(error){this.error=this.message(error);}
  }
  private message(error:unknown):string{
    if(error&&typeof error==='object'&&'message' in error)return String((error as {message?:unknown}).message||'Something went wrong.');
    return 'Something went wrong.';
  }
}
