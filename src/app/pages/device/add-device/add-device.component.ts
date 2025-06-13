import { DeviceService } from './../../../services/devices.service';
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { DeviceResponse, DeviceCreate } from '../../../models/DeviceModel';

@Component({
  selector: 'app-add-device',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './add-device.component.html',
  styleUrls: ['./add-device.component.css']
})
export class AddDeviceComponent implements OnInit{
  constructor(private router: Router, private deviceService: DeviceService, private route: ActivatedRoute
  ) {}
  errorMessage: string | null = null;
  isEditMode: boolean = false;
  deviceId: string | null = null;

  nuevoDispositivo2 = {
    nombre: '',
    modelo: '',
    estado: 'Activo',
    ubicacion: '',
    fechaInstalacion: ''
  };

  nuevoDispositivo: DeviceCreate = {
    name: '',
    status: true,
    type: '',
    model: '',
    location: '',
  };

  ngOnInit(): void {
    this.deviceId = this.route.snapshot.paramMap.get('id');
    if (this.deviceId) {
      this.isEditMode = true;
      this.loadDevice();
    }
  }

  loadDevice(): void {
    this.deviceService.getOneDevice(this.deviceId!).subscribe({
      next: (device) => {
        //const device = devices.find(d => d.id === this.deviceId);
        
        if (device) {
          this.nuevoDispositivo = {
            name: device.name,
            status: device.status,
            type: device.type,
            model: device.model,
            location: device.location
          }
          /*this.deviceForm.patchValue({
            name: device.name,
            status: device.status,
            type: device.type,
            model: device.model,
            location: device.location
          });*/
        } else {
          this.errorMessage = 'Device not found';
        }
      },
      error: (error) => {
        this.errorMessage = error.message || 'Failed to load device';
      }
    });
  }
  
  ubicaciones = ['Entrada', 'Pasillo', 'Caja', 'Oficina'];
  
  /*guardarDispositivo() {
    this.deviceService.createDevice(this.nuevoDispositivo).subscribe({
      next: () => {
        alert('Dispositivo creado!');
        this.router.navigate(['/device']); // Redirige a la lista de dispositivos
      },
      error: (error) => {
        console.error('Error creating device:', error);
        alert('Failed to create device: ' + (error.error?.detail || 'Unknown error'));
      }
    });
  }*/

  onSubmit(): void {
    this.errorMessage = null;
    if (this.isEditMode && this.deviceId) {
      this.deviceService.updateDevice(this.deviceId, this.nuevoDispositivo).subscribe({
        next: () => {
          alert('Device updated successfully!');
          this.router.navigate(['/c/device']);
        },
        error: (error) => {
          this.errorMessage = error.message || 'Failed to update device';
          alert(error.message);
        }
      });
    } else {
      this.deviceService.createDevice(this.nuevoDispositivo).subscribe({
        next: () => {
          alert('Dispositivo creado!');
          this.router.navigate(['/c/device']); // Redirige a la lista de dispositivos
        },
        error: (error) => {
          console.error('Error creating device:', error);
          alert('Failed to create device: ' + (error.error?.detail || 'Unknown error'));
        }
      });
    }
    
  }

  volverATabla() {
    this.router.navigate(['/c/device']);
  }
}
