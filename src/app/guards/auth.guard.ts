import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  // Usuario ya validado contra el backend en esta sesión
  if (auth.currentUser()) return true;

  // Sin token → login
  if (!auth.getToken()) return router.createUrlTree(['/admin/login']);

  // Token en localStorage pero currentUser no cargado (recarga de página) → validar con backend
  return auth.fetchMe().pipe(
    map((user) => {
      // Solo staff puede entrar al panel admin
      const staffRoles = ['admin', 'doctor', 'enfermero', 'recepcionista', 'auditor'];
      if (staffRoles.includes(user.role)) return true;
      return router.createUrlTree(['/admin/login']);
    }),
    catchError(() => of(router.createUrlTree(['/admin/login']))),
  );
};
