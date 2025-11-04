import { Routes } from '@angular/router';
import { Home } from '../Features/home/home';
import { placeModalGuard } from './place-modal.guard';

export const routes: Routes = [
    { path: '', component: Home },
    {
        path: 'place/:id',
        canActivate: [placeModalGuard],
        loadComponent: () => import('../Features/place-detail/place-detail').then(m => m.PlaceDetailComponent)
    },
    {
        path: 'about',
        loadComponent: () => import('../Features/about-us/about-us').then(m => m.AboutUsComponent)
    },
    {
        path: 'rules',
        loadComponent: () => import('../Features/rules/rules').then(m => m.RulesComponent)
    },
    {
        path: 'contact',
        loadComponent: () => import('../Features/contact-us/contact-us').then(m => m.ContactUsComponent)
    },
    {
        path: 'report-bugs',
        loadComponent: () => import('../Features/report-bugs/report-bugs').then(m => m.ReportBugsComponent)
    },
    {
        path: 'toast-demo',
        loadComponent: () => import('../Shared/toast/toast-demo.component').then(m => m.ToastDemoComponent)
    }
];
