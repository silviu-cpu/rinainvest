import { Component, inject } from '@angular/core';
import { I18nService } from '../../core/services/i18n.service';
import { ScrollRevealDirective } from '../../core/directives/scroll-reveal.directive';

@Component({
  selector: 'app-services-section',
  standalone: true,
  imports: [ScrollRevealDirective],
  templateUrl: './services-section.html',
  styleUrl: './services-section.scss',
})
export class ServicesSectionComponent {
  protected readonly i18n = inject(I18nService);
}
