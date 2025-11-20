// main.ts

// 🔹 Solución para SockJS / librerías Node-like en navegador
(window as any).global = window;

import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { importProvidersFrom } from '@angular/core';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { FormsModule } from '@angular/forms'; // ✅ necesario para [(ngModel)]
import { AppComponent } from './app/app.component';
import { routes } from './app/app.routes';
import { AuthClienteInterceptor } from './app/interceptors/auth-cliente.interceptor';

// 🚀 Bootstrap principal con todos los módulos necesarios
bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(routes),
    importProvidersFrom(HttpClientModule, FormsModule),
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthClienteInterceptor,
      multi: true
    }
  ]
}).catch(err => console.error('❌ Error al iniciar la aplicación:', err));