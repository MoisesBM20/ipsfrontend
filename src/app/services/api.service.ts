import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

const BASE = '/api';

// ── Enums ────────────────────────────────────────────────────────────────────
export type UserRole = 'admin' | 'doctor' | 'enfermero' | 'recepcionista' | 'auditor' | 'paciente';
export type DocumentType = 'CC' | 'TI' | 'CE' | 'PA' | 'RC' | 'MS' | 'AS' | 'NIT';
export type Gender = 'M' | 'F' | 'I';
export type BloodType = 'A_POS' | 'A_NEG' | 'B_POS' | 'B_NEG' | 'AB_POS' | 'AB_NEG' | 'O_POS' | 'O_NEG' | 'UNKNOWN';
export const BLOOD_TYPE_LABEL: Record<BloodType, string> = {
  A_POS: 'A+', A_NEG: 'A-', B_POS: 'B+', B_NEG: 'B-',
  AB_POS: 'AB+', AB_NEG: 'AB-', O_POS: 'O+', O_NEG: 'O-', UNKNOWN: 'Desconocido',
};
export type AppointmentStatus = 'agendada' | 'confirmada' | 'en_atencion' | 'completada' | 'cancelada' | 'no_asistio' | 'reprogramada';
export type AppointmentType = 'consulta_medica' | 'enfermeria' | 'terapia_fisica' | 'nutricion' | 'psicologia' | 'post_quirurgica' | 'sueroterapia' | 'seguimiento' | 'urgencia';
export type DayOfWeek = 'lunes' | 'martes' | 'miercoles' | 'jueves' | 'viernes' | 'sabado' | 'domingo';
export type RIPSStatus = 'borrador' | 'generado' | 'enviado' | 'aceptado' | 'rechazado';
export type EntryType = 'consulta' | 'nota_enfermeria' | 'evolucion' | 'procedimiento' | 'medicamento' | 'resultado_laboratorio' | 'imagen_diagnostica' | 'remision' | 'egreso';

// ── Interfaces ───────────────────────────────────────────────────────────────
export interface User {
  id: number; email: string; full_name: string; document_number: string;
  phone: string | null; role: UserRole; specialty: string | null;
  registration_number: string | null; is_active: boolean; created_at: string;
}
export interface UserSummary { id: number; full_name: string; role: UserRole; specialty: string | null; }
export interface UserCreate {
  email: string; password: string; full_name: string; document_number: string;
  phone?: string; role: UserRole; specialty?: string; registration_number?: string;
}

export interface PatientSummary {
  id: number; document_type: DocumentType; document_number: string;
  first_name: string; last_name: string; birth_date: string; eps: string | null; phone: string | null;
  has_appointment: boolean | null; user_id: number | null;
}
export interface PatientRegisterRequest {
  email: string; password: string; full_name: string;
  document_type: DocumentType; document_number: string;
  birth_date: string; gender: Gender; blood_type: BloodType;
  phone: string; address: string; city: string; eps: string; regime: string;
}
export interface Patient extends PatientSummary {
  gender: Gender; blood_type: string | null; email: string | null;
  address: string | null; city: string | null; regime: string | null;
  affiliate_number: string | null; emergency_contact_name: string | null;
  emergency_contact_phone: string | null; emergency_contact_relationship: string | null;
  allergies: string | null; background_notes: string | null; created_at: string;
}
export interface PatientCreate {
  document_type: DocumentType; document_number: string; first_name: string;
  last_name: string; birth_date: string; gender: Gender; blood_type?: string;
  phone?: string; email?: string; address?: string; city?: string;
  eps?: string; regime?: string; affiliate_number?: string;
  emergency_contact_name?: string; emergency_contact_phone?: string;
  emergency_contact_relationship?: string; allergies?: string; background_notes?: string;
}

