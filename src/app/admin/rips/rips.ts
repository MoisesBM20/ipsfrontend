import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService, RIPSReport } from '../../services/api.service';

@Component({
  selector: 'app-rips',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './rips.html',
  styleUrl: './rips.scss',
})
export class RipsComponent implements OnInit {
  private api = inject(ApiService);

  reports = signal<RIPSReport[]>([]);
  loading = signal(true);
  showForm = signal(false);
  generating = signal(false);
  formError = signal('');
  downloadingId = signal<number | null>(null);

  periodStart = '';
  periodEnd = '';
  notes = '';

  ngOnInit(): void { this.loadReports(); }

  loadReports(): void {
    this.loading.set(true);
    this.api.getRIPSReports().subscribe({
      next: (r) => { this.reports.set(r); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  openForm(): void {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
    this.periodStart = firstDay;
    this.periodEnd = lastDay;
    this.notes = '';
    this.formError.set('');
    this.showForm.set(true);
  }

  generateRIPS(): void {
    if (!this.periodStart || !this.periodEnd) {
      this.formError.set('Indica el período del reporte.');
      return;
    }
    if (this.periodEnd < this.periodStart) {
      this.formError.set('La fecha de fin debe ser posterior a la de inicio.');
      return;
    }
    this.generating.set(true);
    this.formError.set('');
    this.api.generateRIPS(this.periodStart, this.periodEnd, this.notes || undefined).subscribe({
      next: () => {
        this.generating.set(false);
        this.showForm.set(false);
        this.loadReports();
      },
      error: (err) => {
        this.generating.set(false);
        this.formError.set(err.error?.detail ?? 'Error al generar el reporte.');
      },
    });
  }

  downloadReport(id: number): void {
    this.downloadingId.set(id);
    this.api.downloadRIPS(id).subscribe({
      next: (blob) => {
        const report = this.reports().find(r => r.id === id);
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `RIPS_${report?.period_start ?? id}_${report?.period_end ?? ''}.json`;
        a.click();
        URL.revokeObjectURL(url);
        this.downloadingId.set(null);
      },
      error: () => this.downloadingId.set(null),
    });
  }

  markSubmitted(id: number): void {
    this.api.markRIPSSubmitted(id).subscribe(() => this.loadReports());
  }

  statusLabel(s: string): string {
    const m: Record<string,string> = {
      borrador:'Borrador', generado:'Generado', enviado:'Enviado', aceptado:'Aceptado', rechazado:'Rechazado',
    };
    return m[s] ?? s;
  }

  statusClass(s: string): string {
    const m: Record<string,string> = {
      borrador:'badge-gray', generado:'badge-blue', enviado:'badge-amber', aceptado:'badge-green', rechazado:'badge-red',
    };
    return m[s] ?? 'badge-gray';
  }
}
