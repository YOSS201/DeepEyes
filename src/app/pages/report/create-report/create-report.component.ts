import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';

@Component({
  selector: 'app-create-report',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './create-report.component.html',
  styleUrls: ['./create-report.component.css']
})
export class CreateReportComponent {
  constructor(private router: Router) {}
  alertasDisponibles = ['Alerta 1', 'Alerta 2', 'Alerta 3'];
  alertaSeleccionada = '';
  accionRealizada = '';
  comentarios = '';

  guardarReporte() {
    console.log('Alerta:', this.alertaSeleccionada);
    console.log('Acción:', this.accionRealizada);
    console.log('Comentarios:', this.comentarios);
    alert('Reporte guardado exitosamente');
  }
  goToReportTable(): void {
    this.router.navigate(['/report']); // Reemplaza con tu ruta exacta
  }
}

