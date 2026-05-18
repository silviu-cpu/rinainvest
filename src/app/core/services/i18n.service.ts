import { Injectable, computed, signal } from '@angular/core';
import type { SiteCopy } from '../../i18n/copy.types';
import { EN } from '../../i18n/en';
import { RO } from '../../i18n/ro';

const COPY: Record<'ro' | 'en', SiteCopy> = { ro: RO, en: EN };

@Injectable({ providedIn: 'root' })
export class I18nService {
  private readonly STORAGE_KEY = 'rina-lang';

  readonly lang = signal<'ro' | 'en'>(
    (localStorage.getItem(this.STORAGE_KEY) as 'ro' | 'en') ?? 'ro',
  );

  readonly t = computed(() => COPY[this.lang()]);

  toggle(): void {
    this.lang.update((l) => (l === 'ro' ? 'en' : 'ro'));
    localStorage.setItem(this.STORAGE_KEY, this.lang());
    document.documentElement.setAttribute('lang', this.lang());
  }
}
