import { Component, inject, PLATFORM_ID, signal } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { Navbar } from './layout/navbar/navbar';
import { Footer } from './layout/footer/footer';
import { CommonModule } from '@angular/common';
import { filter } from 'rxjs/operators';
import { isPlatformBrowser } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, MatIconModule, Navbar, Footer, CommonModule],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class AppComponent {
  title = 'IPSWEB';

  /** Ocultar navbar/footer en rutas del panel administrativo */
  isAdminRoute = signal(false);

  constructor(private router: Router) {
    const platformId = inject(PLATFORM_ID);
    const isBrowser = isPlatformBrowser(platformId);

    // Detectar si estamos en una ruta admin
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        const url = event.urlAfterRedirects;
        const isAdmin = url.startsWith('/admin') || url.startsWith('/portal') || url.startsWith('/registro');
        this.isAdminRoute.set(isAdmin);
        if (isBrowser) {
          document.body.classList.toggle('is-admin-route', isAdmin);
        }
      });

    if (isBrowser) {
      // Scroll al top en cada navegación
      this.router.events
        .pipe(filter(event => event instanceof NavigationEnd))
        .subscribe(() => {
          window.scrollTo({ top: 0, behavior: 'auto' });
        });

      // Lógica de Typebot
      this.initTypebot();
    }
  }

  private initTypebot() {
    const typebotInitScript = document.createElement("script");
    typebotInitScript.type = "module";
    typebotInitScript.innerHTML = `import Typebot from 'https://cdn.jsdelivr.net/npm/@typebot.io/js@0/dist/web.js'

Typebot.initBubble({
  typebot: "customer-support-igk60g0",
  apiHost: "http://51.79.55.23:9091",
  previewMessage: { message: "¿Tienes alguna pregunta! " },
  theme: {
    placement: "left",
    button: { backgroundColor: "#4A8BB2", size: "large" },
    chatWindow: { backgroundColor: "#F8F8F8" },
  },
});
`;
    document.body.append(typebotInitScript);
  }
}