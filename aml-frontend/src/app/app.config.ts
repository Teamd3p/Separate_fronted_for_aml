import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZoneChangeDetection, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { routes } from './app.routes';
import { LucideAngularModule, Shield, Mail, Lock, Eye, EyeOff, Sun, Moon } from 'lucide-angular';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(withInterceptorsFromDi()),

    // Register icons globally
    importProvidersFrom(
      LucideAngularModule.pick({
        Shield,
        Mail,
        Lock,
        Eye,
        EyeOff,
        Sun,
        Moon
      })
    ),
  ],
};
