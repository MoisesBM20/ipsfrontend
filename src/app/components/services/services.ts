import { Component } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatListModule } from '@angular/material/list';

@Component({
  selector: 'app-services',
  standalone: true, // <-- Esto es importante si usas standalone components
  imports: [MatCardModule, MatButtonModule, MatIconModule, CommonModule, RouterModule, MatListModule],
  templateUrl: './services.html',
  styleUrl: './services.scss'
})
export class Services {}
