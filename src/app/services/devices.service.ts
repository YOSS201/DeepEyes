import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { catchError, Observable, throwError } from 'rxjs';
import { DeviceResponse, DeviceCreate } from '../models/DeviceModel';

@Injectable({
  providedIn: 'root'
})
export class DeviceService {
  
  private apiUrl = 'http://127.0.0.1:8000/devices/'; // Asegúrate de que termina en /

  constructor(private http: HttpClient) {}
  
  createDevice(device: DeviceCreate): Observable<DeviceResponse> {
    return this.http.post<DeviceResponse>("http://127.0.0.1:8000/devices/", device, { headers: { 'Content-Type': 'application/json' } });
  }
  
  getDevices(name?: string, position?: string, location?: string, type?: string): Observable<DeviceResponse[]> {
    let params: any = {};
    if (name) params.name = name;
    if (position) params.position = position;
    if (location) params.location = location;
    if (type) params.type = type;

    return this.http.get<DeviceResponse[]>(this.apiUrl, { params });
  }

  getOneDevice(id: string): Observable<DeviceResponse> {
    return this.http.get<DeviceResponse>(`${this.apiUrl}${id}`);
  }
  

  updateDevice(id: string, device: DeviceCreate): Observable<DeviceResponse> {
    console.log('Sending PUT to:', `${this.apiUrl}${id}`);
    console.log('id:::::', id)
    console.log('Request body:', device);
    return this.http.patch<DeviceResponse>(`${this.apiUrl}${id}`, device, { headers: { 'Content-Type': 'application/json' } });
  }

  deleteDevice(id: string): Observable<void> {
    console.log('Sending DELETE to:', `${this.apiUrl}${id}`);
    return this.http.delete<void>(`${this.apiUrl}${id}`);
  }


  /*private handleError(error: HttpErrorResponse): Observable<never> {
    console.error('HTTP Error:', error);
    let errorMessage = 'An unknown error occurred';
    if (error.error instanceof ErrorEvent) {
      errorMessage = `Client-side error: ${error.error.message}`;
    } else {
      errorMessage = `Server-side error: ${error.status} - ${error.message}`;
      if (error.error?.detail) {
        errorMessage += ` (Detail: ${error.error.detail})`;
      }
    }
    return throwError(() => new Error(errorMessage));
  }*/
}