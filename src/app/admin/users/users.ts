import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService, User, UserCreate, UserRole } from '../../services/api.service';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './users.html',
  styleUrl: './users.scss',
})
export class UsersComponent implements OnInit {
  private api = inject(ApiService);

  users = signal<User[]>([]);
  loading = signal(true);
  showForm = signal(false);
  saving = signal(false);
  formError = signal('');
  formSuccess = signal('');

  form: UserCreate = this.emptyForm();

  roles: { value: UserRole; label: string }[] = [
    { value: 'admin', label: 'Administrador' },
    { value: 'doctor', label: 'Doctor' },
    { value: 'enfermero', label: 'Enfermero/a' },
    { value: 'recepcionista', label: 'Recepcionista' },
    { value: 'auditor', label: 'Auditor' },
  ];

  ngOnInit(): void { this.loadUsers(); }

  loadUsers(): void {
    this.loading.set(true);
    this.api.getUsers().subscribe({
      next: (data) => { this.users.set(data); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  openForm(): void {
    this.form = this.emptyForm();
    this.formError.set('');
    this.formSuccess.set('');
    this.showForm.set(true);
  }

  saveUser(): void {
    if (!this.form.email || !this.form.password || !this.form.full_name || !this.form.document_number) {
      this.formError.set('Completa todos los campos obligatorios.');
      return;
    }
    this.saving.set(true);
    this.formError.set('');
    this.api.createUser(this.form).subscribe({
      next: () => {
        this.saving.set(false);
        this.formSuccess.set('Empleado creado correctamente.');
        this.loadUsers();
        setTimeout(() => this.showForm.set(false), 1200);
      },
      error: (err) => {
        this.saving.set(false);
        this.formError.set(err.error?.detail ?? 'Error al crear el empleado.');
      },
    });
  }

  toggleActive(user: User): void {
    this.api.toggleUserActive(user.id, !user.is_active).subscribe(() => this.loadUsers());
  }

  roleLabel(role: string): string {
    const found = this.roles.find(r => r.value === role)?.label;
    if (found) return found;
    return role.charAt(0).toUpperCase() + role.slice(1);
  }

  roleBadgeClass(role: string): string {
    const m: Record<string,string> = {
      admin:'badge-purple', doctor:'badge-blue', enfermero:'badge-green',
      recepcionista:'badge-amber', auditor:'badge-gray',
    };
    return m[role] ?? 'badge-gray';
  }

  private emptyForm(): UserCreate {
    return { email: '', password: '', full_name: '', document_number: '', phone: '', role: 'recepcionista', specialty: '', registration_number: '' };
  }
}
