import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService, AuditLog } from '../../services/api.service';

@Component({
  selector: 'app-audit',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './audit.html',
  styleUrl: './audit.scss',
})
export class AuditComponent implements OnInit {
  private api = inject(ApiService);

  logs = signal<AuditLog[]>([]);
  loading = signal(true);
  filterSearch = '';
  filterEntityType = '';

  entityTypes = [
    { value: '', label: 'Todos' },
    { value: 'cita', label: 'Citas' },
    { value: 'historia_clinica', label: 'Historias Clínicas' },
    { value: 'paciente', label: 'Pacientes' },
    { value: 'usuario', label: 'Usuarios' },
    { value: 'sesion', label: 'Sesiones' },
  ];

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading.set(true);
    this.api.getAuditLogs({
      search: this.filterSearch.trim() || undefined,
      entity_type: this.filterEntityType || undefined,
    }).subscribe({
      next: (data) => { this.logs.set(data); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  clearFilters(): void {
    this.filterSearch = '';
    this.filterEntityType = '';
    this.load();
  }

  actionLabel(action: string): string {
    const m: Record<string, string> = {
      crear: 'Crear', actualizar: 'Actualizar', cancelar: 'Cancelar',
      atender: 'Atender', abrir_hc: 'Abrir HC', nueva_entrada: 'Nueva Entrada',
      inicio_sesion: 'Inicio sesión', registro: 'Registro', agendar_cita: 'Agendar cita',
    };
    return m[action] ?? action;
  }

  entityLabel(type: string): string {
    const m: Record<string, string> = {
      cita: 'Cita', historia_clinica: 'HC', paciente: 'Paciente',
      usuario: 'Usuario', sesion: 'Sesión',
    };
    return m[type] ?? type;
  }

  roleLabel(role: string | null): string {
    if (!role) return '—';
    const m: Record<string, string> = {
      admin: 'Admin', doctor: 'Doctor', enfermero: 'Enfermero',
      recepcionista: 'Recepcionista', auditor: 'Auditor', paciente: 'Paciente',
    };
    return m[role] ?? role;
  }

  actionClass(action: string): string {
    const m: Record<string, string> = {
      crear: 'tag-green', atender: 'tag-blue', abrir_hc: 'tag-blue',
      nueva_entrada: 'tag-teal', actualizar: 'tag-amber', agendar_cita: 'tag-green',
      cancelar: 'tag-red', inicio_sesion: 'tag-gray', registro: 'tag-purple',
    };
    return m[action] ?? 'tag-gray';
  }
}
