import { inject } from "@angular/core";
import { Auth, user } from "@angular/fire/auth";
import {
  ActivatedRouteSnapshot,
  CanActivateFn,
  Router,
  RouterStateSnapshot,
  Routes,
} from "@angular/router";
import { map } from "rxjs";

const canActivate: CanActivateFn = (
  _route: ActivatedRouteSnapshot,
  _state: RouterStateSnapshot,
) => {
  const auth = inject(Auth);
  const router = inject(Router);
  return user(auth).pipe(
    map((user) => {
      if (user) {
        return true;
      } else {
        return router.createUrlTree(["/login"]);
      }
    }),
  );
};

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
    canActivate: [canActivate],
  },
  {
    path: "login",
    loadComponent: () =>
      import("./login/login.component").then((c) => c.LoginComponent),
  },
];
