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

  async googleLogin(){
    try{
      await signInWithPopup(this.auth,new GoogleAuthProvider());
      await this.router.navigateByUrl(this.destination());
    }catch(error:any){this.errorMessage=error.message;}
  }
}
