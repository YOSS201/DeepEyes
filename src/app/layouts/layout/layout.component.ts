import { UserService } from './../../services/user.service';
import { ConfigsService } from './../../services/configs.service';
import { Component, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../auth.service';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { CommonModule } from '@angular/common';
import { MatSidenavModule } from '@angular/material/sidenav';

@Component({
  selector: 'app-layout',
  imports: [
    MatDividerModule,
    RouterModule,
    MatIconModule, 
    MatToolbarModule,
    CommonModule, 
    MatSidenavModule
  ],
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.css'
})
export class LayoutComponent implements OnInit {

  nombre = "";
  constructor(private router: Router, private authService: AuthService, private configsService: ConfigsService, private userService: UserService) {
  }
  
  ngOnInit(): void {
    this.configsService.getConfigs().subscribe({
      next: (data) => this.userService.getOneUserId(data[0].user_id).subscribe({
        next: (user) => this.nombre = user.name
      })
    })
  }

  /*logout2() {
    localStorage.removeItem('token');
    sessionStorage.clear();
    this.router.navigate(['/login']);
  }*/

  logout() {
    this.authService.logout();
  }
  
}
