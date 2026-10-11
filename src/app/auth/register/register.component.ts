import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
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

  private auth:Auth=inject(Auth);
  private router:Router=inject(Router);

  async register(){
    try{
      const credential=await createUserWithEmailAndPassword(this.auth,this.email,this.password);
      await updateProfile(credential.user,{displayName:this.displayName.trim()});
      if(!useLocalEmulators){
        await this.sendVerification(credential.user);
        await this.router.navigate(['/verify-email']);
        return;
      }
      await this.router.navigate(FIRST_DECISION_ROUTE,{queryParams:FIRST_DECISION_QUERY});
    }catch(error:any){this.errorMessage=error.message;}
  }

  /** The verification email's "Continue" link returns to the market-analysis flow when allowed. */
  private async sendVerification(user:Parameters<typeof sendEmailVerification>[0]):Promise<void>{
    try{
      await sendEmailVerification(user,{url:`${window.location.origin}/app/decide?type=business`});
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
      if(isNew) await this.router.navigate(FIRST_DECISION_ROUTE,{queryParams:FIRST_DECISION_QUERY});
      else await this.router.navigate(['/app']);
    }catch(error:any){this.errorMessage=error.message;}
  }
}
