import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { catchError, filter, firstValueFrom, interval, map, Observable, of, share, Subject, switchMap, takeUntil, tap } from 'rxjs';
import { AlertCreate, AlertResponse } from '../models/AlertModel';

@Injectable({ providedIn: 'root' })
export class AlertService {
  private apiUrl = 'http://127.0.0.1:8000/alerts/'; // Asegúrate de que termina en /

  constructor(private http: HttpClient) {}

  private lastAlertId: string | null = null; // Guarda el ID de la última alerta
  private stopPolling$ = new Subject<void>();


  /*getData() {
    return this.http.get<any[]>('http://127.0.0.1:8000/alerts');
  }
*/
  // saveAlert(alert: any): Observable<any> {
  //   return this.http.post(`${this.apiUrl}/save-alert`, alert);
  // }
////////////////


  /*getAlerts(name?: string, location?: string, type?: string): Observable<AlertResponse[]> {
    let params: any = {};
    if (name) params.name = name;
    if (location) params.location = location;
    if (type) params.type = type;

    return this.http.get<AlertResponse[]>(this.apiUrl, { params });
  }  */

  getAlerts(
    filters: {
      status?: string;
      startDate?: Date;
      endDate?: Date;
      alertId?: string;
      deviceName?: string;
      skip?: number;
      limit?: number;
    }
  ): Observable<AlertResponse[]> {
    let params = new HttpParams()
      .set('skip', filters.skip?.toString() || '0')
      .set('limit', filters.limit?.toString() || '100');

    if (filters.status) params = params.set('status', filters.status);
    if (filters.startDate) params = params.set('start_date', filters.startDate.toISOString());
    if (filters.endDate) params = params.set('end_date', filters.endDate.toISOString());
    if (filters.alertId) params = params.set('alert_id', filters.alertId);
    if (filters.deviceName) params = params.set('device_name', filters.deviceName);

    return this.http.get<AlertResponse[]>(this.apiUrl, { params });
  }


  getOneAlert(id: string): Observable<AlertResponse> {
    return this.http.get<AlertResponse>(`${this.apiUrl}${id}`);
  }

  createAlert(alert: AlertCreate): Observable<AlertCreate> {
    return this.http.post<AlertCreate>(this.apiUrl, alert, { headers: { 'Content-Type': 'application/json' } });
  }
  
  updateAlert(id: string, alert: AlertCreate): Observable<AlertResponse> {
      return this.http.patch<AlertResponse>(`${this.apiUrl}${id}`, alert, { headers: { 'Content-Type': 'application/json' } });
    }

  deleteAlert(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}${id}`);
  }

  getAlertsStream(): Observable<AlertResponse> {
    return interval(5000).pipe(
      switchMap(() => this.getAlerts({})),
      map(alerts => alerts[0]),
      filter(newAlert => newAlert.id !== this.lastAlertId),
      tap(newAlert => this.lastAlertId = newAlert?.id),
      share(), // Comparte el mismo Observable entre múltiples suscriptores
      takeUntil(this.stopPolling$) // Detiene el intervalo cuando se emite stopPolling$
    );
  }

  stopPolling(): void {
    this.stopPolling$.next();
  }

  // // Nuevo método para verificar existencia local
  // checkVideoExists(videoPath: string): Observable<boolean> {
  //   return this.http.head(videoPath, { observe: 'response' }).pipe(
  //     map(response => response.status === 200),
  //     catchError(() => of(false))
  //   );
  // }

  // Verifica si un video existe en la API
  async checkVideoExists(videoName: string): Promise<boolean> {
    try {
      const response = await firstValueFrom(
        this.http.get<{exists: boolean}>(videoName)
      );
      return response.exists;
    } catch (error) {
      return false;
    }
  }

  checkVideoExists2(videoName: string): Observable<{ exists: boolean }> {
    return this.http.get<{ exists: boolean }>("http://127.0.0.1:8000/video_exists/" + videoName);
  }


  // Nuevo método para descargar desde la nube
  downloadVideoFromCloud(alertId: string, videoName: string): Observable<any> {
    return this.http.get(`${this.apiUrl}${alertId}/download_video`, {
      responseType: 'blob'
    }).pipe(
      tap(blob => {
        // Guardar el video localmente
        this.saveVideoLocally(videoName, blob);
      })
    );
  }

  private saveVideoLocally(filename: string, blob: Blob): void {
    const a = document.createElement('a');
    const objectUrl = URL.createObjectURL(blob);
    a.href = objectUrl;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(objectUrl);
  }


}
