import { Component } from '@angular/core';
import { NavComponent } from './nav/nav';
import { HeroComponent } from './hero/hero';
import { StatsComponent } from './stats/stats';
import { SplitComponent } from './split/split';
import { BrandsComponent } from './brands/brands';
import { ServicesSectionComponent } from './services-section/services-section';
import { ProcessComponent } from './process/process';
import { ContactComponent } from './contact/contact';
import { FooterComponent } from './footer/footer';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    NavComponent,
    HeroComponent,
    StatsComponent,
    SplitComponent,
    BrandsComponent,
    ServicesSectionComponent,
    ProcessComponent,
    ContactComponent,
    FooterComponent,
  ],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class HomeComponent {}
