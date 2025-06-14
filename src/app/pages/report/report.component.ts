import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { FormsModule } from '@angular/forms';
import * as XLSX from 'xlsx';

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

  ngOnInit(): void {
    this.cargarReportes();
  }

  // Cargar datos desde localStorage
  cargarReportes(): void {
    this.reportes = [];

    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith('alerta_')) {
        const item = localStorage.getItem(key);
        if (item) {
          try {
            this.reportes.push(JSON.parse(item));
          } catch (error) {
            console.error(`Error al parsear la alerta ${key}`, error);
          }
        }
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

  // Generar reporte manual
  generarReporte(): void {
    console.log('Generando reporte...');
    console.log('¿Reporte automático?', this.reporteAutomatico ? 'Sí' : 'No');
    alert('Reporte generado exitosamente.');
  }
}
