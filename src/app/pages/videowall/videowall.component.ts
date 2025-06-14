import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CameraService } from '../../../camera.service'; // apartir desde la carpeta css

import { CommonModule } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';
import { MatSidenavModule } from '@angular/material/sidenav';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Subject, Subscription, takeUntil, timer } from 'rxjs';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { AlertService } from '../../services/alert.service';
import { AlertCreate, AlertResponse } from '../../models/AlertModel';
import { WebSocketService } from '../../services/web-socket.service';

@Component({
  selector: 'app-videowall',
  standalone: true,
  templateUrl: './videowall.component.html',
  styleUrls: ['./videowall.component.css'],
  imports: [
    CommonModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatListModule,
    MatSidenavModule,
    RouterLink
  ]
})
export class VideowallComponent implements OnInit, OnDestroy {
  isRecording = false;
  url = 'http://127.0.0.1:8000';

  private destroy$ = new Subject<void>();
  safeVideoUrl!: SafeUrl | undefined;
  isStreamActive = false;

  private streamUrl = 'http://127.0.0.1:8000/video';
  private cacheBuster = 0;
  
  //nuevo
  @Input() cameraId!: string;
  imageSrc: string = '';
  errorMessage: string = '';
  private subscription!: Subscription;
  // Configuración de cámaras
  cameras = [
    { id: 'camera1', name: 'Cámara 1', imageSrc: '', error: '', loading: true, ws: null as WebSocket | null },
    { id: 'camera2', name: 'Cámara 2', imageSrc: '', error: '', loading: true, ws: null as WebSocket | null }
  ];
  alerts!: AlertResponse[];

  constructor(
    private router: Router, 
    private http: HttpClient, 
    private sanitizer: DomSanitizer,
    private alertService: AlertService,
    private webSocketService: WebSocketService
  ) {
    /*console.log("contructor ejecutado");
    this.http.post(`${this.url}/camera/status`, {}).subscribe({
      next: (data) => {
        console.log("DATAAAA", data);
      },
      error: (e) => console.log("error constructor", e)
    });
    this.startStream();
    console.log("strarted: ", this.safeVideoUrl)*/
  }

  ngOnInit(): void {
    //this.initializeCamera();
    this.connectToAllCameras();
    this.loadAlerts();
  }

 ////empieza nuevo
 connectToAllCameras(): void {
    this.cameras.forEach(camera => {
      this.connectToCamera(camera);
    });
  }

  connectToCamera(camera: any): void {
    const wsUrl = `ws://localhost:8000/ws/${camera.id}`;
    camera.ws = new WebSocket(wsUrl);

    camera.ws.onopen = () => {
      camera.loading = false;
      camera.error = '';
    };

    camera.ws.onmessage = (event: MessageEvent) => {
      this.createImageFromBlob(event.data, camera);
    };

    camera.ws.onerror = (error: any) => {
      console.error(`Error en ${camera.name}:`, error);
      camera.error = `Error en ${camera.name}`;
      camera.loading = false;
    };

    camera.ws.onclose = () => {
      camera.error = `${camera.name} desconectada`;
      camera.loading = false;
    };
  }

  private createImageFromBlob(data: Blob | ArrayBuffer, camera: any): void {
    let blob: Blob;
    
    if (data instanceof Blob) {
      blob = data;
    } else {
      blob = new Blob([data], { type: 'image/jpeg' });
    }

    const reader = new FileReader();
    reader.onload = (e: any) => {
      camera.imageSrc = e.target.result;
      camera.error = '';
      camera.loading = false;
    };
    reader.readAsDataURL(blob);
  }

 ////termina nuevo

  ngOnDestroy() {
    this.stopCamera();
    this.destroy$.next();
    this.destroy$.complete();
    // Opcional: Llamar a API para apagar cámara si es necesario

    //nuevo
    // Cerrar todas las conexiones WebSocket
    this.cameras.forEach(camera => {
      if (camera.ws) {
        camera.ws.close();
      }
    });

  }

  loadAlerts() {
    this.alertService.getAlerts({}).subscribe({
      next: (data) => this.alerts = data,
      error: (e) => console.log("Error loading alerts: ", e)
    });
  }

  generateAlert() {
    const new_alert: AlertCreate = {
        "status": "confirmed",
        "device": {
          "id": "681ab9a3b83466fc52a7ed9a",
        },
        "video": {
          "id": "681ba110a20a2a1c5111addd",
        }
      }
    this.alertService.createAlert(new_alert).subscribe();
  }


  private initializeCamera() {
    // Forzar nuevo stream con parámetro aleatorio
    this.cacheBuster = Date.now();
    const uniqueStreamUrl = `${this.streamUrl}?cb=${this.cacheBuster}`;
    
    this.safeVideoUrl = this.sanitizer.bypassSecurityTrustUrl(uniqueStreamUrl);
    this.isStreamActive = true;
  }



  stopCamera() {
    this.http.post(`${this.url}/camera/stop`, {})
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          console.log('Cámara detenida correctamente');
          this.isStreamActive = false;
          // Limpiar URL para evitar frames congelados
          this.safeVideoUrl = undefined;
        },
        error: (err) => {
          console.error('Error al detener cámara:', err);
          this.isStreamActive = false;
        }
      });
  }


  checkCameraStatus() {
    this.http.get('http://127.0.0.1:8000/camera/status')
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (status) => this.isStreamActive = true,
        error: () => this.isStreamActive = false
      });
  }

  /*retryStream(attempts = 3, delay = 2000) {
    let attemptsLeft = attempts;
    const tryConnect = () => {
      this.http.get('http://127.0.0.1:8000/camera/status')
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => this.initializeCamera(),
          error: () => {
            if (attemptsLeft-- > 0) {
              setTimeout(tryConnect, delay);
            }
          }
        });
    };

    tryConnect();
  }*/

  handleStreamError() {
    console.log('Error en el stream, reintentando...');
    this.isStreamActive = false;
    
    // Reintentar después de 1 segundo
    timer(1000).pipe(
      takeUntil(this.destroy$)
    ).subscribe(() => this.initializeCamera());
  }



  //////////////// GRABAR /////////////////////////////////////////////////////////////////////////////
  startRecording(): void {
    this.http.post(`${this.url}/start_recording`, {}).subscribe({
      next: () => this.handleRecordingResponse(true, 'Grabación iniciada desde el backend'),
      error: (err: HttpErrorResponse) => this.handleError(err, 'Error al iniciar grabación')
    });
  }

  stopRecording(): void {
    this.http.post(`${this.url}/stop_recording`, {}, { responseType: 'blob' }).subscribe({
      next: (blob) => {
        this.downloadBlob(blob, 'grabacion.mp4');
        this.handleRecordingResponse(false, 'Grabación detenida y descargada');
      },
      error: (err: HttpErrorResponse) => this.handleError(err, 'Error al detener grabación')
    });
  }

  goHome(): void {
    this.router.navigate(['/c/home']);
  }

  private handleRecordingResponse(isRecording: boolean, message: string): void {
    this.isRecording = isRecording;
    console.log(message);
  }

  private handleError(error: HttpErrorResponse, context: string): void {
    this.isRecording = false;
    console.error(`${context}:`, error.message || error);
  }

  private downloadBlob(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  }
}