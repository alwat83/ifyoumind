import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { PurchaseIntent, intentParams, parseIntent, readIntent, rememberIntent } from '../../purchase-intent';
import {
  Auth,
  createUserWithEmailAndPassword,
  updateProfile,
  sendEmailVerification,
  signInWithPopup,
  GoogleAuthProvider,
} from '@angular/fire/auth';
import { useLocalEmulators } from '../../firebase.config';

/** New accounts go straight to the market-analysis flow: they have no decisions to look at yet. */
export const FIRST_DECISION_ROUTE=['/app/decide'];
export const FIRST_DECISION_QUERY={type:'business'};

@Component({
  selector:'app-register',
  standalone:true,
  imports:[CommonModule,FormsModule,RouterModule],
  templateUrl:'./register.component.html',
  styleUrls:['./register.component.scss'],
})
export class RegisterComponent {
  displayName='';
  email='';
  password='';
  errorMessage:string|null=null;
  /** Field errors appear only after the first submit, so the form doesn't scold people while they type. */
  showErrors=false;
  submitting=false;

  private auth:Auth=inject(Auth);
  private router:Router=inject(Router);
  private route=inject(ActivatedRoute);
  /** Visitor arrived from the sample's "$79" button; their free brief comes first, then the offer. */
  readonly intent:PurchaseIntent|null=parseIntent(this.route.snapshot.queryParamMap.get('intent'))??readIntent();

  constructor(){rememberIntent(this.intent);}

  /** The button is always active: an incomplete form shows what to fix instead of looking broken. */
  async submit(form:NgForm):Promise<void>{
    if(form.invalid){
      this.showErrors=true;
      (document.querySelector('.auth-card input[aria-invalid="true"], .auth-card input.ng-invalid') as HTMLInputElement|null)?.focus();
      return;
    }
    this.submitting=true;
    try{await this.register();}
    finally{this.submitting=false;}
  }

  async register(){
    try{
      const credential=await createUserWithEmailAndPassword(this.auth,this.email,this.password);
      await updateProfile(credential.user,{displayName:this.displayName.trim()});
      if(!useLocalEmulators){
        await this.sendVerification(credential.user);
        await this.router.navigate(['/verify-email']);
        return;
      }
      await this.router.navigate(FIRST_DECISION_ROUTE,{queryParams:intentParams(FIRST_DECISION_QUERY,this.intent)});
    }catch(error:any){this.errorMessage=error.message;}
  }

  /** The verification email's "Continue" link returns to the market-analysis flow when allowed. */
  private async sendVerification(user:Parameters<typeof sendEmailVerification>[0]):Promise<void>{
    try{
      await sendEmailVerification(user,{url:`${window.location.origin}/app/decide?type=business${this.intent?`&intent=${this.intent}`:''}`});
    }catch(error:any){
      if(String(error?.code||'').includes('continue-uri')) await sendEmailVerification(user);
      else throw error;
    }
  }

  async googleLogin(){
    try{
      const result=await signInWithPopup(this.auth,new GoogleAuthProvider());
      // Returning Google users go to their decisions; brand-new ones start the market analysis.
      const isNew=result.user.metadata.creationTime===result.user.metadata.lastSignInTime;
      if(isNew) await this.router.navigate(FIRST_DECISION_ROUTE,{queryParams:intentParams(FIRST_DECISION_QUERY,this.intent)});
      else await this.router.navigate(['/app']);
    }catch(error:any){this.errorMessage=error.message;}
  }
}