export interface Appointment {
  id: number; patient_id: number; patient_name: string | null; patient_document: string | null;
  professional_id: number; professional_name: string | null;
  appointment_date: string; start_time: string; end_time: string;
  appointment_type: AppointmentType; status: AppointmentStatus;
  reason: string | null; notes: string | null; cancellation_reason: string | null; created_at: string;
}
export interface AppointmentCreate {
  patient_id: number; professional_id: number; appointment_date: string;
  start_time: string; appointment_type: AppointmentType; reason?: string; notes?: string;
}
export interface AppointmentUpdate {
  status?: AppointmentStatus; notes?: string; cancellation_reason?: string;
  professional_id?: number; appointment_date?: string; start_time?: string;
}

export interface AvailabilitySlot {
  id: number; professional_id: number; day_of_week: DayOfWeek;
  start_time: string; end_time: string; slot_duration_minutes: number;
  service_type: string | null; is_active: boolean;
}
export interface AvailabilitySlotCreate {
  day_of_week: DayOfWeek; start_time: string; end_time: string;
  slot_duration_minutes?: number; service_type?: string;
}
export interface TimeSlot { start_time: string; end_time: string; is_available: boolean; }
export interface DayAvailability {
  date: string; professional_id: number; professional_name: string; slots: TimeSlot[];
}
export interface BlockedDate { id: number; professional_id: number; blocked_date: string; reason: string | null; }

export interface VitalSigns {
  blood_pressure?: string | null;
  heart_rate?: number | null;
  respiratory_rate?: number | null;
  temperature?: number | null;
  oxygen_saturation?: number | null;
  weight?: number | null;
  height?: number | null;
  bmi?: number | null;
}

export interface ClinicalRecordSummary {
  id: number; record_number: string; patient_id: number;
  patient_name: string; patient_document: string; patient_document_type: string;
  total_entries: number; opened_at: string;
}
export interface ClinicalRecord { id: number; patient_id: number; record_number: string; opened_by: number; opened_at: string; entries: ClinicalEntry[]; }
export interface ClinicalEntry {
  id: number; clinical_record_id: number; professional_id: number; professional_name?: string;
  appointment_id: number | null; entry_type: EntryType; entry_date: string;
  reason_for_visit: string | null; anamnesis: string | null; physical_exam: string | null;
  vital_signs: string | null; diagnosis_code: string | null; diagnosis_description: string | null;
  diagnosis_type: string | null; treatment_plan: string | null; prescriptions: string | null;
  procedures_performed: string | null; referral_destination: string | null; referral_reason: string | null;
  next_appointment_notes: string | null; additional_notes: string | null; created_at: string;
}
export interface ClinicalEntryCreate {
  clinical_record_id: number; appointment_id?: number; entry_type: EntryType;
  reason_for_visit?: string; anamnesis?: string; physical_exam?: string;
  vital_signs?: VitalSigns | null;
  diagnosis_code?: string; diagnosis_description?: string; diagnosis_type?: string;
  treatment_plan?: string; prescriptions?: string; procedures_performed?: string;
  referral_destination?: string; referral_reason?: string;
  next_appointment_notes?: string; additional_notes?: string;
}

export interface RIPSReport {
  id: number; period_start: string; period_end: string; status: RIPSStatus;
  total_patients: number; total_consultations: number; total_procedures: number;
  generated_by: number; generated_at: string; submitted_at: string | null; notes: string | null;
}
export interface PublicProfessional { id: number; name: string; specialty: string | null; }
export interface PublicService {
  service_type: AppointmentType;
  display_name: string;
  description: string;
  professionals: PublicProfessional[];
}
export interface PortalBookingRequest {
  professional_id: number;
  appointment_date: string;
  start_time: string;
  appointment_type: AppointmentType;
  reason?: string;
}

export interface AuditLog {
  id: number;
  user_id: number | null;
  user_name: string | null;
  user_role: string | null;
  action: string;
  entity_type: string;
  entity_id: number | null;
  description: string;
  timestamp: string;
}

export interface DashboardStats {
  patients: { total: number; with_clinical_record: number };
  appointments: { today_total: number; today_completed: number; today_pending: number; this_week: number; by_status: Record<string, number> };
  staff: { by_role: Record<string, number> };
  upcoming_appointments: Array<{ id: number; patient_name: string; professional_name: string; date: string; time: string; type: string; status: string }>;
}

