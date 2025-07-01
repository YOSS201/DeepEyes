import { Component, OnInit, viewChild, ViewChild } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule} from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { Location } from '@angular/common';
import { DeviceService } from '../../services/devices.service';
import { DeviceResponse } from '../../models/DeviceModel';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';

@Component({
  selector: 'app-device',
  standalone: true,
  imports: [
    MatTableModule,
    CommonModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatListModule,
    MatSidenavModule,
    MatPaginator,
    MatSort,
    RouterLink
    
  ],
  templateUrl: './device.component.html',
  styleUrls: ['./device.component.css']
})
export class DeviceComponent implements OnInit {
  displayedColumns: string[] = ['name', 'status', 'position', 'type', 'model', 'location', 'createdAt', 'updatedAt', 'actions'];
  dataSource = new MatTableDataSource<DeviceResponse>();

  devices: DeviceResponse[] = [];

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(public router: Router, private location: Location, private deviceService: DeviceService) {}

  ngOnInit(): void {
    this.loadDevices();
  }

  loadDevices(): void {
    this.deviceService.getDevices().subscribe({
      next: (data) => {
        this.dataSource.data = data;
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;
      },
      error: (error) => {
        console.error('Error fetching devices:', error);
      }
    });
  }

  deleteDevice(id: string): void {
    if (confirm('Seguro que quieres eliminar el dispositivo?')) {
      this.deviceService.deleteDevice(id).subscribe({
        next: () => {
          //alert('Device deleted successfully!');
          this.loadDevices(); // Recarga la lista
        },
        error: (error) => {
          alert('Failed to delete device: ' + (error.message || 'Unknown error'));
        }
      });
    }
  }

  device = [
    { nombre: 'Cámara 1', estado: 'Activo', modelo: 'CamX100', ubicacion: 'Entrada' },
    { nombre: 'Sensor 2', estado: 'Inactivo', modelo: 'SensZ200', ubicacion: 'Pasillo' },
    { nombre: 'Cámara 3', estado: 'Activo', modelo: 'CamX300', ubicacion: 'Caja' }
  ];

  agregarDispositivo() {
    alert('Funcionalidad para agregar dispositivo');
  }

  editarDispositivo(device: any) {
    alert(`Editar: ${device.nombre}`);
  }

  eliminarDispositivo(device: any) {
    const confirmacion = confirm(`¿Eliminar ${device.nombre}?`);
    if (confirmacion) {
      this.device = this.device.filter(d => d !== device);
    }
  }
  goToDevice(){
    this.router.navigate(['/home']);
  }

  

  back() {
    this.router.navigate(['/home']);
  }

}
