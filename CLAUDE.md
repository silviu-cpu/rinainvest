# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm start          # dev server at http://localhost:4200 (hot reload)
npm run build      # production build → dist/
npm run watch      # dev build with watch mode
npm test           # run unit tests with Vitest via Angular CLI
npx prettier --write .   # format all files
npx prettier --check .   # check formatting without writing
```

Generate Angular artifacts:
```bash
ng generate component <name>   # creates component with .ts, .html, .scss, .spec.ts
ng generate service <name>
ng generate --help             # full list of schematics
```

## Architecture

Angular 21 standalone application (no NgModules). Entry point is [src/main.ts](src/main.ts), which bootstraps [App](src/app/app.ts) using [appConfig](src/app/app.config.ts).

**Key patterns:**
- All components use the standalone API (`imports: [...]` directly on `@Component`)
- Components default to SCSS stylesheets (configured in `angular.json`)
- Signals (`signal()`, `computed()`, `effect()`) are used for reactive state
- `afterNextRender()` is used for DOM/browser-only initialization (Three.js, etc.)
- `DestroyRef` + `onDestroy()` for cleanup instead of `ngOnDestroy`
- `inject()` function preferred over constructor injection

**TypeScript:** strict mode is fully enabled — `strict`, `noImplicitOverride`, `noImplicitReturns`, `strictTemplates`, `strictInjectionParameters`.

**Formatting:** Prettier with `printWidth: 100`, `singleQuote: true`, Angular HTML parser for `.html` files.

**Testing:** Vitest as the test runner (via `@angular/build:unit-test`). Tests use Angular's `TestBed` in `.spec.ts` files co-located with the source file they test.

## Page Structure

Single landing page. `AppComponent` is a pure shell that renders `<app-home />` and injects `ThemeService` to trigger its constructor effect.

```
src/app/
  app.ts                         ← shell (inline template, injects ThemeService)
  app.config.ts                  ← provideRouter + provideBrowserGlobalErrorListeners
  app.routes.ts                  ← empty (single-page, no routing)

  core/
    services/
      theme.service.ts           ← dark/light signal, effect() writes data-theme on <html>
      i18n.service.ts            ← lang signal, computed t() returns current SiteCopy
    directives/
      scroll-reveal.directive.ts ← IntersectionObserver → adds .revealed class

  i18n/
    copy.types.ts                ← SiteCopy interface (all section copy shapes)
    ro.ts                        ← full Romanian copy tree
    en.ts                        ← full English copy tree

  home/
    home.ts                      ← composes all sections
    nav/nav.ts                   ← fixed nav, scroll state, hamburger
    hero/
      hero.ts                    ← afterNextRender + DestroyRef for Three.js lifecycle
      hero-scene.ts              ← plain TS class, all Three.js logic, exposes init/setTheme/dispose
    stats/stats.ts
    split/split.ts               ← buy & rent cards
    brands/brands.ts
    services-section/services-section.ts
    process/process.ts
    contact/contact.ts           ← ReactiveFormsModule form + EmailJS submit
    footer/footer.ts
```

## Theming

CSS custom properties defined in [src/styles.scss](src/styles.scss) on `:root, [data-theme="dark"]` and `[data-theme="light"]`. Key tokens: `--bg`, `--bg-1/2/3`, `--fg`, `--fg-soft/mute/dim`, `--line`, `--line-strong`, `--accent`, `--accent-soft`, `--card`, `--card-hover`. Body transitions colors over `0.4s ease`.

`ThemeService` writes `data-theme` attribute on `<html>` via `effect()` and persists to `localStorage`. Theme is restored before first paint by an inline script in [src/index.html](src/index.html).

## i18n

Signal-based, no external library. `I18nService.t` is a `computed()` that returns the current `SiteCopy` object (RO or EN). Components call `i18n.t().section.field` in templates. Language is persisted to `localStorage` and `<html lang>` is updated on toggle.

## Three.js Scene

`HeroScene` in [src/app/home/hero/hero-scene.ts](src/app/home/hero/hero-scene.ts) is a plain TypeScript class (not Angular). It is lazily loaded in `HeroComponent` via `import('three')` inside `afterNextRender()` so Three.js never appears in the initial bundle. The class exposes:
- `init(canvas, theme, THREE)` — builds the full scene
- `setTheme('dark'|'light')` — swaps material colors + light intensities
- `dispose()` — cancels RAF, disconnects observers, disposes renderer

## Contact Form

Uses `ReactiveFormsModule` with `inject(FormBuilder).nonNullable.group(...)`. On submit, calls `emailjs.send(...)` from `@emailjs/browser`. Credentials (`EMAILJS_SERVICE_ID`, `EMAILJS_TEMPLATE_ID`, `EMAILJS_PUBLIC_KEY`) are hardcoded TODOs at the top of [src/app/home/contact/contact.ts](src/app/home/contact/contact.ts) — replace before going live.

## Scroll Reveal

`ScrollRevealDirective` (`[appReveal]`) uses `IntersectionObserver` (threshold 0.12) to add the `.revealed` class when an element enters the viewport. The `.reveal` / `.revealed` CSS classes are defined globally in `styles.scss` (opacity + translateY transition). Staggered delays are applied via `[style.transition-delay]` in templates.
