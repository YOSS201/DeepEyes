import { UserResponse, UserModelContra } from './models/UserModel';
import { UserService } from './services/user.service';
import { booleanAttribute, Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { BehaviorSubject, Observable, map, tap } from 'rxjs';
import { Router } from '@angular/router';
import { errorContext } from 'rxjs/internal/util/errorContext';


@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private currentUserSubject = new BehaviorSubject<any>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  userr = {
    name: "ac",
    email: "a@aa.com",
    password: "aaaa",
    role: "aaa",
    id: "aaa",
    createdAt: "aaa",
    updatedAt: "aaa"
  }

  /*private readonly validUser = {
    username: 'admin',
    password: '123456'
  };

  isLoggedIn = false;*/

  constructor(private http: HttpClient, private router: Router, private userService: UserService) {
    const token = localStorage.getItem('access_token');
    if (token) {
      this.fetchCurrentUser().subscribe();
    }
  }
  headers = new HttpHeaders({
    'Content-Type': 'application/x-www-form-urlencoded'
  });

  login(email: string, password: string): Observable<any> {
    const formData = new FormData();
    formData.append('username', email);
    formData.append('password', password);
    
    /*return this.http.post('http://127.0.0.1:8000/token', formData).pipe(
      tap((response: any) => {
        localStorage.setItem('access_token', response.access_token);
        this.fetchCurrentUser().subscribe();
      })
      );*/
    
    //return this.http.post(`${'http://127.0.0.1:8000/token/'}${formData}`).pipe(
    return this.http.post('http://127.0.0.1:8000/get/token', formData).pipe(
      tap((response: any) => {
        localStorage.setItem('access_token', response.access_token);
        this.fetchCurrentUser().subscribe();
      })
    );
  
  }

  login2(email: string, password: string): Observable<any> {
    const body = new HttpParams()
      .set('username', email)
      .set('password', password);

    const headers = new HttpHeaders({
      'Content-Type': 'application/x-www-form-urlencoded'
    });

    return this.http.post('http://127.0.0.1:8000/get/token', body.toString(), { headers }).pipe(
      tap((response: any) => {
        localStorage.setItem('access_token', response.access_token);
        //this.fetchCurrentUser().subscribe();
      })
    );
  }

  login3(email: string, password: string): Observable<any> {
    const body = new URLSearchParams();
    body.set('username', email);
    body.set('password', password);
    
    return this.http.post('http://127.0.0.1:8000/get/token', body.toString(), {
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        withCredentials: true  // Importante para CORS con credenciales
    }).pipe(
        tap((response: any) => {
            localStorage.setItem('access_token', response.access_token);
            this.fetchCurrentUser().subscribe();//////
        })
    );
  }


  login_not_safe(email: string, password: string): Observable<any> {
    
    /*return this.http.post('http://127.0.0.1:8000/token', formData).pipe(
      tap((response: any) => {
        localStorage.setItem('access_token', response.access_token);
        this.fetchCurrentUser().subscribe();
      })
    );
    console.log('email antes de getoneuser: ', email)
    this.userService.getOneUser(email).subscribe({
      next: (data) => {
        console.log('comparar contrasenias: ', data.password, " --- ", password);
        if(data.password === password)
          console.log('conrasenas iguales', data, "data: ", data);
      },
      error: (e) => {
        console.error('Error getting one user by email:', e);
      }
    });*/

    return this.http.get<UserModelContra>(`${'http://127.0.0.1:8000/users/email/'}${email}`).pipe(
      tap(user => {
        console.log('comparar contrasenias: ', user.password, " --- ", password);
        if(user.password === password)
          console.log('conrasenas iguales', "user: ", user);
      })
    );
    
  }

  private fetchCurrentUser(): Observable<any> {
    console.log("Fetching Current User")
    return this.http.get('http://127.0.0.1:8000/users/me').pipe(
      tap(user => {
        console.log("TAP A fetchCurrentUser")
        this.currentUserSubject.next(user);
      })
    );
  }

  logout(): void {
    localStorage.removeItem('access_token');
    this.currentUserSubject.next(null);
    this.router.navigate(['/s/login']);
  }

  getToken(): string | null {
    return localStorage.getItem('access_token');
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  getCurrentUser(): any {
    return this.currentUserSubject.value;
  }


  /*login(username: string, password: string): boolean {
    if (username === this.validUser.username && password === this.validUser.password) {
      this.isLoggedIn = true;
      return true;
    }
    return false;
  }

  logout() {
    this.isLoggedIn = false;
    this.router.navigate(['/login']);
  }

  isAuthenticated(): boolean {
    return this.isLoggedIn;
  }*/
}

