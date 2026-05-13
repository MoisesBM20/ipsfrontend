import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService, Appointment, PublicService, PublicProfessional, DayAvailability, TimeSlot, AppointmentType } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-portal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './portal.html',
  styleUrl: './portal.scss',
})
export class PortalComponent implements OnInit {
  private api = inject(ApiService);
  auth = inject(AuthService);
  private router = inject(Router);

  appointments = signal<Appointment[]>([]);
  loading = signal(true);
  profile = signal<any>(null);

  // Booking flow
  showBooking = signal(false);
  bookingStep = signal(1);
  services = signal<PublicService[]>([]);
  loadingServices = signal(false);
  selectedService = signal<PublicService | null>(null);
  selectedProfId = signal<number | null>(null);
  selectedDate = signal('');
  loadingSlots = signal(false);
  availableDays = signal<DayAvailability[]>([]);
  selectedSlot = signal('');
  bookingReason = '';
  booking = signal(false);
  bookingSuccess = signal<any>(null);
  bookingError = signal('');

  readonly appointmentTypeLabels: Record<string, string> = {
    consulta_medica: 'Consulta Médica', enfermeria: 'Enfermería',
    terapia_fisica: 'Terapia Física', nutricion: 'Nutrición',
    psicologia: 'Psicología', post_quirurgica: 'Post-quirúrgica',
    sueroterapia: 'Sueroterapia', seguimiento: 'Seguimiento', urgencia: 'Urgencia',
  };

  selectedProfessional = computed(() => {
    const svc = this.selectedService();
    const id = this.selectedProfId();
    return svc?.professionals.find(p => p.id === id) ?? null;
  });

  slotsForDate = computed(() => {
    const date = this.selectedDate();
    return this.availableDays().find(d => d.date === date)?.slots ?? [];
  });

  availableSlots = computed(() => this.slotsForDate().filter(s => s.is_available));

  minDate(): string {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  }

  maxDate(): string {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split('T')[0];
  }

  ngOnInit(): void {
    this.api.getMyProfile().subscribe({ next: (p) => this.profile.set(p), error: () => {} });
    this.loadAppointments();
  }

