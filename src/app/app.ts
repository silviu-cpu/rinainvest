import { Component, inject } from '@angular/core';
import { ThemeService } from './core/services/theme.service';
import { HomeComponent } from './home/home';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [HomeComponent],
  template: '<app-home />',
  styles: [':host { display: block; }'],
})
export class App {
  constructor() {
    inject(ThemeService);
  }
}
