import { ConfigsService } from './../../services/configs.service';
import { DeviceService } from './../../services/devices.service';
import { AlertService } from './../../services/alert.service';
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatButtonModule } from '@angular/material/button';
import { ReportService } from '../../services/report.service';
import { AlertResponse } from '../../models/AlertModel';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatDividerModule,
    MatButtonModule
  ],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit{
  

  totalAlertas = 0;
  alertasHoy = 0;
  alertas = {
    pendientes: 0,
    confirmados: 0,
    descartados: 0,
    hoy: {
      pendientes: 0,
      confirmados: 0,
      descartados: 0
    }
  };

  camaras = [
    'assets/camara1.jpg',
    'assets/camara2.jpg',
    'assets/camara3.jpg'
  ];

  camarasActivas = 0;
  camarasInactivas = 0;

  totalReportes = 0;
  generarAutomatico = false;

  notif = true;

  constructor(private alertService: AlertService, private deviceService: DeviceService, private reportService: ReportService, private configsService: ConfigsService) {}

  ngOnInit(): void {

    this.llamarAlertas();
    this.llamarCamaras();
    this.llamarReports();
    this.llamarConfiguracion();
  }

  llamarAlertas(): void {

    this.alertas = {
      pendientes: 0,
      confirmados: 0,
      descartados: 0,
      hoy: {
        pendientes: 0,
        confirmados: 0,
        descartados: 0
      }
    };

    const ayer = new Date();
    ayer.setDate(ayer.getDate() - 1);

     this.alertService.getAlerts({}).subscribe({
      next: (alerts) => {
        alerts.forEach(alert => {
          this.totalAlertas += 1;

          switch (alert.status) {
            case "confirmed":
              this.alertas.confirmados += 1;
              if(new Date(alert.createdAt) > ayer){
                this.alertas.hoy.confirmados += 1;
                this.alertasHoy++;
              }
              break
            case "pending":
              this.alertas.pendientes += 1;
              if(new Date(alert.createdAt) > ayer){
                this.alertas.hoy.pendientes += 1;
                this.alertasHoy++;
              } 
              break
            case "discarded":
              this.alertas.descartados += 1;
              if(new Date(alert.createdAt) > ayer){
                this.alertas.hoy.descartados += 1;
                this.alertasHoy++;
              } 
              break
            default:
              break;
          }
        });

      },
      error: (e) => alert("error: " + e)
    })
  }

  llamarCamaras() {
    this.deviceService.getDevices().subscribe({
      next: (devices) => {
        devices.forEach(device => {
          if(device.status == true)
            this.camarasActivas += 1;
          else
            this.camarasInactivas += 1;
        });
      },
      error: (e) => alert("Error: " + e)
    });
  }

  llamarReports() {
    this.reportService.getReports().subscribe({
      next: (reports) => 
        this.totalReportes = reports.length,
      error: (e) => alert("Error: " + e)
    });
  }
  
  llamarConfiguracion() {
    this.configsService.getConfigs().subscribe({
      next: (data) =>{
        this.generarAutomatico = data[0].auto;
        this.notif = data[0].notif;
      },
      error: (e) => alert("Error obteniendo auto: " + e)
    });  
  }


  pieChartData = {
    labels: ['Red', 'Blue', 'Yellow'],
    datasets: [{
      data: [300, 500, 200],
      backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56'],
      hoverBackgroundColor: ['#FF6384', '#36A2EB', '#FFCE56']
    }]
  };
}


