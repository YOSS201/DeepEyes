import { UserService } from './../../../services/user.service';
import { ReportService } from './../../../services/report.service';
import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButton, MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSortModule } from '@angular/material/sort';
import { MatPaginator } from '@angular/material/paginator';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerInputEvent, MatDatepickerModule } from '@angular/material/datepicker';
import { MatTableModule } from '@angular/material/table';
import { AlertService } from '../../../services/alert.service';
import { DeviceService } from '../../../services/devices.service';
import { AlertResponse } from '../../../models/AlertModel';
import { ReportCreate } from '../../../models/ReportModel';
import { ConfigsService } from '../../../services/configs.service';

@Component({
  selector: 'app-add-report',
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
    MatSortModule
  ],
  templateUrl: './add-report.component.html',
  styleUrl: './add-report.component.css'
})
export class AddReportComponent {
  
  filterForm: FormGroup;
  alerts: string[] = [];
  deviceNames: string[] = [];
  isLoading = false;
  filtersDetails = "";
  
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  statusOptions = [
    { value: 'pending', viewValue: 'Pending' },
    { value: 'confirmed', viewValue: 'Confirmed' },
    { value: 'discarded', viewValue: 'Discarded' }
  ];

  constructor(
    private router: Router, 
    private alertService: AlertService, 
    private deviceService: DeviceService,
    private reportService: ReportService,
    private configsService: ConfigsService,
    private userService: UserService,
    private fb: FormBuilder) {
      this.filterForm = this.fb.group({
      status: [''],
      startDate: [null],
      endDate: [null],
      deviceName: ['']
    });
  }

  ngOnInit(): void {
    /*this.alertService.getData().subscribe(data => {
      this.alertas = data;
    });*/
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

  // Valores seleccionados por el usuario en filtros
  rangoInicio: Date | null = null;
  rangoFin: Date | null = null;

  onFilter(): void {
    this.isLoading = true;
    const formValue = this.filterForm.value;

    this.filtersDetails = 
    "status = " + (formValue.status || "ninguno") +
    " | startDate = " + (this.convertDate(formValue.startDate) || "ninguno") +
    " | endDate = " + (this.convertDate(formValue.endDate) || "ninguno") +
    " | deviceName = " + (formValue.deviceName||"ninguno"); 

    this.alertService.getAlerts({
      status: formValue.status,
      startDate: formValue.startDate,
      endDate: formValue.endDate,
      deviceName: formValue.deviceName
    }).subscribe({
      next: (als) => {
        this.alerts = [];
        als.forEach(a => {
          this.alerts.push(a.id);
        });

        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading alerts', err);
        this.isLoading = false;
      }
    });
  }

  generateReport(): void {
    var nombre = ""
    if (this.alerts.length == 0) {
      alert("No se puede generar reporte con 0 alertas.")
      return;
    }
    this.configsService.getConfigs().subscribe({
      next: (data) => {
        var user_id = data[0].user_id
        this.userService.getOneUserId(user_id).subscribe({
        next: (user) => nombre = user.name,
        error: (e) => alert("Error fetching user by id: " + e)
      })},
      error: (e) => alert("Error getting configs: " + e)
    })
    const newReport: ReportCreate = {
      "alert_ids": this.alerts,
      "filters": this.filtersDetails,
      "user_name": nombre || "unknown"
    }
    this.reportService.createReport(newReport).subscribe({
      next: (data) =>{ 
        alert("Reporte creado correctamente: " + data)
        this.get_back();
      },
      error: (e) => alert("Error: " + e)
    });
  }

  onStartDateChange(event: MatDatepickerInputEvent<Date>): void {
    this.filterForm.patchValue({ startDate: event.value });
  }

  onEndDateChange(event: MatDatepickerInputEvent<Date>): void {
    this.filterForm.patchValue({ endDate: event.value });
  }

  convertDate(str: string) {
    if(str != null) {
      var date = new Date(str),
        mnth = ("0" + (date.getMonth() + 1)).slice(-2),
        day = ("0" + date.getDate()).slice(-2);
      return [date.getFullYear(), mnth, day].join("-");
    }
    return "ninguno";
  }

  get_back() {
        this.router.navigate(['/c/report']);
  }

}
