import { Component, OnDestroy, OnInit } from '@angular/core';
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
import { Subject, takeUntil, timer } from 'rxjs';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { AlertService } from '../../services/alert.service';
import { AlertCreate, AlertResponse } from '../../models/AlertModel';

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


  alerts!: AlertResponse[];

  constructor(
    private router: Router, 
    private http: HttpClient, 
    private sanitizer: DomSanitizer,
    private alertService: AlertService
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
    this.initializeCamera();
    this.loadAlerts();
  }

  ngOnDestroy() {
    this.stopCamera();
    this.destroy$.next();
    this.destroy$.complete();
    // Opcional: Llamar a API para apagar cámara si es necesario
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