import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

// --- Angular Material ---
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';

interface Slide {
  url: string;
  alt: string;
  description: string;
}

@Component({
  selector: 'app-hero',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatCardModule, MatIconModule, MatListModule, RouterModule],
  templateUrl: './hero.html',
  styleUrls: ['./hero.scss']
})
export class Hero implements OnInit, OnDestroy {
  slides: Slide[] = [
    {
      url: 'https://images.unsplash.com/photo-1607746882042-944635dfe10e?q=80&w=800&auto=format&fit=crop',
      alt: 'Enfermería a domicilio',
      description: 'Cuidados expertos en tu hogar'
    },
    {
      url: 'https://images.unsplash.com/photo-1551076805-e1869033e561?q=80&w=800&auto=format&fit=crop',
      alt: 'Consulta médica familiar',
      description: 'Atención integral sin desplazamientos.'
    },
    {
      url: 'https://images.unsplash.com/photo-1629904853716-f0bc54eea481?q=80&w=800&auto=format&fit=crop',
      alt: 'Terapia física',
      description: 'Rehabilitación para adultos mayores.'
    },
    {
      url: 'https://images.unsplash.com/photo-1607746882042-944635dfe10e?q=80&w=800&auto=format&fit=crop',
      alt: 'Doctora sonriendo',
      description: 'Profesionalismo y calidez humana.'
    },
    {
      url: 'https://images.unsplash.com/photo-1607746882042-944635dfe10e?q=80&w=800&auto=format&fit=crop',
      alt: 'Visita médica',
      description: 'Especialistas en tu hogar.'
    },
    {
      url: 'https://images.unsplash.com/photo-1607746882042-944635dfe10e?q=80&w=800&auto=format&fit=crop',
      alt: 'Paciente sonriente',
      description: 'Tu bienestar es nuestra prioridad.'
    }
  ];

  currentIndex = 0;
  itemsPerSlide = 3;
  autoSlideInterval: any;
  showModal = false;
  selectedSlide: Slide | null = null;

  get totalSlides(): number {
    return Math.ceil(this.slides.length / this.itemsPerSlide);
  }

  ngOnInit(): void {
    this.startAutoSlide();
  }

  ngOnDestroy(): void {
    clearInterval(this.autoSlideInterval);
  }

  startAutoSlide(): void {
    this.autoSlideInterval = setInterval(() => this.goToNext(), 3000);
  }

  goToPrevious(): void {
    if (this.currentIndex > 0) {
      this.currentIndex--;
    } else {
      this.currentIndex = this.totalSlides - 1;
    }
  }

  goToNext(): void {
    this.currentIndex = (this.currentIndex + 1) % this.totalSlides;
  }

  openModal(slide: Slide): void {
    this.selectedSlide = slide;
    this.showModal = true;
    document.body.style.overflow = 'hidden';
  }

  closeModal(): void {
    this.showModal = false;
    this.selectedSlide = null;
    document.body.style.overflow = 'auto';
  }
}
