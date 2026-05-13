import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ApiService, PatientRegisterRequest, DocumentType, Gender, BloodType } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-registro',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './registro.html',
  styleUrl: './registro.scss',
})
export class RegistroComponent {
  private api = inject(ApiService);
  private auth = inject(AuthService);
  private router = inject(Router);

  loading = signal(false);
  errorMsg = signal('');
  step = signal<'form' | 'success'>('form');

  form: PatientRegisterRequest & { password_confirm: string } = {
    full_name: '', email: '', password: '', password_confirm: '',
    document_type: 'CC', document_number: '', birth_date: '',
    gender: 'M', blood_type: 'UNKNOWN',
    phone: '', address: '', city: 'Cali', eps: '', regime: '',
  };

  documentTypes: { value: DocumentType; label: string }[] = [
    { value: 'CC', label: 'Cédula de ciudadanía' },
    { value: 'TI', label: 'Tarjeta de identidad' },
    { value: 'CE', label: 'Cédula de extranjería' },
    { value: 'PA', label: 'Pasaporte' },
  ];

  genders: { value: Gender; label: string }[] = [
    { value: 'M', label: 'Masculino' },
    { value: 'F', label: 'Femenino' },
    { value: 'I', label: 'Indeterminado' },
  ];

  bloodTypes: { value: BloodType; label: string }[] = [
    { value: 'A_POS', label: 'A+' }, { value: 'A_NEG', label: 'A-' },
    { value: 'B_POS', label: 'B+' }, { value: 'B_NEG', label: 'B-' },
    { value: 'AB_POS', label: 'AB+' }, { value: 'AB_NEG', label: 'AB-' },
    { value: 'O_POS', label: 'O+' }, { value: 'O_NEG', label: 'O-' },
    { value: 'UNKNOWN', label: 'Desconocido' },
  ];

  regimes = ['Contributivo', 'Subsidiado', 'Vinculado', 'Excepción'];

  onSubmit(): void {
    const f = this.form;
    if (!f.full_name || !f.email || !f.password || !f.document_number || !f.birth_date ||
        !f.phone || !f.address || !f.city || !f.eps || !f.regime) {
      this.errorMsg.set('Completa todos los campos obligatorios.');
      return;
    }
    if (this.form.password !== this.form.password_confirm) {
      this.errorMsg.set('Las contraseñas no coinciden.');
      return;
    }
    if (this.form.password.length < 6) {
      this.errorMsg.set('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    this.loading.set(true);
    this.errorMsg.set('');

    const { password_confirm, ...body } = this.form;
    this.api.registerPatient(body).subscribe({
      next: (res) => {
        localStorage.setItem('token', res.access_token);
        localStorage.setItem('role', res.role);
        this.auth.fetchMe().subscribe(() => {
          this.router.navigate(['/portal']);
        });
      },
      error: (err) => {
        this.loading.set(false);
        this.errorMsg.set(err.error?.detail ?? 'Error al registrarse. Intenta de nuevo.');
      },
    });
  }
}
