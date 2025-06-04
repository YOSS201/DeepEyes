import { AuthService } from './../../auth.service';
import { Component } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatCard } from '@angular/material/card';
//import { MatToolbar } from '@angular/material/toolbar';
import { CommonModule } from '@angular/common';
import { MatSidenavModule } from '@angular/material/sidenav';
import { Router } from '@angular/router';
import { RouterModule } from '@angular/router';
import { MatDividerModule } from '@angular/material/divider'; 
import { MatToolbarModule } from '@angular/material/toolbar';

@Component({
  selector: 'app-home',
  standalone:true,
  imports: [
    //MatCard,
  ],
  //MatCard
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent {

  constructor() {}
  
}

