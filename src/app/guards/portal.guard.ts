import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const portalGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const user = auth.currentUser();
  if (user) {
    return user.role === 'paciente' ? true : router.createUrlTree(['/admin/login']);
  }

  if (!auth.getToken()) return router.createUrlTree(['/admin/login']);

  return auth.fetchMe().pipe(
    map((u) => u.role === 'paciente' ? true : router.createUrlTree(['/admin/login'])),
    catchError(() => of(router.createUrlTree(['/admin/login']))),
  );
};
