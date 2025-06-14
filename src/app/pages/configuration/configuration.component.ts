import { Component, OnInit } from '@angular/core';
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
export class ConfigurationComponent implements OnInit {
  idioma: string = '';
  zonaHoraria: string = '';
  nivelSeguridad: string = '';
  permitirNotificaciones: boolean = true;
  modoOscuro: boolean = false;

  idiomas: string[] = ['Español', 'Inglés', 'Francés'];
  zonasHorarias: string[] = ['UTC-5 (Lima)', 'UTC-3 (Buenos Aires)', 'UTC+1 (Madrid)'];
  nivelesSeguridad: string[] = ['Bajo', 'Medio', 'Alto'];

  constructor(private router: Router) {}

  ngOnInit() {
  const guardado = localStorage.getItem('configuracion');
  if (guardado) {
    const config = JSON.parse(guardado);
    this.idioma = config.idioma || '';
    this.zonaHoraria = config.zonaHoraria || '';
    this.nivelSeguridad = config.nivelSeguridad || '';
    this.permitirNotificaciones = config.notificaciones ?? true;
    this.modoOscuro = config.modoOscuro ?? false;

    // Aplica el modo oscuro si está activado
    if (this.modoOscuro) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  }
}

guardarConfiguracion() {
  const configuracion = {
    idioma: this.idioma,
    zonaHoraria: this.zonaHoraria,
    nivelSeguridad: this.nivelSeguridad,
    notificaciones: this.permitirNotificaciones,
    modoOscuro: this.modoOscuro
  };

  localStorage.setItem('configuracion', JSON.stringify(configuracion));

  if (this.modoOscuro) {
    document.body.classList.add('dark-mode');
  } else {
    document.body.classList.remove('dark-mode');
  }

  alert(`✅ Configuración guardada.\nIdioma: ${this.idioma}`);
}

  goBack() {
    this.router.navigate(['/home']);
  }
}

