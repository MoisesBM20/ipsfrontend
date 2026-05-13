import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import emailjs from 'emailjs-com';

@Component({
  selector: 'app-pqrs',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  templateUrl: './pqrs.html',
  styleUrl: './pqrs.scss'
})
export class Pqrs {
  formData = {
    nombre: '',
    email: '',
    mensaje: '',
    telefono: ''
  };

  isSubmitting = false;
  showSuccess = false;
  showError = false;

  serviceID = 'service_mltki39';
  templateID = 'template_es6hb0g';
  publicKey = 'suQaP75ZIQ1ILc_FQ';

  onSubmit(): void {
    if (!this.formData.nombre || !this.formData.email || !this.formData.mensaje) {
      this.showError = true;
      return;
    }

    this.isSubmitting = true;

    const params = {
      from_name: this.formData.nombre,
      email: this.formData.email,
      telefono: this.formData.telefono,
      message: this.formData.mensaje,
    };

    emailjs.send(this.serviceID, this.templateID, params, this.publicKey)
      .then((response) => {
        this.isSubmitting = false;
        this.showSuccess = true;
        this.resetForm();
      })
      .catch(() => {
        this.isSubmitting = false;
        this.showError = true;
      });
  }

  resetForm(): void {
    this.formData = {
      nombre: '',
      email: '',
      mensaje: '',
      telefono: ''
    };
  }

  closeModals(): void {
    this.showSuccess = false;
    this.showError = false;
  }
}
