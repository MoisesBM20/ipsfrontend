import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService, User, UserCreate, UserRole, ServiceItem } from '../../services/api.service';

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
  serviceList = signal<ServiceItem[]>([]);

  // ── Crear empleado ────────────────────────────────────────────────────────
  showForm = signal(false);
  saving = signal(false);
  formError = signal('');
  formSuccess = signal('');
  form: UserCreate = this.emptyForm();

  // ── Editar rol de empleado existente ─────────────────────────────────────
  showEdit = signal(false);
  editTarget = signal<User | null>(null);
  editSaving = signal(false);
  editError = signal('');
  editForm: { role: UserRole; specialty: string; registration_number: string } = { role: 'recepcionista', specialty: '', registration_number: '' };

  // ── Promover paciente a empleado ─────────────────────────────────────────
  showPromote = signal(false);
  promoteDoc = '';
  promoteSearching = signal(false);
  promoteFound = signal<User | null>(null);
  promoteNotFound = signal(false);
  promoteSaving = signal(false);
  promoteError = signal('');
  promoteForm: { role: UserRole; specialty: string; registration_number: string } = { role: 'recepcionista', specialty: '', registration_number: '' };

  roles: { value: UserRole; label: string }[] = [
    { value: 'admin',          label: 'Administrador' },
    { value: 'doctor',         label: 'Doctor' },
    { value: 'enfermero',      label: 'Enfermero/a' },
    { value: 'recepcionista',  label: 'Recepcionista' },
    { value: 'auditor',        label: 'Auditor' },
  ];

  ngOnInit(): void {
    this.loadUsers();
    this.api.getServices().subscribe(s => this.serviceList.set(s));
  }

  loadUsers(): void {
    this.loading.set(true);
    this.api.getUsers().subscribe({
      next: (data) => { this.users.set(data); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  // ── Crear ─────────────────────────────────────────────────────────────────
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

  // ── Editar rol ────────────────────────────────────────────────────────────
  openEdit(user: User): void {
    this.editTarget.set(user);
    this.editForm = {
      role: user.role as UserRole,
      specialty: user.specialty ?? '',
      registration_number: user.registration_number ?? '',
    };
    this.editError.set('');
    this.showEdit.set(true);
  }

  saveEdit(): void {
    const target = this.editTarget();
    if (!target) return;
    this.editSaving.set(true);
    this.editError.set('');
    this.api.updateUser(target.id, {
      role: this.editForm.role,
      specialty: this.editForm.specialty || undefined,
      registration_number: this.editForm.registration_number || undefined,
    }).subscribe({
      next: () => {
        this.editSaving.set(false);
        this.loadUsers();
        this.showEdit.set(false);
      },
      error: (err) => {
        this.editSaving.set(false);
        this.editError.set(err.error?.detail ?? 'Error al guardar cambios.');
      },
    });
  }

  // ── Promover paciente ─────────────────────────────────────────────────────
  openPromote(): void {
    this.promoteDoc = '';
    this.promoteFound.set(null);
    this.promoteNotFound.set(false);
    this.promoteError.set('');
    this.promoteForm = { role: 'recepcionista', specialty: '', registration_number: '' };
    this.showPromote.set(true);
  }

  searchPromote(): void {
    if (!this.promoteDoc.trim()) return;
    this.promoteSearching.set(true);
    this.promoteFound.set(null);
    this.promoteNotFound.set(false);
    this.promoteError.set('');
    this.api.getUserByDocument(this.promoteDoc.trim()).subscribe({
      next: (user) => {
        this.promoteSearching.set(false);
        this.promoteFound.set(user);
        this.promoteForm.role = user.role as UserRole;
        this.promoteForm.specialty = user.specialty ?? '';
        this.promoteForm.registration_number = user.registration_number ?? '';
      },
      error: () => {
        this.promoteSearching.set(false);
        this.promoteNotFound.set(true);
      },
    });
  }

  savePromote(): void {
    const user = this.promoteFound();
    if (!user) return;
    this.promoteSaving.set(true);
    this.promoteError.set('');
    this.api.updateUser(user.id, {
      role: this.promoteForm.role,
      specialty: this.promoteForm.specialty || undefined,
      registration_number: this.promoteForm.registration_number || undefined,
    }).subscribe({
      next: () => {
        this.promoteSaving.set(false);
        this.loadUsers();
        this.showPromote.set(false);
      },
      error: (err) => {
        this.promoteSaving.set(false);
        this.promoteError.set(err.error?.detail ?? 'Error al actualizar el usuario.');
      },
    });
  }

  // ── Activar / desactivar ──────────────────────────────────────────────────
  toggleActive(user: User): void {
    this.api.toggleUserActive(user.id, !user.is_active).subscribe(() => this.loadUsers());
  }

  roleLabel(role: string): string {
    return this.roles.find(r => r.value === role)?.label
      ?? (role.charAt(0).toUpperCase() + role.slice(1));
  }

  roleBadgeClass(role: string): string {
    const m: Record<string, string> = {
      admin: 'badge-purple', doctor: 'badge-blue', enfermero: 'badge-green',
      recepcionista: 'badge-amber', auditor: 'badge-gray', paciente: 'badge-orange',
    };
    return m[role] ?? 'badge-gray';
  }

  private emptyForm(): UserCreate {
    return { email: '', password: '', full_name: '', document_number: '', phone: '', role: 'recepcionista', specialty: '', registration_number: '' };
  }
}
