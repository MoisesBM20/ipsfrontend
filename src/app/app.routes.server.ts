import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  // Rutas privadas: solo cliente (requieren token JWT, sin SSR)
  { path: 'admin',        renderMode: RenderMode.Client },
  { path: 'admin/**',     renderMode: RenderMode.Client },
  { path: 'portal',       renderMode: RenderMode.Client },
  { path: 'portal/**',    renderMode: RenderMode.Client },
  { path: 'registro',     renderMode: RenderMode.Client },
  // Rutas públicas: pre-renderizadas para SEO
  { path: '**',           renderMode: RenderMode.Prerender },
];
