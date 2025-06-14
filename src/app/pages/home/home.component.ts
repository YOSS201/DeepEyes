import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatDividerModule,
    MatButtonModule
  ],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent {
  totalAlertas = 10;
  alertasHoy = 2;
  alertas = {
    pendientes: 1,
    confirmados: 7,
    descartados: 1,
    hoy: {
      pendientes: 1,
      confirmados: 1,
      descartados: 0
    }
  };

  camaras = [
    'assets/camara1.jpg',
    'assets/camara2.jpg',
    'assets/camara3.jpg'
  ];

  camarasActivas = 3;
  camarasInactivas = 1;

  totalReportes = 3;
  generarAutomatico = true;
}


