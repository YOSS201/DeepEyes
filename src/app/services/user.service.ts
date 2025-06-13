import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { DeviceResponse } from '../models/DeviceModel';
import { UserResponse, UserModelContra, UserCreate } from '../models/UserModel';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  private readonly apiUrl = 'http://127.0.0.1:8000/users/';  // URL del FastAPI

  constructor(private http: HttpClient) {}

  getData() {
    return this.http.get<any[]>('http://127.0.0.1:8000/users');
  }

  createUser(userData: any): Observable<UserCreate> {
    return this.http.post<UserCreate>(`${this.apiUrl}`, userData);
  }

  getUsers(): Observable<any> {// a veces funciona a veces ni idea
    return this.http.get(`${this.apiUrl}/`);
  }

  getOneUserEmail(email: string): Observable<UserModelContra> { //funciona
    return this.http.get<UserModelContra>(`${this.apiUrl}email/${email}`);
  }

  getOneUserId(id: string): Observable<UserResponse> {//funciona
    return this.http.get<UserResponse>(`${this.apiUrl}id/${id}`);
  }

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
