import { Routes } from '@angular/router';
import { Hero} from './components/hero/hero';
import { Bussiness } from './components/bussiness/bussiness';
import { Questions } from './components/questions/questions';
import { Pqrs } from './components/pqrs/pqrs';
import { Testimonials } from './components/testimonials/testimonials';
import { SueroterapiaComponent } from './components/sueroterapia/sueroterapia';
import { authGuard } from './guards/auth.guard';
import { portalGuard } from './guards/portal.guard';

export const routes: Routes = [
    // ── Sitio público ──────────────────────────────────────────────────────
    { path: '', component: Hero, title: 'Inicio | CUIDANDO DE TI CyE IPS SAS' },
    { path: 'services', loadComponent: () => import('./components/services/services').then(m => m.Services) },
    { path: 'bussiness', component: Bussiness },
    { path: 'question', component: Questions },
    { path: 'pqrs', component: Pqrs },
    { path: 'testimonials', component: Testimonials },
    { path: 'sueroterapia', component: SueroterapiaComponent },

    // ── Registro y portal paciente ────────────────────────────────────────
    { path: 'registro', loadComponent: () => import('./pages/registro/registro').then(m => m.RegistroComponent), title: 'Registro de Paciente' },
    { path: 'portal', loadComponent: () => import('./pages/portal/portal').then(m => m.PortalComponent), canActivate: [portalGuard], title: 'Mi portal | CUIDANDO DE TI' },

    // ── Panel administrativo ───────────────────────────────────────────────
    {
        path: 'admin',
        children: [
            {
                path: 'login',
                loadComponent: () => import('./admin/login/login').then(m => m.AdminLogin),
                title: 'Login | Panel Administrativo',
            },
            {
                path: '',
                loadComponent: () => import('./admin/shell/admin-shell').then(m => m.AdminShell),
                canActivate: [authGuard],
                children: [
                    { path: 'dashboard',    loadComponent: () => import('./admin/dashboard/dashboard').then(m => m.AdminDashboard),       title: 'Dashboard' },
                    { path: 'patients',     loadComponent: () => import('./admin/patients/patients').then(m => m.PatientsComponent),       title: 'Pacientes' },
                    { path: 'appointments', loadComponent: () => import('./admin/appointments/appointments').then(m => m.AppointmentsComponent), title: 'Citas' },
                    { path: 'availability', loadComponent: () => import('./admin/availability/availability').then(m => m.AvailabilityComponent), title: 'Disponibilidad' },
                    { path: 'users',        loadComponent: () => import('./admin/users/users').then(m => m.UsersComponent),                title: 'Empleados' },
                    { path: 'rips',         loadComponent: () => import('./admin/rips/rips').then(m => m.RipsComponent),                  title: 'RIPS' },
                    { path: 'clinical',     loadComponent: () => import('./admin/clinical/clinical').then(m => m.ClinicalComponent),        title: 'Historias Clínicas' },
                    { path: 'audit',        loadComponent: () => import('./admin/audit/audit').then(m => m.AuditComponent),                    title: 'Registro de Actividad' },
                    { path: '',             redirectTo: 'dashboard', pathMatch: 'full' },
                ],
            },
        ],
    },
];