import {
  ApplicationConfig,
  provideExperimentalZonelessChangeDetection,
  isDevMode,
} from "@angular/core";
import { provideRouter } from "@angular/router";

import { routes } from "./app.routes";
import { initializeApp, provideFirebaseApp } from "@angular/fire/app";
import { getAuth, provideAuth } from "@angular/fire/auth";
import { getFirestore, provideFirestore } from "@angular/fire/firestore";
import { provideServiceWorker } from "@angular/service-worker";

export const appConfig: ApplicationConfig = {
  providers: [
    provideExperimentalZonelessChangeDetection(),
    provideRouter(routes),
    provideFirebaseApp(() =>
      initializeApp({
        projectId: "worx-time",
        appId: "1:635974150643:web:c7db67b2b041cb2d710a86",
        storageBucket: "worx-time.firebasestorage.app",
        apiKey: "AIzaSyB0aE4sIEfKPSce7Ge1DLueXu-gbH-l4jQ",
        authDomain: "worx-time.firebaseapp.com",
        messagingSenderId: "635974150643",
      }),
    ),
    provideAuth(() => getAuth()),
    provideFirestore(() => getFirestore()),
    provideServiceWorker("ngsw-worker.js", {
      enabled: !isDevMode(),
      registrationStrategy: "registerWhenStable:30000",
    }),
  ],
};
