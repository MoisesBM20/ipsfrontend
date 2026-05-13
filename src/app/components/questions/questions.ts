import { Component } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-questions',
  imports: [CommonModule, MatIconModule],
  templateUrl: './questions.html',
  styleUrl: './questions.scss'
})
export class Questions {
faqs = [
  {
    pregunta: '¿Cómo puedo solicitar un servicio de enfermería a domicilio?',
    respuesta: 'Puedes contactarnos a través del formulario de contacto o llamando al número de atención para agendar tu servicio.',
    open: false
  },
  {
    pregunta: '¿Cuáles son los horarios de atención?',
    respuesta: 'Nuestro horario de atención es de lunes a sábado de 8:00 a.m. a 6:00 p.m.',
    open: false
  },
  {
    pregunta: '¿Qué tipo de servicios prestan?',
    respuesta: 'Ofrecemos servicios de salud domiciliaria como enfermería, terapias respiratorias, y seguimiento médico.',
    open: false
  },
  {
    pregunta: '¿Atienden emergencias?',
    respuesta: 'No. Nuestro servicio es programado. Para emergencias médicas, dirígete al centro de salud más cercano.',
    open: false
  }
];

toggleFaq(index: number): void {
  this.faqs[index].open = !this.faqs[index].open;
}

}
