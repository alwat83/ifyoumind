import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
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

  async login(){
    try{
      await signInWithEmailAndPassword(this.auth,this.email,this.password);
      await this.router.navigate(['/app/market']);
    }catch(error:any){this.errorMessage=error.message;}
  }

  async googleLogin(){
    try{
      await signInWithPopup(this.auth,new GoogleAuthProvider());
      await this.router.navigate(['/app/market']);
    }catch(error:any){this.errorMessage=error.message;}
  }
}
