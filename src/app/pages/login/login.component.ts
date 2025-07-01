import { ConfigCreate } from './../../models/ConfigModel';
import { UserService } from './../../services/user.service';
import { Component} from '@angular/core';
import { CommonModule } from '@angular/common'; // Importa CommonModule para directivas básicas como *ngIf, *ngFor
import { ReactiveFormsModule, FormBuilder, FormGroup, FormsModule, Validators } from '@angular/forms'; // Importa FormsModule para formularios
import { MatFormFieldModule } from '@angular/material/form-field'; // Importa el módulo de mat-form-field
import { MatInputModule } from '@angular/material/input'; // Importa el módulo de matInput
import { MatButtonModule } from '@angular/material/button'; // Importa el módulo de matButton
import { RouterModule} from '@angular/router';
import { AuthService } from '../../auth.service';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { ConfigsService } from '../../services/configs.service';

@Component({
  selector: 'app-login', 
  standalone: true, // Define que es un componente standalone
  imports: [   
    RouterModule,
    CommonModule,  // Necesario para *ngIf, *ngFor
    FormsModule,   // Necesario para formularios
    MatFormFieldModule, // Módulo para usar <mat-form-field>
    MatInputModule, // Módulo para usar <input matInput>
    MatButtonModule, // Módulo para usar <button mat-raised-button>
    MatCardModule,
    ReactiveFormsModule
    
  ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {

  loginForm: FormGroup;
  errorMessage: string = '';


  /*username= '';
  password= '';
  error:String = ''; //  ESTA LÍNEA ES LA CLAVE

  datosUsuarioEjmeplo = {
    name: "TestKarim",
    user: "josekarim1111",
    password: "abcdef1111"
  };

  datos: any[] = [];
  


  constructor(private authService: AuthService, private router: Router, private userService: UserService) {}
  onLogin(): void {
    const isAuthenticated = this.authService.login(this.username, this.password);

    if (isAuthenticated) {
      this.router.navigate(['/home']);
    } else {
      this.error = 'Usuario o contraseña incorrectos';
    }
  }*/

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private userService: UserService,
    private configsService: ConfigsService
  ) {
    if (this.authService.isAuthenticated())
      this.router.navigate(["/c/home"])
    this.loginForm = this.fb.group({
      email: ['admin@admin.com', [Validators.required, Validators.email]],
      password: ['admin', Validators.required]
    });

  }

  onSubmit(): void {
    if (this.loginForm.valid) {
      const { email, password } = this.loginForm.value;
      this.authService.login(email, password).subscribe({
        next: () => {
          // this.userService.getOneUserEmail(email).subscribe({
          //   next: (user) => {
          //     var new_config: ConfigCreate = {
          //     "user_id": user.id,
          //     "auto": true,
          //     "sonido": "/assets/sounds/alert_sound.mp3",
          //     "notif": true
          //     }
          //     this.configsService.updateConfig("685e9a03bf4ad310a1658d99", new_config).subscribe({
          //       next: () =>
          //         this.router.navigate(['/c/home']),
          //       error: (e) => alert("error updating config: " + e)
          //     })
          //   },
          //   error: (e) => alert("error getting user: " + e)
          // })
          this.router.navigate(['/c/home'])
        },
        error: (e) => {
          console.log("Error:", e);
          this.errorMessage = 'Invalid email or password';
          console.error('email:', email, '\ncontra:', password)
          console.error('\nLogin error:', e);
        }
      });
      /*
      this.authService.login_not_safe(email, password).subscribe({
        next: (data) => {
          console.log(data);
          if(data.password === password)
            this.router.navigate(["/home"]);
          else
            alert("Email o contraseña incorrecta");
        },
        error: (e) =>{
          console.log('error:::', e);
          alert(" e: " + email + " c: " + password);
          console.log("ELSEEeeeee", e);
        }
    });*/
    
    }
  }


  goToRegister(): void {
    this.router.navigate(['/s/register']);
  }

  getUsers() {
    this.userService.getUsers().subscribe({
      next: (data) => {
        console.log(data);

      },
      error: (e) =>{
        console.log('error:::', e);
      }
    })
  }


  /*getOneUser() {
    console.log(this.userService.getOneUser("68186bc160d638a696705cfe"));
  }*/

  /*
  getUsuarios(){
    this.usuarioService.getUsuarios().subscribe((data: Usuario[]) => {
      this.usuarios=data;
    });
  }
  */

  /*getUsers2() {
    console.log('Hola')
    this.userService.getData().subscribe((data: UserModel[]) => {
      console.log('Datos usuarios: ', data);
    });
  }*/

  /*createUser() {
    this.userService.createUser(this.datosUsuarioEjmeplo).subscribe({
      next: (r) => {
        console.log('Usuario creado:', r);
        //this.router.navigate(['/dashboard']); // Redirige después del registro
      },
      error: (e) => {
        console.error('Error al crear usuario:', e);
      }
    });
    
  }
    //this.userService.getUsers();*/

}

