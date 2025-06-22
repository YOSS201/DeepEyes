import { DeviceService } from './../../services/devices.service';
import { Component, OnInit } from '@angular/core';
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
    ReactiveFormsModule  
    
   
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

  statusOptions = [
    { value: 'pending', viewValue: 'Pending' },
    { value: 'confirmed', viewValue: 'Confirmed' },
    { value: 'discarded', viewValue: 'Discarded' }
  ];

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


  displayedColumns: string[] = ['id', 'status', 'video', 'camera','createdAt', 'actions'];

  
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
        this.alerts = alerts;
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


}