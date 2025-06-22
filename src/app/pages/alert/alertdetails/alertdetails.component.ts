import { Component, ElementRef, Inject,OnInit, signal, ViewChild } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CommonModule, Location } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatDialogModule } from '@angular/material/dialog';
import { MatDialog } from '@angular/material/dialog';
import { FormsModule } from '@angular/forms';
import { AlertService } from '../../../services/alert.service';
import { AlertCreate, AlertResponse } from '../../../models/AlertModel';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { VgApiService, VgCoreModule } from '@videogular/ngx-videogular/core';
import { VgControlsModule } from '@videogular/ngx-videogular/controls';
import { VgOverlayPlayModule } from '@videogular/ngx-videogular/overlay-play';




@Component({
  selector: 'app-alertdetails',
  standalone:true,
  imports: [
    CommonModule,
    RouterModule,
    MatDialogModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    
  ],
  templateUrl: './alertdetails.component.html',
  styleUrls: ['./alertdetails.component.css']
})
export class AlertDetailsComponent implements OnInit {
  alertId: string | null = null;
  comentario: string = '';
  alertdetails:any

  videoUrl = "../../../../videos_alert/hoy16/alert_camera2_2025-06-16_13-51-45.mp4";

  alert!: AlertResponse;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private alertService: AlertService,
    private location: Location
  ) {
    const nav = this.location.getState() as any;
    this.alertdetails = nav.alertdetails;
    this.videoUrl = "../../../../videos_alert/hoy16/alert_camera1_2025-06-16_11-42-15.mp4";
  }


  ngOnInit(): void {
    this.alertId = this.route.snapshot.paramMap.get('id');

    this.alertService.getOneAlert(this.alertId!).subscribe({
      next: (data) => {
        this.alert = data;
      }
    })
  }


  guardar() {
    const alertaActualizada = {
      id: this.alertId,
      title: '',     // FastAPI no usa este campo para actualizar
      fecha: '',     // Igual
      comentario: this.comentario,
      
    };
    this.alertService.saveAlert(alertaActualizada).subscribe(() => {
      this.router.navigate(['/alert']);
    });
  }

  /////////////////////

  confirmar() {
      alert('Alerta confirmada');
    }
  
    descartar() {
      alert('Alerta descartada');
    }
  
    volver() {
      window.history.back();
    }
}
