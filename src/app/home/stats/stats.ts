import { Component, inject } from '@angular/core';
import { I18nService } from '../../core/services/i18n.service';
import { ScrollRevealDirective } from '../../core/directives/scroll-reveal.directive';

@Component({
  selector: 'app-stats',
  standalone: true,
  imports: [ScrollRevealDirective],
  templateUrl: './stats.html',
  styleUrl: './stats.scss',
})
export class StatsComponent {
  protected readonly i18n = inject(I18nService);
}
