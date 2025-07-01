import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ConfigCreate, ConfigResponse } from '../models/ConfigModel';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ConfigsService {

    private apiUrl = 'http://127.0.0.1:8000/configs/'; // Asegúrate de que termina en /

  constructor(private http: HttpClient) { }

  getConfigs(): Observable<ConfigResponse[]> {
      return this.http.get<ConfigResponse[]>(this.apiUrl, { headers: { 'Content-Type': 'application/json' } });
    }

  updateConfig(id: string, config: ConfigCreate): Observable<ConfigResponse> {
    return this.http.patch<ConfigResponse>(`${this.apiUrl}${id}`, config, { headers: { 'Content-Type': 'application/json' } });
  }

}
