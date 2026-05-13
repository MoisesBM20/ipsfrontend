import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService, Appointment, AppointmentCreate, PatientSummary, UserSummary, TimeSlot, AppointmentType, AppointmentStatus } from '../../services/api.service';

@Component({
  selector: 'app-appointments',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './appointments.html',
  styleUrl: './appointments.scss',
})
export class AppointmentsComponent implements OnInit {
  private api = inject(ApiService);
  private router = inject(Router);

  appointments = signal<Appointment[]>([]);
  loading = signal(true);

  // Filtros opcionales
  filterFrom = '';
  filterTo = '';
  filterDocument = '';

  // Nueva cita
  showForm = signal(false);
  saving = signal(false);
  formError = signal('');
  professionals = signal<UserSummary[]>([]);
  patientSearch = '';
  patientSearchResults = signal<PatientSummary[]>([]);
  selectedPatient = signal<PatientSummary | null>(null);
  availableSlots = signal<TimeSlot[]>([]);
  slotsLoading = signal(false);
  form: AppointmentCreate = this.emptyForm();

  // Cancelar
  showCancelModal = signal(false);
  cancellingId = signal<number | null>(null);
  cancelReason = '';

  // Editar / reprogramar
  showEditModal = signal(false);
  editingAppointment = signal<Appointment | null>(null);
  editProf = 0;
  editDate = '';
  editSlot = '';
  editSlots = signal<TimeSlot[]>([]);
  editSlotsLoading = signal(false);
  editError = signal('');
  editSaving = signal(false);

  appointmentTypes: { value: AppointmentType; label: string }[] = [
    { value: 'consulta_medica', label: 'Consulta médica general' },
    { value: 'enfermeria', label: 'Enfermería domiciliaria' },
    { value: 'terapia_fisica', label: 'Terapia física' },
    { value: 'nutricion', label: 'Nutrición' },
    { value: 'psicologia', label: 'Psicología' },
    { value: 'post_quirurgica', label: 'Atención post-quirúrgica' },
    { value: 'sueroterapia', label: 'Sueroterapia' },
    { value: 'seguimiento', label: 'Seguimiento / Control' },
    { value: 'urgencia', label: 'Urgencia' },
  ];

  ngOnInit(): void {
    this.loadAppointments();
    this.api.getProfessionals().subscribe(p => this.professionals.set(p));
  }

