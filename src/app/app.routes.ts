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
    path: "main",
    loadComponent: () => import("../main/main").then((c) => c.Main),
    canActivate: [canActivate],
  },
  {
    path: "login",
    loadComponent: () => import("../login/login").then((c) => c.Login),
  },
  {
    path: "settings",
    loadComponent: () =>
      import("../settings-dialog/settings-dialog").then(
        (c) => c.SettingsDialog,
      ),
    outlet: "modal",
  },
  {
    path: "",
    redirectTo: "main",
    pathMatch: "full",
  },
];
