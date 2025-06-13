import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private readonly apiUrl = 'http://127.0.0.1:8000';  //

  constructor(private http: HttpClient) { }

  get(endpoint: string, params?: any) {
    return this.http.get(`${this.apiUrl}/${endpoint}`, { params });
  }

  post(endpoint: string, body: any) {
    return this.http.post(`${this.apiUrl}/${endpoint}`, body);
  }

  patch(endpoint: string, body: any) {
    return this.http.patch(`${this.apiUrl}/${endpoint}`, body);
  }

  delete(endpoint: string) {
    return this.http.delete(`${this.apiUrl}/${endpoint}`);
  }
}
