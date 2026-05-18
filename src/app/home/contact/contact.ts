import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import emailjs from '@emailjs/browser';
import { I18nService } from '../../core/services/i18n.service';
import { ScrollRevealDirective } from '../../core/directives/scroll-reveal.directive';

// TODO: replace with your EmailJS credentials
const EMAILJS_SERVICE_ID = 'service_xd827el';
const EMAILJS_TEMPLATE_ID = 'template_wc5657i';
const EMAILJS_PUBLIC_KEY = 'user_EelcXR1O2dtBCcKFTmS2V';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [ReactiveFormsModule, ScrollRevealDirective],
  templateUrl: './contact.html',
  styleUrl: './contact.scss',
})
export class ContactComponent {
  protected readonly i18n = inject(I18nService);
  protected readonly submitted = signal(false);
  protected readonly submitting = signal(false);
  protected readonly submitError = signal('');

  protected readonly form = inject(FormBuilder).nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    company: [''],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', Validators.required],
    type: ['', Validators.required],
    vehicle: ['', Validators.required],
    message: [''],
    gdpr: [false, Validators.requiredTrue],
  });

  protected fieldError(field: string): boolean {
    const ctrl = this.form.get(field);
    return !!(ctrl?.invalid && ctrl.touched);
  }

  protected async onSubmit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.submitting.set(true);
    this.submitError.set('');

    try {
      await emailjs.send(
        EMAILJS_SERVICE_ID,
        EMAILJS_TEMPLATE_ID,
        {
          from_name: this.form.value.name,
          company: this.form.value.company,
          reply_to: this.form.value.email,
          phone: this.form.value.phone,
          type: this.form.value.type,
          vehicle: this.form.value.vehicle,
          message: this.form.value.message,
        },
        EMAILJS_PUBLIC_KEY,
      );
      this.submitted.set(true);
    } catch {
      this.submitError.set(
        'A apărut o eroare. Vă rugăm să încercați din nou sau să ne contactați telefonic.',
      );
    } finally {
      this.submitting.set(false);
    }
  }
}
