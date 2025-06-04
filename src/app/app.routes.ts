import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { VideowallComponent } from './pages/videowall/videowall.component';
import { HomeComponent } from './pages/home/home.component';
import { AlertComponent } from './pages/alert/alert.component';
import { RegisterComponent } from './pages/register/register.component';
import { AlertDetailsComponent } from './pages/alert/alertdetails/alertdetails.component';
import { DeviceComponent } from './pages/device/device.component';
import { AddDeviceComponent } from './pages/device/add-device/add-device.component';
import { ReportComponent } from './pages/report/report.component';
import { CreateReportComponent } from './pages/report/create-report/create-report.component';
import { ConfigurationComponent } from './pages/configuration/configuration.component';
import { AuthGuard } from './auth.guard';
import { LayoutComponent } from './layouts/layout/layout.component';
import { EmptyLayoutComponent } from './layouts/empty-layout/empty-layout.component';

export const routes: Routes = [
  { 
    path: '', // Ruta raíz
    redirectTo: 'c/home', // Redirige al layout con navbar por defecto
    pathMatch: 'full'
  },

  { path: 'c', 
    component: LayoutComponent,
    children: [
      { path: 'videowall', component: VideowallComponent, canActivate: [AuthGuard] }, 
      { path: 'alert', component: AlertComponent, canActivate: [AuthGuard] },
      
      { path: 'home', component: HomeComponent, canActivate: [AuthGuard] },
      { path:'device',component:DeviceComponent, canActivate: [AuthGuard]},
      { path: 'report', component: ReportComponent, canActivate: [AuthGuard] },

      { path:'configuration', component:ConfigurationComponent, canActivate: [AuthGuard]},
      { path: '', redirectTo: 'home', pathMatch: 'full' },
      { path: '**', redirectTo: 'home' }, // para que cualquier ruta incorrecta vaya a login
      //{ path: 'home', loadComponent: () => import('./pages/home/home.component').then(m => m.HomeComponent) },
      //{ path: 'videowall', loadComponent: () => import('./pages/videowall/videowall.component').then(m => m.VideowallComponent) },
      //{ path: 'alert',loadComponent: () => import('./pages/alert/alert.component').then(m => m.AlertComponent)  },
      //{ path: 'alertdetails/:id',loadComponent: () => import('./pages/alert/alertdetails/alertdetails.component').then(m => m.AlertDetailsComponent)  },
      //{ path:'device',loadComponent:()=> import('./pages/device/device.component').then(m=>m.DeviceComponent)},
      //{ path:'add-device',loadComponent:()=> import('./pages/device/add-device/add-device.component').then(m=>m.AddDeviceComponent)},
      //{ path: 'add-device/:id', loadComponent:()=> import('./pages/device/add-device/add-device.component').then(m=>m.AddDeviceComponent) },
      //{ path: '', redirectTo: 'device', pathMatch: 'full' },
      //{ path: '**', redirectTo: 'device' },
      //{ path:'report',loadComponent:()=> import('./pages/report/report.component').then(m=>m.ReportComponent)},
      //{ path:'create-report', loadComponent: () => import('./pages/report/create-report/create-report.component').then(m => m.CreateReportComponent)  },
      //{ path: 'configuration',    loadComponent: () =>      import('./pages/configuration/configuration.component').then(m => m.ConfigurationComponent)  },
      //{ path: 'login', loadComponent: () => import('./pages/login/login.component').then(m => m.LoginComponent) },
    ] 
    
  },
  
  {
    path: 's',
    component: EmptyLayoutComponent, // Reutilizamos el mismo layout
    children: [
      { path: 'login', component: LoginComponent},
      { path: 'register', component: RegisterComponent},
      { path: 'add-device', component: AddDeviceComponent, canActivate: [AuthGuard]},
      { path: 'add-device/:id', component: AddDeviceComponent, canActivate: [AuthGuard]},
      { path:'create-report', component:CreateReportComponent, canActivate: [AuthGuard]},
      { path:'alertdetails/:id', component:AlertDetailsComponent, canActivate: [AuthGuard]},
      { path: '', redirectTo: 'login', pathMatch: 'full' },
      { path: '**', redirectTo: 'login' }, // para que cualquier ruta incorrecta vaya a login
      
    ]
  },
  // Captura global de rutas no encontradas
  { path: '**', redirectTo: 's/login' } // Redirige al login si ninguna ruta coincide
  
];
