import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import {
  ApiService, ClinicalRecord, ClinicalEntry, ClinicalEntryCreate,
  EntryType, Patient, VitalSigns, ClinicalRecordSummary,
} from '../../services/api.service';

@Component({
  selector: 'app-clinical',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './clinical.html',
  styleUrl: './clinical.scss',
})
export class ClinicalComponent implements OnInit {
  private api = inject(ApiService);
  private route = inject(ActivatedRoute);

  view = signal<'list' | 'detail'>('list');

  // List
  recordList = signal<ClinicalRecordSummary[]>([]);
  listLoading = signal(true);
  listSearch = '';

  // Detail
  patientInfo = signal<Patient | null>(null);
  loading = signal(false);
  record = signal<ClinicalRecord | null>(null);
  notFound = signal(false);
  searchError = signal('');

  // Entry form
  showEntryForm = signal(false);
  showEntryCloseConfirm = signal(false);
  saving = signal(false);
  formError = signal('');
  form: ClinicalEntryCreate = this.emptyEntry();
  vitalSigns: VitalSigns = this.emptyVitals();

  entryTypes: { value: EntryType; label: string }[] = [
    { value: 'consulta',               label: 'Consulta médica' },
    { value: 'nota_enfermeria',        label: 'Nota de Enfermería' },
    { value: 'evolucion',              label: 'Evolución' },
    { value: 'procedimiento',          label: 'Procedimiento' },
    { value: 'medicamento',            label: 'Medicamento' },
    { value: 'resultado_laboratorio',  label: 'Resultado de Laboratorio' },
    { value: 'imagen_diagnostica',     label: 'Imagen Diagnóstica' },
    { value: 'remision',               label: 'Remisión' },
    { value: 'egreso',                 label: 'Egreso' },
  ];

  ngOnInit(): void {
    this.loadList();
    this.route.queryParams.subscribe(params => {
      if (params['patientId']) {
        const patientId = parseInt(params['patientId'], 10);
        this.loading.set(true);
        this.view.set('detail');
        this.api.getPatient(patientId).subscribe({
          next: (p) => { this.patientInfo.set(p); this.loadRecord(p.id); },
          error: () => { this.loading.set(false); this.searchError.set('No se encontró el paciente.'); },
        });
      }
    });
  }

  // ── Lista ─────────────────────────────────────────────────────────────────────
  loadList(): void {
    this.listLoading.set(true);
    this.api.listClinicalRecords(this.listSearch || undefined).subscribe({
      next: (data) => { this.recordList.set(data); this.listLoading.set(false); },
      error: () => this.listLoading.set(false),
    });
  }

  selectFromList(item: ClinicalRecordSummary): void {
    this.view.set('detail');
    this.searchError.set('');
    this.record.set(null);
    this.notFound.set(false);
    this.loading.set(true);
    this.api.getPatient(item.patient_id).subscribe({
      next: (p) => { this.patientInfo.set(p); this.loadRecord(p.id); },
      error: () => this.loading.set(false),
    });
  }

  backToList(): void {
    this.view.set('list');
    this.patientInfo.set(null);
    this.record.set(null);
    this.notFound.set(false);
    this.searchError.set('');
    this.loadList();
  }

  // ── Detalle ────────────────────────────────────────────────────────────────────
  loadRecord(patientId: number): void {
    this.loading.set(true);
    this.notFound.set(false);
    this.api.getClinicalRecord(patientId).subscribe({
      next: (r) => { this.record.set(r); this.loading.set(false); },
      error: (err) => { this.loading.set(false); if (err.status === 404) this.notFound.set(true); },
    });
  }

  openRecord(): void {
    const p = this.patientInfo();
    if (!p) return;
    this.loading.set(true);
    this.api.openClinicalRecord(p.id).subscribe({
      next: (r) => { this.record.set(r); this.notFound.set(false); this.loading.set(false); this.loadList(); },
      error: () => this.loading.set(false),
    });
  }

