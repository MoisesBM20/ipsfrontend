import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-bussiness',
  imports: [],
  templateUrl: './bussiness.html',
  styleUrl: './bussiness.scss'
})
export class Bussiness {
  
  constructor(private router: Router) {}
  
  // Método para navegar a la página de servicios
  navigateToServices() {
    this.router.navigate(['/services']);
  }
  
  // Método para agendar cita (placeholder)
  scheduleAppointment() {
    // Aquí se puede implementar la lógica para agendar citas
    console.log('Agendar cita');
    // Por ahora solo navegamos a la página de contacto
    this.router.navigate(['/pqrs']);
  }
  
  // Método para navegar al inicio
  navigateToHome() {
    this.router.navigate(['/']);
  }
}
