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
        await sendEmailVerification(credential.user);
        await this.router.navigate(['/verify-email']);
        return;
      }
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
