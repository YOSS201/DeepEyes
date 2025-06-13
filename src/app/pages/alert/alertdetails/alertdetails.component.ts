import { Component, Inject,OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CommonModule, Location } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatDialogModule } from '@angular/material/dialog';
import { MatDialog } from '@angular/material/dialog';
import { FormsModule } from '@angular/forms';
import { AlertService } from '../../../services/alert.service';
import { AlertCreate, AlertResponse } from '../../../models/AlertModel';


@Component({
  selector: 'app-alertdetails',
  standalone:true,
  imports: [
    CommonModule,
    RouterModule,
    MatDialogModule,
    FormsModule
   
    
  ],
  templateUrl: './alertdetails.component.html',
  styleUrls: ['./alertdetails.component.css']
})
export class AlertDetailsComponent implements OnInit {
  alertId: string | null = null;
  comentario: string = '';
  alertdetails:any

  alert!: AlertResponse;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private alertService: AlertService,
    private location: Location
  ) {
    const nav = this.location.getState() as any;
    this.alertdetails = nav.alertdetails;
  }

  ngOnInit(): void {
    this.alertId = this.route.snapshot.paramMap.get('id');

    this.alertService.getOneAlert(this.alertId!).subscribe({
      next: (data) => {
        this.alert = data;
      }
    })
  }

  guardar() {
    const alertaActualizada = {
      id: this.alertId,
      title: '',     // FastAPI no usa este campo para actualizar
      fecha: '',     // Igual
      comentario: this.comentario
    };
    this.alertService.saveAlert(alertaActualizada).subscribe(() => {
      this.router.navigate(['/alert']);
    });
  }

  /////////////////////

  confirmar() {
      alert('Alerta confirmada');
    }
  
    descartar() {
      alert('Alerta descartada');
    }
  
    volver() {
      window.history.back();
    }
}
