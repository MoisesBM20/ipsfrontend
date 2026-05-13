import { Component, inject, signal } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { filter } from 'rxjs/operators';
import { AuthService } from '../../services/auth.service';
import { ApiService } from '../../services/api.service';

interface NavItem {
  icon: string;
  label: string;
  route: string;
  roles: string[];
}

@Component({
  selector: 'app-admin-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule, FormsModule],
  templateUrl: './admin-shell.html',
  styleUrl: './admin-shell.scss',
})
export class AdminShell {
  auth = inject(AuthService);
  private api  = inject(ApiService);
  private router = inject(Router);

  sidebarOpen  = signal(true);
  currentTitle = signal('Dashboard');

  // ── Modal de perfil ───────────────────────────────────────────────────────
  showProfile   = signal(false);
  profileTab    = signal<'info' | 'password'>('info');
  profileSaving = signal(false);
  profileMsg    = signal('');
  profileError  = signal('');

  profileForm = { full_name: '', phone: '', email: '' };
  pwForm = { current_password: '', new_password: '', confirm: '' };

  navItems: NavItem[] = [
    { icon: 'dashboard',       label: 'Dashboard',         route: '/admin/dashboard',     roles: ['admin','doctor','enfermero','recepcionista','auditor'] },
    { icon: 'calendar_month',  label: 'Citas',             route: '/admin/appointments',  roles: ['admin','doctor','enfermero','recepcionista'] },
    { icon: 'people',          label: 'Pacientes',         route: '/admin/patients',      roles: ['admin','doctor','enfermero','recepcionista'] },
    { icon: 'folder_open',     label: 'Historias Clínicas',route: '/admin/clinical',      roles: ['admin','doctor','enfermero'] },
    { icon: 'schedule',        label: 'Disponibilidad',    route: '/admin/availability',  roles: ['admin','doctor','enfermero'] },
    { icon: 'manage_accounts', label: 'Empleados',         route: '/admin/users',         roles: ['admin'] },
    { icon: 'summarize',       label: 'RIPS',              route: '/admin/rips',          roles: ['admin','auditor'] },
    { icon: 'history',         label: 'Actividad',         route: '/admin/audit',         roles: ['admin','auditor'] },
  ];

  constructor() {
    this.router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe((e: NavigationEnd) => {
        const match = this.navItems.find(n => e.urlAfterRedirects.startsWith(n.route));
        if (match) this.currentTitle.set(match.label);
      });
  }

  get visibleNav(): NavItem[] {
    const role = this.auth.currentUser()?.role ?? '';
    return this.navItems.filter(n => n.roles.includes(role));
  }

  logout(): void { this.auth.logout(); }
  toggleSidebar(): void { this.sidebarOpen.update(v => !v); }

  openProfile(): void {
    const u = this.auth.currentUser();
    this.profileForm = { full_name: u?.full_name ?? '', phone: '', email: u?.email ?? '' };
    this.pwForm = { current_password: '', new_password: '', confirm: '' };
    this.profileMsg.set(''); this.profileError.set('');
    this.profileTab.set('info');
    this.showProfile.set(true);
  }

  saveProfile(): void {
    this.profileSaving.set(true); this.profileMsg.set(''); this.profileError.set('');
    this.api.updateStaffProfile(this.profileForm).subscribe({
      next: () => {
        this.profileSaving.set(false);
        this.profileMsg.set('Perfil actualizado correctamente.');
        this.auth.fetchMe().subscribe();
      },
      error: (e) => { this.profileSaving.set(false); this.profileError.set(e.error?.detail ?? 'Error al guardar.'); },
    });
  }

  savePassword(): void {
    if (this.pwForm.new_password !== this.pwForm.confirm) {
      this.profileError.set('Las contraseñas nuevas no coinciden.'); return;
    }
    if (this.pwForm.new_password.length < 6) {
      this.profileError.set('Mínimo 6 caracteres.'); return;
    }
    this.profileSaving.set(true); this.profileMsg.set(''); this.profileError.set('');
    this.api.changePassword({ current_password: this.pwForm.current_password, new_password: this.pwForm.new_password }).subscribe({
      next: () => { this.profileSaving.set(false); this.profileMsg.set('Contraseña cambiada correctamente.'); this.pwForm = { current_password: '', new_password: '', confirm: '' }; },
      error: (e) => { this.profileSaving.set(false); this.profileError.set(e.error?.detail ?? 'Error al cambiar contraseña.'); },
    });
  }

  userInitials(): string {
    const name = this.auth.currentUser()?.full_name ?? '';
    return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
  }

  roleLabel(role: string): string {
    const map: Record<string, string> = {
      admin: 'Administrador', doctor: 'Doctor', enfermero: 'Enfermero',
      recepcionista: 'Recepcionista', auditor: 'Auditor',
    };
    return map[role] ?? role;
  }
}
