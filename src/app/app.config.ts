import { ApplicationConfig, LOCALE_ID } from '@angular/core'; // 👈 Importa LOCALE_ID
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';

// 👇 IMPORTANTE: Configuración para español
import localeEsPe from '@angular/common/locales/es-PE';
import { registerLocaleData } from '@angular/common';
registerLocaleData(localeEsPe);

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    { provide: LOCALE_ID, useValue: 'es-PE' } // 👈 Establece el idioma por defecto
  ]
};