import { Component } from '@angular/core';
import { MatCardModule } from '@angular/material/card'; // Necesario para <mat-card>

@Component({
  selector: 'app-help',
  standalone: true,
  templateUrl: './help.component.html',
  styleUrls: ['./help.component.css'],
  imports: [
    MatCardModule // <-- ¡IMPORTANTE!
  ]
})
export class HelpComponent {}
