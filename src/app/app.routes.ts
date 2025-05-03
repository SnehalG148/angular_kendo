import { Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { LeadheaderComponent } from './leadheader/leadheader.component';

export const routes: Routes = [
  { path: 'home', component: HomeComponent },
  { path: 'leadheader', component:LeadheaderComponent},
  { path: '', redirectTo: 'home', pathMatch: 'full' }, // ✅ Redirect empty path to /home
];