  loadAppointments(): void {
    this.loading.set(true);
    const params: any = {};
    if (this.filterDocument.trim()) params.document_number = this.filterDocument.trim();
    if (this.filterFrom) params.date_from = this.filterFrom;
    if (this.filterTo) params.date_to = this.filterTo;
    this.api.getAppointments(params).subscribe({
      next: (data) => { this.appointments.set(data); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  applyFilters(): void { this.loadAppointments(); }

  clearFilters(): void {
    this.filterFrom = ''; this.filterTo = ''; this.filterDocument = '';
    this.loadAppointments();
  }

  // ── Nueva cita ────────────────────────────────────────────────────────────────

  openForm(): void {
    this.form = this.emptyForm();
    this.selectedPatient.set(null);
    this.patientSearch = '';
    this.patientSearchResults.set([]);
    this.availableSlots.set([]);
    this.formError.set('');
    this.showForm.set(true);
  }

  searchPatients(): void {
    if (!this.patientSearch.trim()) return;
    this.api.getPatients(this.patientSearch).subscribe(r => this.patientSearchResults.set(r));
  }

  selectPatient(p: PatientSummary): void {
    this.selectedPatient.set(p);
    this.form.patient_id = p.id;
    this.patientSearchResults.set([]);
    this.patientSearch = p.first_name + ' ' + p.last_name;
  }

  onProfessionalOrDateChange(): void {
    if (this.form.professional_id && this.form.appointment_date) this.loadSlots();
  }

  loadSlots(): void {
    this.slotsLoading.set(true);
    this.availableSlots.set([]);
    this.form.start_time = '';
    this.api.getCalendar(this.form.professional_id, this.form.appointment_date, this.form.appointment_date).subscribe({
      next: (days) => {
        const day = days.find(d => d.date === this.form.appointment_date);
        this.availableSlots.set(day?.slots ?? []);
        this.slotsLoading.set(false);
      },
      error: () => this.slotsLoading.set(false),
    });
  }

  saveAppointment(): void {
    if (!this.form.patient_id || !this.form.professional_id || !this.form.appointment_date || !this.form.start_time || !this.form.appointment_type) {
      this.formError.set('Completa todos los campos requeridos.');
      return;
    }
    this.saving.set(true);
    this.formError.set('');
    this.api.createAppointment(this.form).subscribe({
      next: () => { this.saving.set(false); this.showForm.set(false); this.loadAppointments(); },
      error: (err) => { this.saving.set(false); this.formError.set(err.error?.detail ?? 'Error al agendar la cita.'); },
    });
  }

  // ── Atender ───────────────────────────────────────────────────────────────────

  atender(a: Appointment): void {
    this.api.updateAppointment(a.id, { status: 'en_atencion' }).subscribe(() => {
      this.loadAppointments();
      this.router.navigate(['/admin/clinical'], { queryParams: { patientId: a.patient_id } });
    });
  }

  // ── Cancelar ──────────────────────────────────────────────────────────────────

  openCancelModal(id: number): void {
    this.cancellingId.set(id);
    this.cancelReason = '';
    this.showCancelModal.set(true);
  }

  confirmCancel(): void {
    if (!this.cancelReason.trim()) return;
    this.api.cancelAppointment(this.cancellingId()!, this.cancelReason).subscribe({
      next: () => { this.showCancelModal.set(false); this.loadAppointments(); },
    });
  }

  // ── Editar / Reprogramar ──────────────────────────────────────────────────────

  openEditModal(a: Appointment): void {
    this.editingAppointment.set(a);
    this.editProf = a.professional_id;
    this.editDate = a.appointment_date;
    this.editSlot = a.start_time.slice(0, 5);
    this.editError.set('');
    this.editSlots.set([]);
    this.showEditModal.set(true);
    this.loadEditSlots();
  }

  loadEditSlots(): void {
    if (!this.editProf || !this.editDate) return;
    this.editSlotsLoading.set(true);
    this.editSlots.set([]);
    const apptId = this.editingAppointment()?.id;
    this.api.getCalendar(this.editProf, this.editDate, this.editDate).subscribe({
      next: (days) => {
        const day = days.find(d => d.date === this.editDate);
        let slots = day?.slots ?? [];
        // el slot actual de la cita lo marcamos como disponible visualmente
        slots = slots.map(s => s.start_time === this.editSlot ? { ...s, is_available: true } : s);
        this.editSlots.set(slots);
        this.editSlotsLoading.set(false);
      },
      error: () => this.editSlotsLoading.set(false),
    });
  }

  saveEdit(): void {
    if (!this.editProf || !this.editDate || !this.editSlot) {
      this.editError.set('Selecciona profesional, fecha y horario.');
      return;
    }
    this.editSaving.set(true);
    this.editError.set('');
    this.api.updateAppointment(this.editingAppointment()!.id, {
      professional_id: this.editProf,
      appointment_date: this.editDate,
      start_time: this.editSlot,
    }).subscribe({
      next: () => { this.editSaving.set(false); this.showEditModal.set(false); this.loadAppointments(); },
      error: (err) => { this.editSaving.set(false); this.editError.set(err.error?.detail ?? 'Error al modificar la cita.'); },
    });
  }

  // ── Helpers ───────────────────────────────────────────────────────────────────

  canAtender(a: Appointment): boolean { return ['agendada', 'confirmada'].includes(a.status); }
  canEdit(a: Appointment): boolean { return !['completada', 'cancelada', 'no_asistio'].includes(a.status); }
  canCancel(a: Appointment): boolean { return !['completada', 'cancelada', 'no_asistio'].includes(a.status); }

  statusLabel(s: string): string {
    const m: Record<string, string> = {
      agendada: 'Agendada', confirmada: 'Confirmada', completada: 'Completada',
      cancelada: 'Cancelada', en_atencion: 'En atención', no_asistio: 'No asistió', reprogramada: 'Reprogramada',
    };
    return m[s] ?? s;
  }

  statusClass(s: string): string {
    const m: Record<string, string> = {
      agendada: 'badge-blue', confirmada: 'badge-green', completada: 'badge-purple',
      cancelada: 'badge-red', en_atencion: 'badge-orange', no_asistio: 'badge-gray', reprogramada: 'badge-amber',
    };
    return m[s] ?? 'badge-gray';
  }

  typeLabel(t: string): string {
    return this.appointmentTypes.find(x => x.value === t)?.label ?? t;
  }

  today(): string { return new Date().toISOString().split('T')[0]; }

  private emptyForm(): AppointmentCreate {
    return { patient_id: 0, professional_id: 0, appointment_date: this.today(), start_time: '', appointment_type: 'consulta_medica', reason: '' };
  }
}
