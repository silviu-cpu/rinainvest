export interface NavCopy {
  services: string;
  brands: string;
  process: string;
  contact: string;
  cta: string;
}

export interface HeroCopy {
  eyebrow: string;
  titleA: string;
  titleB: string;
  titleC: string;
  titleD: string;
  lead: string;
  ctaPrimary: string;
  ctaSecondary: string;
  ticker: string[];
  stageHint: string;
  stageLive: string;
}

export interface StatItem {
  value: string;
  label: string;
}

export interface SplitCardCopy {
  kicker: string;
  title: string;
  body: string;
  bullets: string[];
  cta: string;
}

export interface SplitCopy {
  title: string;
  sub: string;
  buy: SplitCardCopy;
  rent: SplitCardCopy;
}

export interface BrandItem {
  name: string;
  mark: string;
  line: string;
}

export interface BrandsCopy {
  kicker: string;
  title: string;
  items: BrandItem[];
  foot: string;
}

export interface ServiceItem {
  n: string;
  title: string;
  desc: string;
}

export interface ServicesCopy {
  kicker: string;
  title: string;
  rentLabel: string;
  saleLabel: string;
  items: ServiceItem[];
}

export interface StepItem {
  n: string;
  title: string;
  desc: string;
}

export interface ProcessCopy {
  kicker: string;
  title: string;
  steps: StepItem[];
}

export interface ContactCopy {
  kicker: string;
  title: string;
  sub: string;
  directTitle: string;
  phone: string;
  address: string;
  cui: string;
  fieldName: string;
  fieldCompany: string;
  fieldEmail: string;
  fieldPhone: string;
  fieldType: string;
  typeOpts: string[];
  fieldVehicle: string;
  vehicleOpts: string[];
  fieldMessage: string;
  messagePh: string;
  consent: string;
  submit: string;
  submittedTitle: string;
  submittedDesc: string;
}

export interface FooterCopy {
  tagline: string;
  address: string;
  cui: string;
  copy: string;
}

export interface SiteCopy {
  nav: NavCopy;
  hero: HeroCopy;
  stats: StatItem[];
  split: SplitCopy;
  brands: BrandsCopy;
  services: ServicesCopy;
  process: ProcessCopy;
  contact: ContactCopy;
  footer: FooterCopy;
}
