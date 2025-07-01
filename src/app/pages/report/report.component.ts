import { ReportService } from './../../services/report.service';
import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { FormsModule } from '@angular/forms';
import * as XLSX from 'xlsx';
import { ReportResponse } from '../../models/ReportModel';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { Router } from '@angular/router';
import { saveAs } from 'file-saver';

@Component({
  selector: 'app-report',
  standalone: true,
  templateUrl: './report.component.html',
  styleUrls: ['./report.component.css'],
  imports: [
    CommonModule,
    MatIconModule,
    MatFormFieldModule,
    MatSelectModule,
    MatButtonModule,
    MatTableModule,
    FormsModule
  ]
})
export class ReportComponent implements OnInit {
  reportes: any[] = [];
  reporteAutomatico: boolean = false;
  dataSource = new MatTableDataSource<ReportResponse>();

  alertIds: string[] = []; // Tu lista de IDs de alertas
  isLoading = false;
  errorMessage = '';


  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;


  constructor(public router: Router, private reportService: ReportService) {}

  ngOnInit(): void {
    this.loadReports();
  }

  // Cargar datos desde localStorage
  loadReports(): void {
    this.reportService.getReports().subscribe({
      next: (data) => {
        this.dataSource.data = data;
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;
      },
      error: (error) => {
        console.error('Error fetching reports:', error);
      }
    });
  }

  // Exportar datos a archivo Excel
  exportarExcel(): void {
    const worksheet = XLSX.utils.json_to_sheet(this.reportes);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Reportes');
    XLSX.writeFile(workbook, 'reportes.xlsx');
  }

  exportToExcel(ids: string[]): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.reportService.exportAlertsToExcel(ids).subscribe({
      next: (blob: Blob) => {
        saveAs(blob, 'reporte_alertas.xlsx');
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error al exportar reporte:', error);
        this.errorMessage = 'Error al generar el reporte. Por favor, inténtalo de nuevo.';
        this.isLoading = false;
      }
    });
  }


  // Generar reporte manual
  generarReporte(): void {
    this.router.navigate(['/s/add-report']);
  }
}
