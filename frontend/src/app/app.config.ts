import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withHashLocation } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { routes } from './app.routes';
import { apiBaseInterceptor } from './core/api-base.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withHashLocation()),
    // apiBaseInterceptor manda /api/* a la API real cuando la web se sirve desde Pages
    provideHttpClient(withInterceptors([apiBaseInterceptor]))
  ]
};
