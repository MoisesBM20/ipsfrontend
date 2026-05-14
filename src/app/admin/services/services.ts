import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService, ServiceItem } from '../../services/api.service';

@Component({
  selector: 'app-services',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './services.html',
  styleUrl: './services.scss',
})
export class ServicesComponent implements OnInit {
  private api = inject(ApiService);

  services = signal<ServiceItem[]>([]);
  loading = signal(true);

  showForm = signal(false);
  newName = '';
  saving = signal(false);
  formError = signal('');

  deleteError = signal('');

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading.set(true);
    this.api.getServices().subscribe({
      next: (data) => { this.services.set(data); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  openForm(): void {
    this.newName = '';
    this.formError.set('');
    this.showForm.set(true);
  }

  save(): void {
    const name = this.newName.trim();
    if (!name) { this.formError.set('El nombre no puede estar vacío.'); return; }
    this.saving.set(true);
    this.formError.set('');
    this.api.createService(name).subscribe({
      next: () => {
        this.saving.set(false);
        this.showForm.set(false);
        this.load();
      },
      error: (err) => {
        this.saving.set(false);
        this.formError.set(err.error?.detail ?? 'Error al crear el servicio.');
      },
    });
  }

  remove(service: ServiceItem): void {
    if (!confirm(`¿Eliminar el servicio "${service.name}"?`)) return;
    this.deleteError.set('');
    this.api.deleteService(service.id).subscribe({
      next: () => this.load(),
      error: () => this.deleteError.set('No se pudo eliminar el servicio.'),
    });
  }
}
