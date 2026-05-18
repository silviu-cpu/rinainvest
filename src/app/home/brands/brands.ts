import { Component, inject } from '@angular/core';
import { I18nService } from '../../core/services/i18n.service';
import { ScrollRevealDirective } from '../../core/directives/scroll-reveal.directive';

@Component({
  selector: 'app-brands',
  standalone: true,
  imports: [ScrollRevealDirective],
  templateUrl: './brands.html',
  styleUrl: './brands.scss',
})
export class BrandsComponent {
  protected readonly i18n = inject(I18nService);
}
