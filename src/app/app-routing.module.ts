import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router'; /// nose si es router o route
import { LoginComponent } from './pages/login/login.component';
import { RegisterComponent } from './pages/register/register.component';
import { HomeComponent } from './pages/home/home.component';
import { VideowallComponent } from './pages/videowall/videowall.component';
import { AlertComponent } from './pages/alert/alert.component';
import { DeviceComponent } from './pages/device/device.component';
import { ReportComponent } from './pages/report/report.component';
import { ConfigurationComponent } from './pages/configuration/configuration.component';
import { AlertDetailsComponent } from './pages/alert/alertdetails/alertdetails.component';


const routes: Routes = [
  /*{ path: '', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'home', component: HomeComponent },
  { path:'videowall', component: VideowallComponent},
  { path:'alert', component:AlertComponent},
  { path: 'device', component: DeviceComponent },
  { path: '**', redirectTo: 'device' },
  { path: 'report', component: ReportComponent },
  { path:'configuration', component:ConfigurationComponent},
  { path: 'alertdetails/:id', component: AlertDetailsComponent},*/
   
];

@NgModule({
  declarations: [],
  imports: [
    CommonModule,RouterModule.forRoot(routes)],
    exports: [RouterModule]
})
export class AppRoutingModule { }
