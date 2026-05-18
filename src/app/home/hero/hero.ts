import { Component, DestroyRef, ElementRef, ViewChild, afterNextRender, effect, inject, signal } from '@angular/core';
import { I18nService } from '../../core/services/i18n.service';
import { ThemeService } from '../../core/services/theme.service';
import { HeroScene } from './hero-scene';

@Component({
  selector: 'app-hero',
  standalone: true,
  templateUrl: './hero.html',
  styleUrl: './hero.scss',
})
export class HeroComponent {
  protected readonly i18n = inject(I18nService);
  protected readonly themeService = inject(ThemeService);
  protected readonly sceneLoaded = signal(false);

  @ViewChild('sceneCanvas') canvasRef!: ElementRef<HTMLCanvasElement>;

  private scene: HeroScene | null = null;

  constructor() {
    const destroyRef = inject(DestroyRef);

    afterNextRender(() => {
      import('three').then(async (THREE) => {
        this.scene = new HeroScene();
        await this.scene.init(this.canvasRef.nativeElement, this.themeService.theme(), THREE);
        this.sceneLoaded.set(true);
      });
    });

    effect(() => {
      const theme = this.themeService.theme();
      this.scene?.setTheme(theme);
    });

    destroyRef.onDestroy(() => {
      this.scene?.dispose();
      this.scene = null;
    });
  }
}