  openEntryForm(): void {
    this.form = this.emptyEntry();
    this.vitalSigns = this.emptyVitals();
    if (this.record()) this.form.clinical_record_id = this.record()!.id;
    this.formError.set('');
    this.showEntryCloseConfirm.set(false);
    this.showEntryForm.set(true);
  }

  closeEntryForm(): void {
    if (this.entryFormHasData()) {
      this.showEntryCloseConfirm.set(true);
    } else {
      this.showEntryForm.set(false);
    }
  }

  confirmCloseEntry(): void {
    this.showEntryCloseConfirm.set(false);
    this.showEntryForm.set(false);
  }

  calcBMI(): void {
    const w = this.vitalSigns.weight;
    const h = this.vitalSigns.height;
    if (w && h && h > 0) this.vitalSigns.bmi = Math.round((w / ((h / 100) ** 2)) * 10) / 10;
  }

  saveEntry(): void {
    if (!this.form.reason_for_visit?.trim()) { this.formError.set('El motivo de consulta es obligatorio.'); return; }
    const vs = this.vitalSigns;
    const hasVitals = !!(vs.blood_pressure || vs.heart_rate || vs.respiratory_rate ||
                         vs.temperature || vs.oxygen_saturation || vs.weight || vs.height);
    const payload: ClinicalEntryCreate = { ...this.form, vital_signs: hasVitals ? vs : null };
    this.saving.set(true);
    this.formError.set('');
    this.api.addClinicalEntry(payload).subscribe({
      next: () => {
        this.saving.set(false); this.showEntryForm.set(false);
        const p = this.patientInfo(); if (p) this.loadRecord(p.id);
      },
      error: (err) => { this.saving.set(false); this.formError.set(err.error?.detail ?? 'Error al guardar.'); },
    });
  }

  // ── Exportar PDF ──────────────────────────────────────────────────────────────
  exportPDF(): void {
    const patient = this.patientInfo();
    const rec = this.record();
    if (!patient || !rec) return;

    // Abrir ventana de impresión
    const win = window.open('', '_blank');
    if (win) { win.document.write(this.buildPrintHTML(patient, rec)); win.document.close(); }

    // Si el paciente tiene una cita "en atención", completarla automáticamente
    this.api.getAppointments({ patient_id: patient.id, status: 'en_atencion' }).subscribe({
      next: (apts) => {
        if (apts.length > 0) {
          this.api.updateAppointment(apts[0].id, { status: 'completada' }).subscribe({
            next: () => this.loadList(),
          });
        }
      },
    });
  }

  // ── Helpers ────────────────────────────────────────────────────────────────────
  parseVitals(entry: ClinicalEntry): VitalSigns | null {
    if (!entry.vital_signs) return null;
    try { return JSON.parse(entry.vital_signs); } catch { return null; }
  }

  entryTypeLabel(t: string): string { return this.entryTypes.find(e => e.value === t)?.label ?? t; }

  calcAge(birthDate: string): number {
    return Math.floor((Date.now() - new Date(birthDate).getTime()) / (1000 * 60 * 60 * 24 * 365.25));
  }

  calcMonths(birthDate: string): number {
    const diff = (Date.now() - new Date(birthDate).getTime()) % (365.25 * 24 * 3600 * 1000);
    return Math.floor(diff / (30.44 * 24 * 3600 * 1000));
  }

  diagnosisTypeLabel(t: string | null): string {
    if (t === 'confirmado') return 'Confirmado';
    if (t === 'impresion_diagnostica') return 'Impresión Diagnóstica';
    if (t === 'descartado') return 'Descartado';
    return t ?? '';
  }

