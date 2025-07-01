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
import { HttpClient } from '@angular/common/http';
import { DomSanitizer } from '@angular/platform-browser';




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
  videoLoading = false;
  videoError = false;
  videoUrl = '';

  videoExists = false;

  timestamp = Date.now();
  @ViewChild('videoPlayer') videoPlayerRef!: ElementRef<HTMLVideoElement>;
  showVideo = true;


  alert!: AlertResponse;

  constructor(
    private route: ActivatedRoute,
    // private router: Router,
    private alertService: AlertService,
    private location: Location,
    // private http: HttpClient,
    private sanitizer: DomSanitizer

  ) {
    const nav = this.location.getState() as any;
    this.alertdetails = nav.alertdetails;
    // this.videoUrl = "../../../../videos_alert/hoy16/alert_camera1_2025-06-16_11-42-15.mp4";
  }


  ngOnInit(): void {
    this.alertId = this.route.snapshot.paramMap.get('id');

    this.alertService.getOneAlert(this.alertId!).subscribe({
      next: (alert) => {
        this.alert = alert;
        this.alert.video = this.extractVideoName(alert.video)
        this.checkAndLoadVideo();
        //this.videoUrl = "/" + this.alert.video;
        //this.alert.video = `http://127.0.0.1:8000/get_video/${this.extractVideoName(alert.video)}`;

        //this.reloadVideo(`http://127.0.0.1:8000/get_video/${this.extractVideoName(alert.video)}`);
      },
      error: (err) => console.error('Error loading alert:', err)
    });
  }

  private checkAndLoadVideo() {
    const videoName = this.alert.video;
    //const localVideoPath = this.alert.video; //`assets/videos/${videoName}`;
    
    this.videoLoading = true;
    this.videoError = false;

    // 1. Primero verificar si existe localmente
    this.alertService.checkVideoExists2(videoName).subscribe({
      next: (response) => {
        // const exists = response.exists;  // Accede a la propiedad "exists"
        // alert("¿Existe el video? " + exists + ", Tipo: " + typeof exists);
        this.videoExists = response.exists;
        if (this.videoExists) {
          // 1. Video local existe
          this.videoUrl = videoName;
          this.loadVideo();
        } else if (this.alert.video_backup) {
          // 2. Si no existe localmente pero tiene backup en la nube
          this.downloadAndLoadCloudVideo(videoName);
        } else {
          // 3. No hay video disponible
          alert("erorr");
          this.handleVideoError();
        }
      },
      error: (e) => console.error("error al verificar existencia de video: " + e)
    });
    
    // this.alertService.checkVideoExists(videoName).subscribe({
    //   next: (exists) => {
    //     alert("existe?: "+ exists)
    //     if (exists) {
    //       // 1. Video local existe
    //       this.videoUrl = videoName;
    //       this.loadVideo();
    //     } else if (this.alert.video_backup) {
    //       // 2. Si no existe localmente pero tiene backup en la nube
    //       this.downloadAndLoadCloudVideo(videoName);
    //     } else {
    //       // 3. No hay video disponible
    //       alert("erorr");
    //       this.handleVideoError();
    //     }
    //   },
    //   error: () => this.handleVideoError()
    // });
  }

  private downloadAndLoadCloudVideo(videoName: string): void {
    this.alertService.downloadVideoFromCloud(this.alertId!, videoName).subscribe({
      next: () => {
        // Video descargado, intentar cargar de nuevo
        this.alert.video = videoName//`assets/videos/${videoName}`;
        this.loadVideo();
      },
      error: () => this.handleVideoError()
    });
  }

  private loadVideo(): void {
    const videoElement = this.videoPlayerRef.nativeElement;
    
    // Limpiar fuente anterior
    videoElement.src = '';
    
    // Asignar nueva fuente con timestamp para evitar cache
    //http://127.0.0.1:8000/get_video/video-name
    //this.videoUrl = `http://127.0.0.1:8000/get_video/${this.videoUrl}?t=${Date.now()}`;
    //this.alert.video = `http://127.0.0.1:8000/get_video/${this.extractVideoName(this.alert.video)}`;
    videoElement.src = `http://127.0.0.1:8000/get_video/${this.alert.video}`; //this.alert.video;//this.videoUrl;
    
    videoElement.load();
    this.videoLoading = false;
    
    videoElement.onerror = () => this.handleVideoError();
  }

  private handleVideoError(): void {
    this.videoLoading = false;
    this.videoError = true;
    console.error('Error loading video');
  }

  // Extrae el nombre del video de la ruta (ej: "assets/videos/video1.mp4" → "video1.mp4")
  private extractVideoName(fullPath: string): string {
    return fullPath.split('/').pop() || '';
  }

  reloadVideo(videoPath: string) {
    const videoElement = this.videoPlayerRef.nativeElement;
    videoElement.src = videoPath + '?t=' + Date.now();  // Evita el cache
    videoElement.load();  // Recarga el video
  }




  guardar() {
    const alertaActualizada = {
      id: this.alertId,
      title: '',     // FastAPI no usa este campo para actualizar
      fecha: '',     // Igual
      comentario: this.comentario,
      
    };
    // this.alertService.saveAlert(alertaActualizada).subscribe(() => {
    //   this.router.navigate(['/alert']);
    // });
  }

  /////////////////////

  cambiar_estado(estado: string) {
    this.alert.status = estado
    this.alertService.updateAlert(this.alert.id, this.alert).subscribe({
      next: (data) => alert('Estado de alerta modificado a ' + data.status),
      error: (e) => alert('Error: ' + e)
    })
  }

  
  
  
  volver() {
    window.history.back();
  }
}
