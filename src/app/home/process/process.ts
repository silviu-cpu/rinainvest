import { Component, inject } from '@angular/core';
import { I18nService } from '../../core/services/i18n.service';
import { ScrollRevealDirective } from '../../core/directives/scroll-reveal.directive';

@Component({
  selector: 'app-process',
  standalone: true,
  imports: [ScrollRevealDirective],
  templateUrl: './process.html',
  styleUrl: './process.scss',
})
export class ProcessComponent {
  protected readonly i18n = inject(I18nService);
}
