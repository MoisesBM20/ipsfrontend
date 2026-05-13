import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-sueroterapia',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatListModule,
    MatTooltipModule,
    RouterModule
  ],
  templateUrl: './sueroterapia.html',
  styleUrls: ['./sueroterapia.scss']
})
export class SueroterapiaComponent implements OnInit {

  categorias: any[] = [];
  patologias: any[] = [];

  ngOnInit() {
    this.cargarDatos();
  }

  // Función para mover el carrusel con los botones en PC
  scroll(container: HTMLElement, direction: 'left' | 'right') {
    const scrollAmount = 344; // Ancho de la card (320px) + gap (24px)
    if (direction === 'left') {
      container.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
    } else {
      container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  }

  private cargarDatos() {
    this.patologias = [
      { titulo: 'Obesidad', desc: 'Metabolismo celular y graso.' },
      { titulo: 'Diabetes', desc: 'Control de azúcar e insulina.' },
      { titulo: 'Ansiedad', desc: 'Bienestar del sistema nervioso.' },
      { titulo: 'Articular', desc: 'Inflamación y fibromialgia.' }
    ];

    this.categorias = [
      {
        nombre: 'Bienestar & Balance General',
        protocolos: [
          { titulo: 'Detoxificación', desc: 'Elimina toxinas y metales pesados para un hígado fuerte.', color: 'teal', icon: 'clean_hands', items: ['Glutatión', 'Vitamina C', 'Limpieza celular'] },
          { titulo: 'Energizante', desc: 'Combate el cansancio y estrés crónico aportando vitalidad.', color: 'orange', icon: 'bolt', items: ['Complejo B', 'Minerales', 'Concentración'] },
          { titulo: 'Inmunológica', desc: 'Refuerza las defensas para prevenir infecciones.', color: 'blue', icon: 'shield', items: ['Zinc y Selenio', 'Vitamina C alta', 'Resistencia'] },
          { titulo: 'Ansiedad y Distrés', desc: 'Mejora el sistema nervioso y el bienestar emocional.', color: 'indigo', icon: 'psychology', items: ['Magnesio', 'Grupo B', 'Equilibrio'] },
          { titulo: 'Aparato Digestivo', desc: 'Equilibra el sistema digestivo y mejora la absorción.', color: 'teal', icon: 'restaurant_menu', items: ['Función hepática', 'Microbiota', 'Digestión'] }
        ]
      },
      {
        nombre: 'Salud Metabólica & Crónica',
        protocolos: [
          { titulo: 'Obesidad y Peso', desc: 'Aumenta el metabolismo celular y graso.', color: 'green', icon: 'monitor_weight', items: ['Control apetito', 'Metabolismo activo', 'Circulación'] },
          { titulo: 'Diabetes Mellitus', desc: 'Nutrientes que ayudan a controlar el azúcar en sangre.', color: 'green', icon: 'opacity', items: ['Control glucémico', 'Saciedad', 'Mejora insulina'] },
          { titulo: 'Hipertensión', desc: 'Protege las paredes de los vasos y el corazón.', color: 'red', icon: 'favorite', items: ['Protección cardíaca', 'Reparación vascular', 'Glutatión'] },
          { titulo: 'Quelación', desc: 'Desintoxica el sistema circulatorio de metales pesados.', color: 'lime', icon: 'loop', items: ['Limpieza arterial', 'Triglicéridos', 'Prevención'] },
          { titulo: 'Glándula Tiroidea', desc: 'Apoyo nutricional para equilibrio hormonal.', color: 'pink', icon: 'female', items: ['Control hormonal', 'Vitalidad', 'Minerales'] }
        ]
      },
      {
        nombre: 'Estética & Recuperación',
        protocolos: [
          { titulo: 'Antiedad', desc: 'Retrasa el envejecimiento y promueve colágeno.', color: 'pink', icon: 'auto_fix_high', items: ['Antioxidantes', 'Aminoácidos', 'Elasticidad'] },
          { titulo: 'Belleza', desc: 'Potencia el brillo de piel, uñas y cabello.', color: 'purple', icon: 'face', items: ['Biotina', 'Colágeno', 'Hidratación'] },
          { titulo: 'Post-Entrenamiento', desc: 'Recuperación muscular rápida para deportistas.', color: 'red', icon: 'fitness_center', items: ['Aminoácidos', 'Electrolitos', 'Menos dolor'] },
          { titulo: 'Piel (Acné)', desc: 'Desintoxica para mejorar la textura cutánea.', color: 'orange', icon: 'health_and_safety', items: ['Control sebo', 'Cicatrización', 'Desinflamación'] },
          { titulo: 'Pre/Postquirúrgico', desc: 'Acelera la cicatrización y respuesta corporal.', color: 'blue-grey', icon: 'medical_services', items: ['Recuperación rápida', 'Menos infección', 'Cicatrización'] }
        ]
      },
      {
        nombre: 'Cuidado Especializado',
        protocolos: [
          { titulo: 'Enf. Osteoarticular', desc: 'Reduce el dolor en fibromialgia y fatiga.', color: 'blue', icon: 'accessibility_new', items: ['Control dolor', 'Modulación inmune', 'Antiinflamatorio'] },
          { titulo: 'Plasma Rico en Plaquetas', desc: 'Medicina regenerativa para reparar tejidos.', color: 'red', icon: 'bloodtype', items: ['Regeneración', 'Factores crecimiento', 'Tejidos'] },
          { titulo: 'Neoplasias', desc: 'Altas dosis de Vitamina C para proteger tejidos.', color: 'teal', icon: 'biotech', items: ['Protección celular', 'Apoyo en cáncer', 'Inmunidad'] },
          { titulo: 'Parkinson/Alzheimer', desc: 'Mejora la función cerebral y síntomas neurológicos.', color: 'purple', icon: 'psychology', items: ['Vitaminas B', 'Cognición', 'Antioxidantes'] },
          { titulo: 'Próstata/Renal', desc: 'Ayuda en la relajación y expulsión de cálculos.', color: 'teal', icon: 'medication_liquid', items: ['Desinflamación', 'Alivio renal', 'Hidratación'] },
          { titulo: 'Respiratoria', desc: 'Desinflama la vía aérea en asma y alergias.', color: 'blue', icon: 'air', items: ['Apoyo pulmonar', 'Nutrientes', 'Inmunidad'] }
        ]
      }
    ];
  }
}