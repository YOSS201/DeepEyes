import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ReportCreate, ReportResponse } from '../models/ReportModel';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ReportService {
  private readonly apiUrl = 'http://127.0.0.1:8000/reports/';  // URL del FastAPI

  constructor(private http: HttpClient) { }

  createReport(report: ReportCreate): Observable<ReportCreate> {
      return this.http.post<ReportCreate>(this.apiUrl, report, { headers: { 'Content-Type': 'application/json' } });
  }

  getReports(): Observable<ReportResponse[]> {
    return this.http.get<ReportResponse[]>(this.apiUrl, { headers: { 'Content-Type': 'application/json' } });
  }

  getOneReport(id: string): Observable<ReportResponse> {
      return this.http.get<ReportResponse>(`${this.apiUrl}${id}`);
  }

  deleteReport(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}${id}`);
  }

  exportAlertsToExcel(
    alertIds: string[],
    status?: string,
    startDate?: Date,
    endDate?: Date,
    deviceName?: string
  ): Observable<Blob> {
    let params = new HttpParams();

    // Agregar parámetros opcionales
    if (status) params = params.append('status', status);
    if (startDate) params = params.append('start_date', startDate.toISOString());
    if (endDate) params = params.append('end_date', endDate.toISOString());
    if (deviceName) params = params.append('device_name', deviceName);
    
    // Agregar lista de IDs de alertas
    alertIds.forEach(id => {
      params = params.append('alert_ids', id);
    });

    return this.http.get(`${this.apiUrl}export_report/`, {
      params: params,
      responseType: 'blob' // Importante para manejar la respuesta como archivo
    });
  }




}
