import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { HttpClient } from '@angular/common/http';
import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';
import { CreateReportComponent } from './create-report/create-report.component';

@Component({
  selector: 'app-report',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './report.component.html',
  styleUrls: ['./report.component.css']
})
export class ReportComponent {
  reportes: any[] = [];

  ngOnInit() {
    this.cargarReportes();
  }

  cargarReportes() {
    this.reportes = [];

    for (let key in localStorage) {
      if (key.startsWith('alerta_')) {
        const item = localStorage.getItem(key);
        if (item) {
          this.reportes.push(JSON.parse(item));
        }
      }
    }
  }

  exportarExcel() {
    const worksheet = XLSX.utils.json_to_sheet(this.reportes);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Reportes");
    XLSX.writeFile(workbook, 'reportes.xlsx');
  }
}