import {
  ApplicationConfig,
  provideZoneChangeDetection,
  importProvidersFrom,
} from '@angular/core';
import {
  provideRouter,
  withInMemoryScrolling,
  withRouterConfig,
} from '@angular/router';
import { JoyrideModule } from 'ngx-joyride';

import { routes } from './app.routes';
import { firebaseConfig, useLocalEmulators } from './firebase.config';
import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { provideAuth, getAuth, connectAuthEmulator } from '@angular/fire/auth';
import { provideFirestore, getFirestore, connectFirestoreEmulator } from '@angular/fire/firestore';
import { provideStorage, getStorage, connectStorageEmulator } from '@angular/fire/storage';
import { provideFunctions, getFunctions, connectFunctionsEmulator } from '@angular/fire/functions';
import {
  provideAnalytics,
  getAnalytics,
  ScreenTrackingService,
  UserTrackingService,
} from '@angular/fire/analytics';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(
      routes,
      withRouterConfig({ onSameUrlNavigation: 'reload' }),
      withInMemoryScrolling({
        scrollPositionRestoration: 'enabled',
        anchorScrolling: 'enabled',
      }),
    ),
    // importProvidersFrom(JoyrideModule.forRoot()),
    provideFirebaseApp(() => initializeApp(firebaseConfig)),
    provideAuth(() => {
      const auth = getAuth();
      if (useLocalEmulators) connectAuthEmulator(auth, 'http://127.0.0.1:9099');
      return auth;
    }),
    provideFirestore(() => {
      const db = getFirestore();
      if (useLocalEmulators) connectFirestoreEmulator(db, '127.0.0.1', 8080);
      return db;
    }),
    // Explicitly bind Storage to the correct bucket to avoid legacy domain issues
    provideStorage(() => {
      const storage = getStorage(undefined, `gs://${firebaseConfig.storageBucket}`);
      if (useLocalEmulators) connectStorageEmulator(storage, '127.0.0.1', 9199);
      return storage;
    }),
    provideFunctions(() => {
      const functions = getFunctions(undefined, 'us-central1');
      if (useLocalEmulators) connectFunctionsEmulator(functions, '127.0.0.1', 5001);
      return functions;
    }),
    ...(useLocalEmulators ? [] : [
      provideAnalytics(() => getAnalytics()),
      ScreenTrackingService,
      UserTrackingService,
    ]),
  ],
};
