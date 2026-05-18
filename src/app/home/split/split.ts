import { Component, inject } from '@angular/core';
import { I18nService } from '../../core/services/i18n.service';
import { ScrollRevealDirective } from '../../core/directives/scroll-reveal.directive';

@Component({
  selector: 'app-split',
  standalone: true,
  imports: [ScrollRevealDirective],
  templateUrl: './split.html',
  styleUrl: './split.scss',
})
export class SplitComponent {
  protected readonly i18n = inject(I18nService);
}
