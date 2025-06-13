import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { AppComponent } from './app.component';
import { MaterialModule } from './material.module'; // asegúrate de que esta ruta esté bien
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
// Todos los componentes....
import { LoginComponent } from'./pages/login/login.component' //'./login/login.component'; 
import { RegisterComponent } from './pages/register/register.component'//./register/register.component
import { HomeComponent } from './pages/home/home.component';
import { FormsModule, NgModel, ReactiveFormsModule } from '@angular/forms';
import { MatCard } from '@angular/material/card';
import { MatSidenavModule } from '@angular/material/sidenav';
import { RouterModule } from '@angular/router';
import { VideowallComponent } from './pages/videowall/videowall.component';
import { MatDivider } from '@angular/material/divider';
import { MatDividerModule } from '@angular/material/divider';
import { AlertComponent } from './pages/alert/alert.component';
import { AlertDetailsComponent } from './pages/alert/alertdetails/alertdetails.component';
import { MatIconModule } from '@angular/material/icon';  
import { DeviceComponent } from './pages/device/device.component';
//import { ReportComponent } from './pages/report/report.component';
import { MatToolbarModule } from '@angular/material/toolbar';
import { HTTP_INTERCEPTORS, HttpClient } from '@angular/common/http';
import { HttpClientModule } from '@angular/common/http'; 
//import { provideHttpClient } from '@angular/common/http';
import { MatDialogModule } from '@angular/material/dialog';
import { MatInputModule } from '@angular/material/input';
//import { FormsModule } from '@angular/forms';
import { routes } from './app.routes';
import { AuthGuard } from './auth.guard';
import { JwtInterceptor } from './jwt.interceptor';



@NgModule({
  declarations: [    
    AppComponent,
    LoginComponent
  ],
  imports: [
    //empieza nuevo
    BrowserModule,
    ReactiveFormsModule,
    RouterModule.forRoot([
      { path: 'login', component: LoginComponent },
      { 
        path: 'home', 
        loadChildren: () => import('./pages/home/home.component').then(m => m.HomeComponent),
        canActivate: [AuthGuard] 
      },
      { path: '', redirectTo: '/home', pathMatch: 'full' }
    ]),
    //acaba nuevo

    //ReportComponent,
    DeviceComponent,
    MatIconModule ,
    MatButtonModule,
    MatTableModule,    
    MatDividerModule,
    MatDivider,
    RouterModule,
    BrowserModule,
    BrowserAnimationsModule,
    MaterialModule,
    AppComponent,
    LoginComponent,
    RegisterComponent,
    HomeComponent,
    FormsModule,
    MatCard,
    MatSidenavModule,
    VideowallComponent,
    AlertComponent,
    NgModule,
    NgModel,
    RouterModule,
    MatToolbarModule,
    HttpClient,
    HttpClientModule,
    MatDialogModule,
    MatInputModule,
    RouterModule.forRoot(routes),    
    AppComponent,
    AlertDetailsComponent
  ],
  providers: [
    { provide: HTTP_INTERCEPTORS, useClass: JwtInterceptor, multi: true }
  ],
  //bootstrap: [AppComponent]
})
export class AppModule { }

