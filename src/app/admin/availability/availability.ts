import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService, AvailabilitySlot, AvailabilitySlotCreate, UserSummary, DayOfWeek } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-availability',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './availability.html',
  styleUrl: './availability.scss',
})
export class AvailabilityComponent implements OnInit {
  private api = inject(ApiService);
  private auth = inject(AuthService);

  professionals = signal<UserSummary[]>([]);
  selectedProfId = signal<number>(0);
  slots = signal<AvailabilitySlot[]>([]);
  loading = signal(false);
  showForm = signal(false);
  saving = signal(false);
  formError = signal('');
  deleteError = signal('');

  form: AvailabilitySlotCreate = this.emptyForm();

  days: { value: DayOfWeek; label: string }[] = [
    { value: 'lunes',     label: 'Lunes' },
    { value: 'martes',    label: 'Martes' },
    { value: 'miercoles', label: 'Miércoles' },
    { value: 'jueves',    label: 'Jueves' },
    { value: 'viernes',   label: 'Viernes' },
    { value: 'sabado',    label: 'Sábado' },
    { value: 'domingo',   label: 'Domingo' },
  ];

  dayOrder: Record<DayOfWeek, number> = {
    lunes: 1, martes: 2, miercoles: 3, jueves: 4, viernes: 5, sabado: 6, domingo: 7,
  };

  ngOnInit(): void {
    this.api.getProfessionals().subscribe(p => {
      this.professionals.set(p);
      // Auto-seleccionar si el usuario es doctor/enfermero
      const me = this.auth.currentUser();
      if (me?.role === 'doctor' || me?.role === 'enfermero') {
        const match = p.find(x => x.id === (me as any).id);
        if (match) { this.selectedProfId.set(match.id); this.loadSlots(); }
        else if (p.length) { this.selectedProfId.set(p[0].id); this.loadSlots(); }
      } else if (p.length) {
        this.selectedProfId.set(p[0].id);
        this.loadSlots();
      }
    });
  }

  onProfChange(): void { this.loadSlots(); }

  loadSlots(): void {
    const id = this.selectedProfId();
    if (!id) return;
    this.loading.set(true);
    this.api.getAvailabilitySlots(id).subscribe({
      next: (s) => { this.slots.set(s); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  groupedSlots(): { day: DayOfWeek; label: string; slots: AvailabilitySlot[] }[] {
    const map: Partial<Record<DayOfWeek, AvailabilitySlot[]>> = {};
    for (const s of this.slots()) {
      if (!map[s.day_of_week]) map[s.day_of_week] = [];
      map[s.day_of_week]!.push(s);
    }
    return this.days
      .filter(d => map[d.value])
      .map(d => ({ day: d.value, label: d.label, slots: map[d.value]! }));
  }

  openForm(): void {
    this.form = this.emptyForm();
    this.formError.set('');
    this.showForm.set(true);
  }

  saveSlot(): void {
    if (!this.form.start_time || !this.form.end_time || !this.form.day_of_week) {
      this.formError.set('Completa todos los campos requeridos.');
      return;
    }
    this.saving.set(true);
    this.formError.set('');
    this.api.addAvailabilitySlot(this.selectedProfId(), this.form).subscribe({
      next: () => {
        this.saving.set(false);
        this.showForm.set(false);
        this.loadSlots();
      },
      error: (err) => {
        this.saving.set(false);
        this.formError.set(err.error?.detail ?? 'Error al guardar el horario.');
      },
    });
  }

  deleteSlot(slotId: number): void {
    if (!confirm('¿Deseas eliminar este horario?')) return;
    this.api.deleteAvailabilitySlot(this.selectedProfId(), slotId).subscribe({
      next: () => this.loadSlots(),
      error: () => this.deleteError.set('No se pudo eliminar el horario.'),
    });
  }

  private emptyForm(): AvailabilitySlotCreate {
    return { day_of_week: 'lunes', start_time: '08:00', end_time: '12:00', slot_duration_minutes: 30, service_type: '' };
  }
}