  loadAppointments(): void {
    this.loading.set(true);
    this.api.getMyAppointments().subscribe({
      next: (a) => { this.appointments.set(a); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  logout(): void { this.auth.logout(); }

  upcoming(): Appointment[] {
    const today = new Date().toISOString().split('T')[0];
    return this.appointments().filter(a =>
      a.appointment_date >= today && !['cancelada', 'completada', 'no_asistio'].includes(a.status)
    );
  }

  past(): Appointment[] {
    return this.appointments().filter(a =>
      ['cancelada', 'completada', 'no_asistio'].includes(a.status)
    );
  }

  // ── Booking flow ─────────────────────────────────────────────────────────────

  openBooking(): void {
    this.showBooking.set(true);
    this.bookingStep.set(1);
    this.selectedService.set(null);
    this.selectedProfId.set(null);
    this.selectedDate.set('');
    this.availableDays.set([]);
    this.selectedSlot.set('');
    this.bookingReason = '';
    this.bookingSuccess.set(null);
    this.bookingError.set('');

    this.loadingServices.set(true);
    this.api.getPublicServices().subscribe({
      next: (s) => { this.services.set(s); this.loadingServices.set(false); },
      error: () => this.loadingServices.set(false),
    });
  }

  closeBooking(): void { this.showBooking.set(false); }

  selectService(svc: PublicService): void {
    this.selectedService.set(svc);
    this.selectedProfId.set(svc.professionals.length === 1 ? svc.professionals[0].id : null);
  }

  goStep2(): void {
    if (!this.selectedService() || !this.selectedProfId()) return;
    this.bookingStep.set(2);
    this.selectedDate.set('');
    this.availableDays.set([]);
    this.selectedSlot.set('');
  }

  onDateChange(): void {
    const date = this.selectedDate();
    const profId = this.selectedProfId();
    if (!date || !profId) return;

    this.loadingSlots.set(true);
    this.selectedSlot.set('');
    this.api.getPublicAvailability(profId, date, date).subscribe({
      next: (days) => { this.availableDays.set(days); this.loadingSlots.set(false); },
      error: () => this.loadingSlots.set(false),
    });
  }

  selectSlot(slot: TimeSlot): void {
    if (!slot.is_available) return;
    this.selectedSlot.set(slot.start_time);
  }

  goStep3(): void {
    if (!this.selectedDate() || !this.selectedSlot()) return;
    this.bookingStep.set(3);
    this.bookingError.set('');
  }

  confirm(): void {
    const svc = this.selectedService();
    const profId = this.selectedProfId();
    const date = this.selectedDate();
    const slot = this.selectedSlot();
    if (!svc || !profId || !date || !slot) return;

    this.booking.set(true);
    this.bookingError.set('');
    this.api.bookPortalAppointment({
      professional_id: profId,
      appointment_date: date,
      start_time: slot,
      appointment_type: svc.service_type as AppointmentType,
      reason: this.bookingReason || undefined,
    }).subscribe({
      next: (res) => {
        this.booking.set(false);
        this.bookingSuccess.set(res);
        this.loadAppointments();
      },
      error: (err) => {
        this.booking.set(false);
        this.bookingError.set(err.error?.detail ?? 'Error al agendar la cita.');
      },
    });
  }

  // ── Profile editing ──────────────────────────────────────────────────────────

  showProfile   = signal(false);
  profileTab    = signal<'info' | 'password'>('info');
  profileSaving = signal(false);
  profileMsg    = signal('');
  profileError  = signal('');

  profileForm = { phone: '', email: '', address: '', city: '', eps: '', regime: '',
    emergency_contact_name: '', emergency_contact_phone: '', emergency_contact_relationship: '' };
  pwForm = { current_password: '', new_password: '', confirm: '' };

  openProfile(): void {
    const p = this.profile();
    this.profileForm = {
      phone: p?.phone ?? '', email: p?.email ?? '', address: p?.address ?? '',
      city: p?.city ?? '', eps: p?.eps ?? '', regime: p?.regime ?? '',
      emergency_contact_name: p?.emergency_contact_name ?? '',
      emergency_contact_phone: p?.emergency_contact_phone ?? '',
      emergency_contact_relationship: p?.emergency_contact_relationship ?? '',
    };
    this.pwForm = { current_password: '', new_password: '', confirm: '' };
    this.profileMsg.set(''); this.profileError.set('');
    this.profileTab.set('info');
    this.showProfile.set(true);
  }

  saveProfile(): void {
    this.profileSaving.set(true); this.profileMsg.set(''); this.profileError.set('');
    this.api.updatePatientProfile(this.profileForm).subscribe({
      next: () => {
        this.profileSaving.set(false);
        this.profileMsg.set('Perfil actualizado correctamente.');
        this.api.getMyProfile().subscribe({ next: (p) => this.profile.set(p), error: () => {} });
      },
      error: (e: any) => { this.profileSaving.set(false); this.profileError.set(e.error?.detail ?? 'Error al guardar.'); },
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
    this.api.updatePatientProfile({
      current_password: this.pwForm.current_password,
      new_password: this.pwForm.new_password,
    }).subscribe({
      next: () => {
        this.profileSaving.set(false);
        this.profileMsg.set('Contraseña cambiada correctamente.');
        this.pwForm = { current_password: '', new_password: '', confirm: '' };
      },
      error: (e: any) => { this.profileSaving.set(false); this.profileError.set(e.error?.detail ?? 'Error al cambiar contraseña.'); },
    });
  }

  // ── Labels / styles ──────────────────────────────────────────────────────────

  statusLabel(s: string): string {
    const m: Record<string, string> = {
      agendada: 'Agendada', confirmada: 'Confirmada', completada: 'Completada',
      cancelada: 'Cancelada', en_atencion: 'En atención', no_asistio: 'No asistió',
    };
    return m[s] ?? s;
  }

  statusClass(s: string): string {
    const m: Record<string, string> = {
      agendada: 'badge-blue', confirmada: 'badge-green', completada: 'badge-purple',
      cancelada: 'badge-red', en_atencion: 'badge-orange', no_asistio: 'badge-gray',
    };
    return m[s] ?? 'badge-gray';
  }

  typeLabel(t: string): string { return this.appointmentTypeLabels[t] ?? t; }

  formatDate(d: string): string {
    const [y, m, day] = d.split('-');
    return `${day}/${m}/${y}`;
  }
}
