import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService, DashboardStats } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class AdminDashboard implements OnInit {
  private api = inject(ApiService);
  auth = inject(AuthService);

  stats = signal<DashboardStats | null>(null);
  loading = signal(true);
  error = signal('');

  ngOnInit(): void {
    this.api.getDashboardStats().subscribe({
      next: (data) => { this.stats.set(data); this.loading.set(false); },
      error: () => { this.error.set('No se pudo cargar las estadísticas.'); this.loading.set(false); },
    });
  }

  statusLabel(s: string): string {
    const m: Record<string,string> = {
      agendada:'Agendada', confirmada:'Confirmada', completada:'Completada',
      cancelada:'Cancelada', en_atencion:'En atención', no_asistio:'No asistió',
    };
    return m[s] ?? s;
  }

  statusClass(s: string): string {
    const m: Record<string,string> = {
      agendada:'badge-blue', confirmada:'badge-green', completada:'badge-purple',
      cancelada:'badge-red', en_atencion:'badge-orange', no_asistio:'badge-gray',
    };
    return m[s] ?? 'badge-gray';
  }

  typeLabel(t: string): string {
    const m: Record<string,string> = {
      consulta_medica:'Consulta médica', enfermeria:'Enfermería', terapia_fisica:'Terapia física',
      nutricion:'Nutrición', psicologia:'Psicología', post_quirurgica:'Post-quirúrgica',
      sueroterapia:'Sueroterapia', seguimiento:'Seguimiento', urgencia:'Urgencia',
    };
    return m[t] ?? t;
  }
}
