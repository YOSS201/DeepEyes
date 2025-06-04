import { UserService } from './../../services/user.service';
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common'; // Para directivas comunes como *ngIf
import { FormsModule } from '@angular/forms'; // Para formularios
import { MatFormFieldModule } from '@angular/material/form-field'; // MatFormField
import { MatInputModule } from '@angular/material/input'; // MatInput
import { MatButtonModule } from '@angular/material/button'; // MatButton
import { Router, RouterModule } from '@angular/router';
import { UserCreate } from '../../models/UserModel';
import { MatOption, MatSelectModule } from '@angular/material/select';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-register',
  standalone: true, // Componente standalone
  imports: [
    RouterModule,
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatOption,
    MatCardModule,
    MatSelectModule,
    
  ],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent {
  newUser: UserCreate = {
    "name": "",
    "email": "",
    "role": "",
    "password": "",
  }
  contra = "";
  
  constructor(private router: Router, private userService: UserService) {}


  onCreateAccountClick() {
    if (this.contra == ""){
      alert("No hay contra");
      return;
    }
    if (this.newUser.password == this.contra) {
      this.userService.createUser(this.newUser).subscribe({
        next: (data) => alert("Creación exitosa. Bienvenido, " + data.name),
        error: (e) => alert("Error" + e)
      });
      console.log('Cuenta registrada');
      this.router.navigate(["/c/home"]);
    }
    else
      alert("Las contraseñas no coinciden")
  }
}

