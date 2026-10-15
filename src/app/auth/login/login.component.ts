import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { DEFAULT_RETURN_URL, safeReturnUrl } from '../../return-url';
import {
  Auth,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  sendPasswordResetEmail,
} from '@angular/fire/auth';

@Component({
  selector:'app-login',
  standalone:true,
  imports:[CommonModule,FormsModule,RouterModule],
  templateUrl:'./login.component.html',
  styleUrls:['./login.component.scss'],
})
export class LoginComponent {
  email='';
  password='';
  errorMessage:string|null=null;
  /** Shown after "Forgot password?"; the same wording whether or not the account exists. */
  resetMessage:string|null=null;
  resetting=false;

  private auth:Auth=inject(Auth);
  private router:Router=inject(Router);
  private route=inject(ActivatedRoute);

  /** Where to go after signing in: a validated in-app return path, else the app home. */
  private destination():string{
    return safeReturnUrl(this.route.snapshot.queryParamMap.get('returnUrl'))??DEFAULT_RETURN_URL;
  }

  async login(){
    try{
      await signInWithEmailAndPassword(this.auth,this.email,this.password);
      await this.router.navigateByUrl(this.destination());
    }catch(error:any){this.errorMessage=error.message;}
  }

  /**
   * Sends Firebase's password-reset email. The reply never says whether an account exists for the
   * address (email enumeration protection); only a malformed address gets its own message.
   */
  async forgotPassword(){
    this.errorMessage=null;
    const email=this.email.trim();
    if(!email){
      this.resetMessage='Enter your email address above, then choose “Forgot password?” again.';
      return;
    }
    this.resetting=true;
    try{
      await sendPasswordResetEmail(this.auth,email);
      this.resetMessage=`If an account exists for ${email}, we’ve sent a link to reset the password. Check your inbox and spam folder.`;
    }catch(error:any){
      this.resetMessage=error?.code==='auth/invalid-email'
        ? 'That doesn’t look like an email address. Check it and try again.'
        : `If an account exists for ${email}, we’ve sent a link to reset the password. Check your inbox and spam folder.`;
    }finally{
      this.resetting=false;
    }
  }

  async googleLogin(){
    try{
      await signInWithPopup(this.auth,new GoogleAuthProvider());
      await this.router.navigateByUrl(this.destination());
    }catch(error:any){this.errorMessage=error.message;}
  }
}
