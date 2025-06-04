// src/app/camera.service.ts

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CameraService {
  private apiUrl = 'http://127.0.0.1:8000'; // Dirección de tu backend (ajusta si es necesario)

  constructor(private http: HttpClient) {}

  // Método para obtener el stream de la cámara
  getCameraStream(): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/video`, { responseType: 'blob' });
  }
}
