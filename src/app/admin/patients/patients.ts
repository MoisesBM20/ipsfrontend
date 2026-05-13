import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService, PatientSummary, Patient, PatientCreate, DocumentType, Gender, BLOOD_TYPE_LABEL } from '../../services/api.service';

@Component({
  selector: 'app-patients',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './patients.html',
  styleUrl: './patients.scss',
})
export class PatientsComponent implements OnInit {
  private api = inject(ApiService);
  private router = inject(Router);

  patients = signal<PatientSummary[]>([]);
  loading = signal(true);
  searchTerm = '';
  showForm = signal(false);
  saving = signal(false);
  formError = signal('');
  formSuccess = signal('');
  form: PatientCreate = this.emptyForm();

  // Modal de detalle / edición del paciente
  detailPatient = signal<Patient | null>(null);
  detailLoading = signal(false);
  showDetail = signal(false);
  showCloseConfirm = signal(false);
  detailTab = signal<'info' | 'basic' | 'extra'>('info');
  editSaving = signal(false);
  editError = signal('');
  editBasic: Partial<PatientCreate> = {};
  editExtra: Partial<PatientCreate> = {};

  documentTypes: { value: DocumentType; label: string }[] = [
    { value: 'CC', label: 'Cédula de ciudadanía' },
    { value: 'TI', label: 'Tarjeta de identidad' },
    { value: 'CE', label: 'Cédula de extranjería' },
    { value: 'PA', label: 'Pasaporte' },
    { value: 'RC', label: 'Registro civil' },
    { value: 'MS', label: 'Menor sin identificación' },
  ];

  genders: { value: Gender; label: string }[] = [
    { value: 'M', label: 'Masculino' },
    { value: 'F', label: 'Femenino' },
    { value: 'I', label: 'Indeterminado' },
  ];

  ngOnInit(): void { this.loadPatients(); }

  loadPatients(): void {
    this.loading.set(true);
    this.api.getPatients(this.searchTerm || undefined).subscribe({
      next: (data) => { this.patients.set(data); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  onSearch(): void { this.loadPatients(); }

  // ── Nuevo paciente ────────────────────────────────────────────────────────────

  openForm(): void {
    this.form = this.emptyForm();
    this.formError.set('');
    this.formSuccess.set('');
    this.showForm.set(true);
  }

  closeForm(): void { this.showForm.set(false); }

  savePatient(): void {
    if (!this.form.document_number || !this.form.first_name || !this.form.last_name || !this.form.birth_date) {
      this.formError.set('Completa los campos obligatorios: documento, nombres, apellidos y fecha de nacimiento.');
      return;
    }
    this.saving.set(true);
    this.formError.set('');
    this.api.createPatient(this.form).subscribe({
      next: () => {
        this.saving.set(false);
        this.formSuccess.set('Paciente registrado correctamente.');
        this.loadPatients();
        setTimeout(() => this.showForm.set(false), 1200);
      },
      error: (err) => {
        this.saving.set(false);
        this.formError.set(err.error?.detail ?? 'Error al registrar el paciente.');
      },
    });
  }

  // ── Panel de detalle ──────────────────────────────────────────────────────────

  openDetail(summary: PatientSummary): void {
    this.showDetail.set(true);
    this.detailTab.set('info');
    this.detailLoading.set(true);
    this.editError.set('');
    this.api.getPatient(summary.id).subscribe({
      next: (p) => { this.detailPatient.set(p); this.detailLoading.set(false); },
      error: () => this.detailLoading.set(false),
    });
  }

  closeDetail(): void {
    if (this.detailTab() !== 'info') {
      this.showCloseConfirm.set(true);
      return;
    }
    this._doClose();
  }

  confirmClose(): void {
    this.showCloseConfirm.set(false);
    this._doClose();
  }

  private _doClose(): void {
    this.showDetail.set(false);
    this.detailPatient.set(null);
    this.detailTab.set('info');
    this.editError.set('');
  }

  goToTab(tab: 'info' | 'basic' | 'extra'): void {
    const p = this.detailPatient();
    if (!p) return;
    this.detailTab.set(tab);
    this.editError.set('');
    if (tab === 'basic') {
      this.editBasic = {
        document_type: p.document_type, document_number: p.document_number,
        first_name: p.first_name, last_name: p.last_name,
        birth_date: p.birth_date, gender: p.gender, blood_type: p.blood_type ?? '',
        phone: p.phone ?? '', email: p.email ?? '', address: p.address ?? '', city: p.city ?? 'Cali',
      };
    }
    if (tab === 'extra') {
      this.editExtra = {
        eps: p.eps ?? '', regime: p.regime ?? '',
        allergies: p.allergies ?? '', background_notes: p.background_notes ?? '',
        emergency_contact_name: p.emergency_contact_name ?? '',
        emergency_contact_phone: p.emergency_contact_phone ?? '',
        emergency_contact_relationship: p.emergency_contact_relationship ?? '',
      };
    }
  }

  saveBasic(): void {
    const p = this.detailPatient();
    if (!p) return;
    this.editSaving.set(true);
    this.editError.set('');
    this.api.updatePatient(p.id, this.editBasic).subscribe({
      next: (updated) => {
        this.editSaving.set(false);
        this.detailPatient.set(updated);
        this.detailTab.set('info');
        this.loadPatients();
      },
      error: (err) => {
        this.editSaving.set(false);
        this.editError.set(err.error?.detail ?? 'Error al guardar.');
      },
    });
  }

  saveExtra(): void {
    const p = this.detailPatient();
    if (!p) return;
    this.editSaving.set(true);
    this.editError.set('');
    this.api.updatePatient(p.id, this.editExtra).subscribe({
      next: (updated) => {
        this.editSaving.set(false);
        this.detailPatient.set(updated);
        this.detailTab.set('info');
      },
      error: (err) => {
        this.editSaving.set(false);
        this.editError.set(err.error?.detail ?? 'Error al guardar.');
      },
    });
  }

  goToClinical(): void {
    const p = this.detailPatient();
    if (!p) return;
    this._doClose();
    this.router.navigate(['/admin/clinical'], {
      queryParams: { patientId: p.id, name: `${p.first_name} ${p.last_name}`, doc: p.document_number }
    });
  }

  bloodTypeLabel(bt: string | null): string {
    if (!bt) return '—';
    return BLOOD_TYPE_LABEL[bt as keyof typeof BLOOD_TYPE_LABEL] ?? bt;
  }

  calcAge(birthDate: string): number {
    const diff = Date.now() - new Date(birthDate).getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
  }

  private emptyForm(): PatientCreate {
    return {
      document_type: 'CC', document_number: '', first_name: '', last_name: '',
      birth_date: '', gender: 'M', blood_type: '', phone: '', email: '',
      address: '', city: 'Cali', eps: '', regime: '',
      allergies: '', background_notes: '',
      emergency_contact_name: '', emergency_contact_phone: '', emergency_contact_relationship: '',
    };
  }
}
