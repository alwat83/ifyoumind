import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector:'app-public-landing',
  standalone:true,
  imports:[CommonModule,RouterLink],
  templateUrl:'./public-landing.component.html',
  styleUrls:['./public-landing.component.scss'],
})
export class PublicLandingComponent {}
