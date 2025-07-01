import { DeviceService } from './../../services/devices.service';
import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerInputEvent, MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { Router, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { AlertService } from './../../services/alert.service';
import { MatButton } from '@angular/material/button';
import { AlertResponse } from '../../models/AlertModel';
import { MatPaginator } from '@angular/material/paginator';
import { Sort, MatSortModule } from '@angular/material/sort';




@Component({
  selector: 'app-alert',
  standalone: true,
  imports: [
    MatIconModule,    
    FormsModule,   
    RouterModule,
    CommonModule,
    MatTableModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatButton,
    ReactiveFormsModule,
    MatPaginator,
    MatSortModule
    
   
  ],
  templateUrl: './alert.component.html',
  styleUrls: ['./alert.component.css'],
})
//falta mejorar
export class AlertComponent implements OnInit {
  
  alerts: AlertResponse[] = [];
  deviceNames: string[] = [];
  isLoading = false;
  totalAlerts = 0;
  pageSize = 10;
  currentPage = 0;
  
  filterForm: FormGroup;

  sortedData: AlertResponse[] = [];

  
  statusOptions = [
    { value: 'pending', viewValue: 'Pending' },
    { value: 'confirmed', viewValue: 'Confirmed' },
    { value: 'discarded', viewValue: 'Discarded' }
  ];
  
  displayedColumns: string[] = ['pos', 'createdAt', 'status', 'video', 'camera', 'id', 'actions'];
  
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  
  constructor(
    private router: Router, 
    private alertService: AlertService, 
    private deviceService: DeviceService,
    private fb: FormBuilder) {
      this.filterForm = this.fb.group({
      status: [''],
      startDate: [null],
      endDate: [null],
      alertId: [''],
      deviceName: ['']
    });

  }

  ngOnInit(): void {
    /*this.alertService.getData().subscribe(data => {
      this.alertas = data;
    });*/
    this.loadAlerts();
    this.loadDeviceNames();
  }

  sortData(sort: Sort) {
    const data = this.alerts.slice();
    if (!sort.active || sort.direction === '') {
      this.sortedData = data;
      return;
    }

    this.sortedData = data.sort((a, b) => {
      const isAsc = sort.direction === 'asc';
      switch (sort.active) {
        case 'status':
          return compare(a.status, b.status, isAsc);
        case 'video':
          return compare(a.video, b.video, isAsc);
        case 'camera':
          return compare(a.device.name, b.device.name, isAsc);
        case 'createdAt':
          return compare(a.createdAt, b.createdAt, isAsc);
        case 'id':
          return compare(a.id, b.id, isAsc);
        default:
          return 0;
      }
    });
  }


  loadDeviceNames(): void {
    this.deviceService.getDevices().subscribe({
      next: (devices) => {
        devices.forEach(device => {
          this.deviceNames.push(device.name);          
        });
      },
      error: (err) => console.error('Error loading device names', err)
    });
  }


  verDetalles(id: number) {
    this.router.navigate(['/s/alertdetails', id]);
  }

  ///////////

  goHome(): void {
    this.router.navigate(['/home']);
  }
  reviewDetails(alertdetails: any) {
    this.router.navigate(['/alertdetails'], { state: { alertdetails } });
  }



  
  loadAlerts(): void {
    this.isLoading = true;
    const formValue = this.filterForm.value;

    this.alertService.getAlerts({
      status: formValue.status,
      startDate: formValue.startDate,
      endDate: formValue.endDate,
      alertId: formValue.alertId,
      deviceName: formValue.deviceName,
      skip: this.currentPage * this.pageSize,
      limit: this.pageSize
    }).subscribe({
      next: (alerts) => {
        this.alerts = this.sortedData = alerts.slice();
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading alerts', err);
        this.isLoading = false;
      }
    });
  }

  dataSource = [
    /*{ fecha: '2025-04-29', hora: '10:30', evento: 'Movimiento', camara: 'Cámara 1' },
    { fecha: '2025-04-29', hora: '11:00', evento: 'Alerta sonora', camara: 'Cámara 2' },
    { fecha: '2025-04-28', hora: '09:45', evento: 'Desconexión', camara: 'Cámara 3' }
     */
  ];

  // 🎯 Filtros disponibles
  tiposEvento: string[] = ['Movimiento', 'Alerta sonora', 'Desconexión'];
  prioridades: string[] = ['Alta', 'Media', 'Baja'];

  // 🧪 Valores seleccionados por el usuario en filtros
  rangoInicio: Date | null = null;
  rangoFin: Date | null = null;
  tipoEvento: string = '';
  prioridad: string = '';

  onFilter(): void {
    this.currentPage = 0;
    this.loadAlerts();
  }

  clearFilters(): void {
    this.filterForm.reset();
    this.onFilter();
  }

  onPageChange(event: any): void {
    this.currentPage = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadAlerts();
  }

  onStartDateChange(event: MatDatepickerInputEvent<Date>): void {
    this.filterForm.patchValue({ startDate: event.value });
  }

  onEndDateChange(event: MatDatepickerInputEvent<Date>): void {
    this.filterForm.patchValue({ endDate: event.value });
  }

  eliminarAlerta(id: string) {
    if (confirm('¿Seguro que quieres eliminar esta alerta?')) {
      this.alertService.deleteAlert(id).subscribe({
        next: () => {
          //alert('Device deleted successfully!');
          this.loadAlerts(); // Recarga la lista
        },
        error: (error) => {
          alert('Failed to delete device: ' + (error.message || 'Unknown error'));
        }
      });
    }

  }


}

function compare(a: number | string, b: number | string, isAsc: boolean) {
  return (a < b ? -1 : 1) * (isAsc ? 1 : -1);
}
