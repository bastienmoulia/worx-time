import { Routes } from "@angular/router";

export const routes: Routes = [
  {
    path: "",
    loadComponent: () =>
      import("./main/main.component").then((c) => c.MainComponent),
    children: [
      {
        path: "settings",
        loadComponent: () =>
          import("./settings/settings.component").then(
            (c) => c.SettingsComponent,
          ),
      },
    ],
  },
  {
    path: "login",
    loadComponent: () =>
      import("./login/login.component").then((c) => c.LoginComponent),
  },
];
