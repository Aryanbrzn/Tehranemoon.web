import { Routes } from '@angular/router';
import { Home } from '../Features/home/home';
import { PlaceDetailComponent } from '../Features/place-detail/place-detail';

export const routes: Routes = [
    { path: '', component: Home },
    { path: 'place/:id', component: PlaceDetailComponent }
];
