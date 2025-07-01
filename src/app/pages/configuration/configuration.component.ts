import { ConfigsService } from './../../services/configs.service';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import {MatSliderModule} from '@angular/material/slider';
import { ConfigCreate } from '../../models/ConfigModel';

interface Rutas {
  valor: string;
  valorVisto: string;
}


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
    MatIconModule,
    MatSliderModule
  ]
})
export class ConfigurationComponent implements OnInit {
  idioma: string = '';
  zonaHoraria: string = '';
  modoOscuro: boolean = false;
  
  user_id = "";
  nivelSeguridad: string = '';
  permitirNotificaciones: boolean = false;
  auto: boolean = false;
  volume = 0.5;
  deteccion = 0.5;
  
  sonidoRuta: string = "-";
  audio = new Audio('/assets/sounds/alert_sound.mp3');
  audio_rutas = [
    '/assets/sounds/alert.mp3',
    '/assets/sounds/alert_snake.mp3', 
    '/assets/sounds/alert1.mp3', 
    '/assets/sounds/boom_vine.mp3',
    '/assets/sounds/notification.mp3',
  ];

  // idiomas: string[] = ['Español', 'Inglés', 'Francés'];
  // zonasHorarias: string[] = ['UTC-5 (Lima)', 'UTC-3 (Buenos Aires)', 'UTC+1 (Madrid)'];
  nivelesSeguridad: string[] = ['Bajo', 'Medio', 'Alto'];

  constructor(private router: Router, private configsService: ConfigsService) {}

  ngOnInit() {

    this.configsService.getConfigs().subscribe({
      next: (data) => {
        this.sonidoRuta = data[0].sonido;
        this.permitirNotificaciones = data[0].notif;
        this.auto = data[0].auto;
        this.user_id = data[0].user_id;
        this.volume = data[0].volumen;
        this.deteccion = data[0].deteccion;
        this.audio = new Audio(data[0].sonido);
      },
      error: (e) => alert("Error al cargar config: " + e)
    })

    // const guardado = localStorage.getItem('configuracion');
    // if (guardado) {
    //   const config = JSON.parse(guardado);
    //   this.idioma = config.idioma || '';
    //   this.zonaHoraria = config.zonaHoraria || '';
    //   this.nivelSeguridad = config.nivelSeguridad || '';
    //   this.permitirNotificaciones = config.notificaciones ?? true;
    //   this.modoOscuro = config.modoOscuro ?? false;

    //   // Aplica el modo oscuro si está activado
    //   if (this.modoOscuro) {
    //     document.body.classList.add('dark-mode');
    //   } else {
    //     document.body.classList.remove('dark-mode');
    //   }
    // }
  }

  guardarConfiguracion() {
    // const configuracion = {
    //   idioma: this.idioma,
    //   zonaHoraria: this.zonaHoraria,
    //   nivelSeguridad: this.nivelSeguridad,
    //   notificaciones: this.permitirNotificaciones,
    //   modoOscuro: this.modoOscuro
    // };

    // localStorage.setItem('configuracion', JSON.stringify(configuracion));

    // if (this.modoOscuro) {
    //   document.body.classList.add('dark-mode');
    // } else {
    //   document.body.classList.remove('dark-mode');
    // }

    const nuevaConfiguracion: ConfigCreate = {
      "auto": this.auto,
      "notif": this.permitirNotificaciones,
      "sonido": this.sonidoRuta,
      "user_id": this.user_id,
      "volumen": this.volume,
      "deteccion": this.deteccion
    }

    this.configsService.updateConfig("685e9a03bf4ad310a1658d99", nuevaConfiguracion).subscribe({
      next: () =>
        alert(`✅ Configuración guardada.\nIdioma: ${this.idioma}`),
      error: (e) => alert("Error al guardar config "+ e)
    });

  }

  goBack() {
    this.router.navigate(['/home']);
  }

  playSound() {
    // this.audio.pause();
    // this.audio.currentTime = 0;
    this.audio = new Audio(this.sonidoRuta);
    this.audio.play().catch(e => console.error('Error playing sound:', e));
  }

  updateVolume() {
    this.audio.volume = this.volume;
  }

}

