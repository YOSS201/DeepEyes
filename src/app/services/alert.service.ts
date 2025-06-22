import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AlertCreate, AlertResponse } from '../models/AlertModel';

@Injectable({ providedIn: 'root' })
export class AlertService {
  private apiUrl = 'http://127.0.0.1:8000/alerts/'; // Asegúrate de que termina en /

  constructor(private http: HttpClient) {}

  /*getData() {
    return this.http.get<any[]>('http://127.0.0.1:8000/alerts');
  }
*/
  saveAlert(alert: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/save-alert`, alert);
  }
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
      .set('limit', filters.limit?.toString() || '10');

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

}