  fmtDate(d: string): string {
    return new Date(d).toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  fmtTime(d: string): string {
    return new Date(d).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
  }

  // ── HTML del documento imprimible ─────────────────────────────────────────────
  private buildPrintHTML(patient: Patient, rec: ClinicalRecord): string {
    const age = this.calcAge(patient.birth_date);
    const months = this.calcMonths(patient.birth_date);
    const genderLabel = patient.gender === 'M' ? 'Masculino' : patient.gender === 'F' ? 'Femenino' : 'Indeterminado';
    const printDate = `${new Date().toLocaleDateString('es-CO')} ${new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}`;

    const entriesHTML = rec.entries.length === 0
      ? '<p style="text-align:center;padding:20px;color:#888;">Sin entradas registradas.</p>'
      : rec.entries.map((e, i) => this.buildEntryHTML(e, i)).join('');

    return `<!DOCTYPE html>
<html lang="es"><head>
<meta charset="UTF-8">
<title>Historia Clínica — ${patient.first_name} ${patient.last_name}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, Helvetica, sans-serif; font-size: 10pt; color: #000; background: #fff; }
  .page { max-width: 210mm; margin: 0 auto; padding: 8mm 10mm; }
  .hc-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #1a3c6e; padding-bottom: 8px; margin-bottom: 8px; }
  .brand { font-size: 13pt; font-weight: bold; color: #1a3c6e; line-height: 1.2; }
  .brand small { font-size: 8pt; font-weight: normal; color: #555; display: block; }
  .hc-center-title { text-align: center; flex: 1; }
  .hc-center-title h1 { font-size: 14pt; font-weight: bold; color: #1a3c6e; text-transform: uppercase; }
  .hc-center-title p { font-size: 10pt; color: #1a3c6e; margin-top: 2px; }
  .hc-contact { font-size: 8pt; text-align: right; color: #555; line-height: 1.6; }
  table.hc { width: 100%; border-collapse: collapse; margin-bottom: 5px; border: 1px solid #666; }
  table.hc td, table.hc th { border: 1px solid #bbb; padding: 3px 7px; font-size: 9.5pt; vertical-align: top; }
  .hdr { background: #1a3c6e; color: #fff; font-weight: bold; font-size: 10pt; text-align: center; padding: 5px 7px; text-transform: uppercase; letter-spacing: 0.5px; }
  .lbl { background: #dde6f0; font-weight: bold; white-space: nowrap; color: #1e3a5f; width: 1%; }
  .sub { background: #d0e4f5; font-weight: bold; font-size: 9.5pt; }
  .pre { white-space: pre-wrap; line-height: 1.5; min-height: 18px; font-size: 9.5pt; }
  .mono { font-family: 'Courier New', monospace; }
  .entry-sep { background: #1a3c6e; color: #fff; padding: 4px 10px; font-size: 9pt; font-weight: bold; border-top: 6px solid #fff; margin: 0; }
  .alert { color: #b91c1c; }
  .center { text-align: center; }
  .footer { font-size: 8pt; color: #777; border-top: 1px solid #ccc; padding-top: 4px; margin-top: 10px; display: flex; justify-content: space-between; }
  @page { size: A4; margin: 1cm; }
  @media print { .page { padding: 0; max-width: 100%; } }
</style>
</head>
<body onload="window.print()">
<div class="page">

<div class="hc-header">
  <div class="brand">CUIDANDO DE TI<br>CyE IPS SAS<small>Excelencia en salud a su servicio</small></div>
  <div class="hc-center-title"><h1>Historia Clínica</h1><p>N° ${rec.record_number}</p></div>
  <div class="hc-contact">Cali, Valle del Cauca<br>NIT: 900000000<br>Tel: +57 (2) 000-0000</div>
</div>

<table class="hc">
  <tr><td class="hdr" colspan="4">DATOS GENERALES</td></tr>
  <tr>
    <td class="lbl">Paciente:</td>
    <td colspan="3"><strong>${patient.first_name} ${patient.last_name}</strong></td>
  </tr>
  <tr>
    <td class="lbl">Doc. Identificación:</td>
    <td>${patient.document_type} ${patient.document_number}</td>
    <td class="lbl">N° Historia Clínica:</td>
    <td>${rec.record_number}</td>
  </tr>
  <tr>
    <td class="lbl">Fecha Nacimiento:</td>
    <td>${this.fmtDate(patient.birth_date)}</td>
    <td class="lbl">Edad:</td>
    <td><strong>${age} años ${months} meses</strong> &nbsp; Sexo Biológico: <strong>${genderLabel}</strong></td>
  </tr>
  <tr>
    <td class="lbl">Aseguradora (EPS):</td>
    <td>${this.esc(patient.eps ?? '—')}</td>
    <td class="lbl">Régimen:</td>
    <td>${this.esc(patient.regime ?? '—')}</td>
  </tr>
  <tr>
    <td class="lbl">Grupo sanguíneo:</td>
    <td>${patient.blood_type ?? '—'}</td>
    <td class="lbl">Teléfono:</td>
    <td>${patient.phone ?? '—'}</td>
  </tr>
  <tr>
    <td class="lbl">Dirección:</td>
    <td colspan="3">${this.esc(patient.address ?? '—')}${patient.city ? ', ' + this.esc(patient.city) : ''}</td>
  </tr>
  ${patient.allergies ? `<tr><td class="lbl alert">⚠ Alergias:</td><td colspan="3" class="alert">${this.esc(patient.allergies)}</td></tr>` : ''}
  ${patient.emergency_contact_name ? `<tr><td class="lbl">Contacto emergencia:</td><td colspan="3">${this.esc(patient.emergency_contact_name)}${patient.emergency_contact_phone ? ' — ' + patient.emergency_contact_phone : ''}${patient.emergency_contact_relationship ? ' (' + this.esc(patient.emergency_contact_relationship) + ')' : ''}</td></tr>` : ''}
</table>

${entriesHTML}

<div class="footer">
  <span>Paciente: ${patient.first_name} ${patient.last_name} — ${patient.document_type} ${patient.document_number}</span>
  <span>Impreso: ${printDate}</span>
</div>
</div>
</body></html>`;
  }

  private buildEntryHTML(entry: ClinicalEntry, idx: number): string {
    const fecha = this.fmtDate(entry.entry_date);
    const hora = this.fmtTime(entry.entry_date);
    const vs = this.parseVitals(entry);
    const diagType = this.diagnosisTypeLabel(entry.diagnosis_type);
    const typeLabel = this.entryTypeLabel(entry.entry_type);

    return `
<div class="entry-sep">Entrada ${idx + 1} — ${typeLabel} — ${fecha}</div>

<table class="hc">
  <tr><td class="hdr" colspan="4">ATENCIÓN CLÍNICA</td></tr>
  <tr>
    <td class="lbl">Tipo de atención:</td><td>${typeLabel}</td>
    <td class="lbl">Profesional:</td><td>${this.esc(entry.professional_name ?? '—')}</td>
  </tr>
  <tr>
    <td class="lbl">Fecha:</td><td>${fecha}</td>
    <td class="lbl">Hora:</td><td>${hora}</td>
  </tr>
</table>

${entry.reason_for_visit ? `<table class="hc"><tr><td class="sub">Motivo de consulta</td></tr><tr><td class="pre">${this.esc(entry.reason_for_visit)}</td></tr></table>` : ''}
${entry.anamnesis ? `<table class="hc"><tr><td class="sub">Anamnesis / Historia de la enfermedad actual</td></tr><tr><td class="pre">${this.esc(entry.anamnesis)}</td></tr></table>` : ''}
${entry.physical_exam ? `<table class="hc"><tr><td class="sub">OBJETIVO — Examen físico por sistemas</td></tr><tr><td class="pre">${this.esc(entry.physical_exam)}</td></tr></table>` : ''}
${entry.treatment_plan ? `<table class="hc"><tr><td class="sub">ANÁLISIS / PLAN DE MANEJO</td></tr><tr><td class="pre">${this.esc(entry.treatment_plan)}</td></tr></table>` : ''}
${entry.additional_notes ? `<table class="hc"><tr><td class="sub">Notas adicionales</td></tr><tr><td class="pre">${this.esc(entry.additional_notes)}</td></tr></table>` : ''}

<table class="hc">
  <tr>
    <td class="lbl" style="width:110px">Responsable:</td>
    <td><strong>${this.esc(entry.professional_name ?? '—')}</strong></td>
    <td class="lbl" style="width:50px">RM:</td>
    <td>—</td>
    <td class="lbl" style="width:160px">Válido como Firma Electrónica</td>
  </tr>
</table>

${vs ? `
<table class="hc">
  <tr><td class="hdr" colspan="8">Signos Vitales</td></tr>
  <tr class="center">
    <td class="lbl">PA (mmHg)</td><td class="lbl">FC (lpm)</td><td class="lbl">FR (rpm)</td><td class="lbl">Temp (°C)</td>
    <td class="lbl">SpO₂ (%)</td><td class="lbl">Peso (Kg)</td><td class="lbl">Talla (cm)</td><td class="lbl">IMC</td>
  </tr>
  <tr class="center">
    <td>${vs.blood_pressure ?? '—'}</td><td>${vs.heart_rate ?? '—'}</td><td>${vs.respiratory_rate ?? '—'}</td><td>${vs.temperature ?? '—'}</td>
    <td>${vs.oxygen_saturation ?? '—'}</td><td>${vs.weight ?? '—'}</td><td>${vs.height ?? '—'}</td><td>${vs.bmi ?? '—'}</td>
  </tr>
</table>` : ''}

${(entry.diagnosis_code || entry.diagnosis_description) ? `
<table class="hc">
  <tr><td class="hdr" colspan="4">Diagnósticos</td></tr>
  <tr><td class="lbl">Fecha</td><td class="lbl">Código CIE-10</td><td class="lbl">Descripción</td><td class="lbl">Tipo</td></tr>
  <tr><td>${fecha}</td><td>${entry.diagnosis_code ?? '—'}</td><td>${this.esc(entry.diagnosis_description ?? '—')}</td><td>${diagType}</td></tr>
</table>` : ''}

${(entry.referral_destination || entry.referral_reason) ? `
<table class="hc">
  <tr><td class="hdr" colspan="4">Remisión</td></tr>
  <tr><td class="lbl">Destino:</td><td>${this.esc(entry.referral_destination ?? '—')}</td><td class="lbl">Motivo:</td><td>${this.esc(entry.referral_reason ?? '—')}</td></tr>
</table>` : ''}

${entry.prescriptions ? `
<table class="hc">
  <tr><td class="hdr">Prescripciones / Fórmula Médica</td></tr>
  <tr><td class="pre mono">${this.esc(entry.prescriptions)}</td></tr>
</table>` : ''}`;
  }

  private esc(t: string): string {
    return t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  private entryFormHasData(): boolean {
    const f = this.form;
    const vs = this.vitalSigns;
    return !!(f.reason_for_visit?.trim() || f.anamnesis?.trim() || f.physical_exam?.trim() ||
              f.treatment_plan?.trim() || f.prescriptions?.trim() || f.additional_notes?.trim() ||
              f.diagnosis_code?.trim() || f.diagnosis_description?.trim() ||
              f.referral_destination?.trim() || f.referral_reason?.trim() ||
              vs.blood_pressure || vs.heart_rate || vs.respiratory_rate ||
              vs.temperature || vs.oxygen_saturation || vs.weight || vs.height);
  }

  private emptyEntry(): ClinicalEntryCreate {
    return {
      clinical_record_id: 0, entry_type: 'consulta',
      reason_for_visit: '', anamnesis: '', physical_exam: '',
      diagnosis_code: '', diagnosis_description: '', diagnosis_type: 'impresion_diagnostica',
      treatment_plan: '', prescriptions: '', additional_notes: '',
      referral_destination: '', referral_reason: '',
    };
  }

  private emptyVitals(): VitalSigns {
    return { blood_pressure: '', heart_rate: null, respiratory_rate: null, temperature: null, oxygen_saturation: null, weight: null, height: null, bmi: null };
  }
}