// ── Service ───────────────────────────────────────────────────────────────────
@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);

  // Dashboard
  getDashboardStats(): Observable<DashboardStats> {
    return this.http.get<DashboardStats>(`${BASE}/dashboard/stats`);
  }

  // Users  — list/create usan "/" → trailing slash; individuales no
  getUsers(role?: UserRole): Observable<User[]> {
    let params = new HttpParams();
    if (role) params = params.set('role', role);
    return this.http.get<User[]>(`${BASE}/users/`, { params });
  }
  getProfessionals(): Observable<UserSummary[]> {
    return this.http.get<UserSummary[]>(`${BASE}/users/professionals`);
  }
  createUser(body: UserCreate): Observable<User> {
    return this.http.post<User>(`${BASE}/users/`, body);
  }
  toggleUserActive(id: number, is_active: boolean): Observable<User> {
    return this.http.patch<User>(`${BASE}/users/${id}`, { is_active });
  }

  // Patients
  getPatients(search?: string): Observable<PatientSummary[]> {
    let params = new HttpParams();
    if (search) params = params.set('search', search);
    return this.http.get<PatientSummary[]>(`${BASE}/patients/`, { params });
  }
  getPatient(id: number): Observable<Patient> {
    return this.http.get<Patient>(`${BASE}/patients/${id}`);
  }
  getPatientByDocument(doc: string): Observable<Patient> {
    return this.http.get<Patient>(`${BASE}/patients/document/${doc}`);
  }
  createPatient(body: PatientCreate): Observable<Patient> {
    return this.http.post<Patient>(`${BASE}/patients/`, body);
  }
  updatePatient(id: number, body: Partial<PatientCreate>): Observable<Patient> {
    return this.http.patch<Patient>(`${BASE}/patients/${id}`, body);
  }

  // Appointments
  getAppointments(params?: { date_from?: string; date_to?: string; professional_id?: number; patient_id?: number; document_number?: string; status?: AppointmentStatus }): Observable<Appointment[]> {
    let p = new HttpParams();
    if (params?.date_from) p = p.set('date_from', params.date_from);
    if (params?.date_to) p = p.set('date_to', params.date_to);
    if (params?.professional_id) p = p.set('professional_id', params.professional_id);
    if (params?.patient_id) p = p.set('patient_id', params.patient_id);
    if (params?.document_number) p = p.set('document_number', params.document_number);
    if (params?.status) p = p.set('status', params.status);
    return this.http.get<Appointment[]>(`${BASE}/appointments/`, { params: p });
  }
  getTodayAppointments(): Observable<{ date: string; appointments: Appointment[]; total: number }> {
    return this.http.get<any>(`${BASE}/appointments/today`);
  }
  createAppointment(body: AppointmentCreate): Observable<Appointment> {
    return this.http.post<Appointment>(`${BASE}/appointments/`, body);
  }
  updateAppointment(id: number, body: AppointmentUpdate): Observable<Appointment> {
    return this.http.patch<Appointment>(`${BASE}/appointments/${id}`, body);
  }
  cancelAppointment(id: number, reason: string): Observable<any> {
    return this.http.delete(`${BASE}/appointments/${id}`, { params: { reason } });
  }

  // Availability
  getAvailabilitySlots(professionalId: number): Observable<AvailabilitySlot[]> {
    return this.http.get<AvailabilitySlot[]>(`${BASE}/availability/${professionalId}/slots`);
  }
  addAvailabilitySlot(professionalId: number, body: AvailabilitySlotCreate): Observable<AvailabilitySlot> {
    return this.http.post<AvailabilitySlot>(`${BASE}/availability/${professionalId}/slots`, body);
  }
  deleteAvailabilitySlot(professionalId: number, slotId: number): Observable<any> {
    return this.http.delete(`${BASE}/availability/${professionalId}/slots/${slotId}`);
  }
  getCalendar(professionalId: number, startDate: string, endDate: string): Observable<DayAvailability[]> {
    const params = new HttpParams().set('start_date', startDate).set('end_date', endDate);
    return this.http.get<DayAvailability[]>(`${BASE}/availability/${professionalId}/calendar`, { params });
  }
  getBlockedDates(professionalId: number): Observable<BlockedDate[]> {
    return this.http.get<BlockedDate[]>(`${BASE}/availability/${professionalId}/blocked-dates`);
  }
  blockDate(professionalId: number, date: string, reason?: string): Observable<BlockedDate> {
    return this.http.post<BlockedDate>(`${BASE}/availability/blocked-dates`, { professional_id: professionalId, blocked_date: date, reason });
  }

  // Clinical Records
  listClinicalRecords(search?: string): Observable<ClinicalRecordSummary[]> {
    let params = new HttpParams();
    if (search) params = params.set('search', search);
    return this.http.get<ClinicalRecordSummary[]>(`${BASE}/clinical-records/`, { params });
  }
  getClinicalRecord(patientId: number): Observable<ClinicalRecord> {
    return this.http.get<ClinicalRecord>(`${BASE}/clinical-records/patients/${patientId}`);
  }
  openClinicalRecord(patientId: number): Observable<ClinicalRecord> {
    return this.http.post<ClinicalRecord>(`${BASE}/clinical-records/patients/${patientId}`, {});
  }
  addClinicalEntry(body: ClinicalEntryCreate): Observable<ClinicalEntry> {
    return this.http.post<ClinicalEntry>(`${BASE}/clinical-records/entries`, body);
  }

  // Patient registration (public)
  registerPatient(body: PatientRegisterRequest): Observable<{ access_token: string; user_id: number; full_name: string; role: string }> {
    return this.http.post<any>(`${BASE}/auth/register`, body);
  }

  // Patient portal
  getMyAppointments(): Observable<Appointment[]> {
    return this.http.get<Appointment[]>(`${BASE}/portal/my-appointments`);
  }
  getMyProfile(): Observable<any> {
    return this.http.get<any>(`${BASE}/portal/me`);
  }
  updatePatientProfile(body: any): Observable<any> {
    return this.http.patch<any>(`${BASE}/portal/profile`, body);
  }
  updateStaffProfile(body: { full_name?: string; phone?: string; email?: string }): Observable<any> {
    return this.http.patch<any>(`${BASE}/auth/profile`, body);
  }
  changePassword(body: { current_password: string; new_password: string }): Observable<any> {
    return this.http.post<any>(`${BASE}/auth/change-password`, body);
  }
  bookPortalAppointment(body: PortalBookingRequest): Observable<any> {
    return this.http.post<any>(`${BASE}/portal/book-appointment`, body);
  }

  // Public (no auth)
  getPublicServices(): Observable<PublicService[]> {
    return this.http.get<PublicService[]>(`${BASE}/public/services`);
  }
  getPublicAvailability(professionalId: number, dateFrom: string, dateTo: string): Observable<DayAvailability[]> {
    const params = new HttpParams()
      .set('professional_id', professionalId)
      .set('date_from', dateFrom)
      .set('date_to', dateTo);
    return this.http.get<DayAvailability[]>(`${BASE}/public/availability`, { params });
  }

  // Audit
  getAuditLogs(params?: { search?: string; entity_type?: string; limit?: number }): Observable<AuditLog[]> {
    let p = new HttpParams();
    if (params?.search) p = p.set('search', params.search);
    if (params?.entity_type) p = p.set('entity_type', params.entity_type);
    if (params?.limit) p = p.set('limit', params.limit);
    return this.http.get<AuditLog[]>(`${BASE}/audit/logs`, { params: p });
  }

  // RIPS
  getRIPSReports(): Observable<RIPSReport[]> {
    return this.http.get<RIPSReport[]>(`${BASE}/rips/`);
  }
  generateRIPS(periodStart: string, periodEnd: string, notes?: string): Observable<RIPSReport> {
    return this.http.post<RIPSReport>(`${BASE}/rips/generate`, { period_start: periodStart, period_end: periodEnd, notes });
  }
  downloadRIPS(id: number): Observable<any> {
    return this.http.get(`${BASE}/rips/${id}/download`, { responseType: 'blob' });
  }
  markRIPSSubmitted(id: number): Observable<RIPSReport> {
    return this.http.patch<RIPSReport>(`${BASE}/rips/${id}/submit`, {});
  }
}
