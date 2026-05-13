import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-admin-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class AdminLogin {
  private auth = inject(AuthService);
  private router = inject(Router);

  email = '';
  password = '';
  showPassword = signal(false);
  loading = signal(false);
  errorMsg = signal('');

  onSubmit(): void {
    if (!this.email || !this.password) {
      this.errorMsg.set('Por favor ingresa tu email y contraseña.');
      return;
    }

    this.loading.set(true);
    this.errorMsg.set('');

    this.auth.login(this.email, this.password).subscribe({
      next: (res) => {
        if (res.role === 'paciente') {
          this.router.navigate(['/portal']);
        } else {
          this.router.navigate(['/admin/dashboard']);
        }
      },
      error: (err) => {
        this.loading.set(false);
        if (err.status === 401) {
          this.errorMsg.set('Email o contraseña incorrectos.');
        } else if (err.status === 403) {
          this.errorMsg.set('Tu cuenta está inactiva. Contacta al administrador.');
        } else {
          this.errorMsg.set('Error de conexión. Verifica que el servidor esté activo.');
        }
      },
    });
  }

  togglePassword(): void {
    this.showPassword.update((v) => !v);
  }
}
