import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';

@Component({
  selector: 'app-configuration',
  standalone: true,
  templateUrl: './configuration.component.html',
  styleUrls: ['./configuration.component.css'],
  imports: [
    FormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatCheckboxModule,
    MatButtonModule,
    MatIconModule
  ]
})
export class ConfigurationComponent {
  idioma: string = '';
  zonaHoraria: string = '';
  nivelSeguridad: string = '';
  permitirNotificaciones: boolean = true;
  modoOscuro: boolean = false;

  idiomas: string[] = ['Español', 'Inglés', 'Francés'];
  zonasHorarias: string[] = ['UTC-5 (Lima)', 'UTC-3 (Buenos Aires)', 'UTC+1 (Madrid)'];
  nivelesSeguridad: string[] = ['Bajo', 'Medio', 'Alto'];

  guardarConfiguracion() {
    const configuracion = {
      idioma: this.idioma,
      zonaHoraria: this.zonaHoraria,
      nivelSeguridad: this.nivelSeguridad,
      notificaciones: this.permitirNotificaciones,
      modoOscuro: this.modoOscuro
    };

    console.log('Configuración guardada:', configuracion);
    alert('Configuración guardada exitosamente.');
  }
  constructor(private router: Router) {}

  goBack() {
    this.router.navigate(['/home']);
  }
}
