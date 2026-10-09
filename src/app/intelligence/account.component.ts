import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Auth, sendPasswordResetEmail, signOut, updateProfile } from '@angular/fire/auth';
import { OrganizationService } from './organization.service';
import { CommercialStatus, MonetizationService } from './monetization.service';

@Component({
  selector:'app-account',
  standalone:true,
  imports:[CommonModule,FormsModule,RouterLink],
  templateUrl:'./account.component.html',
  styleUrls:['./account.component.scss'],
})
export class AccountComponent implements OnInit {
  private readonly auth=inject(Auth);
  private readonly organizations=inject(OrganizationService);
  private readonly monetization=inject(MonetizationService);
  private readonly router=inject(Router);

  name='';
  email='';
  provider='';
  status:CommercialStatus|null=null;
  loading=true;
  saving=false;
  message='';
  error='';

  async ngOnInit():Promise<void>{
    try{
      const user=this.auth.currentUser;
      if(!user) throw new Error('Account not found.');
      this.name=user.displayName||'';
      this.email=user.email||'';
      this.provider=user.providerData[0]?.providerId==='google.com'?'Google':'Email and password';
      const workspace=await this.organizations.getMyWorkspace();
      if(workspace) this.status=await this.monetization.status(workspace.organizationId);
    }catch(error){this.error=this.messageFor(error);}
    finally{this.loading=false;}
  }

  async saveProfile():Promise<void>{
    const user=this.auth.currentUser;
    if(!user||this.saving)return;
    this.saving=true; this.message=''; this.error='';
    try{
      await updateProfile(user,{displayName:this.name.trim()||null});
      this.message='Profile updated.';
    }catch(error){this.error=this.messageFor(error);}
    finally{this.saving=false;}
  }

  async resetPassword():Promise<void>{
    if(!this.email)return;
    this.message=''; this.error='';
    try{
      await sendPasswordResetEmail(this.auth,this.email);
      this.message='Password reset email sent.';
    }catch(error){this.error=this.messageFor(error);}
  }

  async manageBilling():Promise<void>{
    if(!this.status||this.status.plan!=='pro')return;
    this.message=''; this.error='';
    try{
      const workspace=await this.organizations.getMyWorkspace();
      if(!workspace) throw new Error('Workspace not found.');
      const url=await this.monetization.billingPortal(workspace.organizationId);
      if(!url) throw new Error('Billing portal did not return a URL.');
      window.location.assign(url);
    }catch(error){this.error=this.messageFor(error);}
  }

  async logout():Promise<void>{
    await signOut(this.auth);
    await this.router.navigate(['/']);
  }

  private messageFor(error:unknown):string{
    if(error&&typeof error==='object'&&'message' in error){
      return String((error as {message?:unknown}).message||'Something went wrong.');
    }
    return 'Something went wrong.';
  }
}
