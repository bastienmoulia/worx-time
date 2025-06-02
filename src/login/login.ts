import { ChangeDetectionStrategy, Component, inject } from "@angular/core";
import {
  Auth,
  GoogleAuthProvider,
  signInWithPopup,
  OAuthProvider,
} from "@angular/fire/auth";
import { Router } from "@angular/router";

@Component({
  selector: "wt-login",
  imports: [],
  templateUrl: "./login.html",
  styleUrl: "./login.css",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Login {
  #auth = inject(Auth);
  #router = inject(Router);

  loginWithGoogle(): void {
    const provider = new GoogleAuthProvider();
    signInWithPopup(this.#auth, provider)
      .then((result) => {
        console.log("Logged in with Google:", result.user);
        this.#router.navigate(["./"]);
      })
      .catch((error) => {
        console.error("Error logging in with Google:", error);
      });
  }

  loginWithMicrosoft(): void {
    const provider = new OAuthProvider("microsoft.com");
    signInWithPopup(this.#auth, provider)
      .then((result) => {
        console.log("Logged in with Microsoft:", result.user);
        this.#router.navigate(["./"]);
      })
      .catch((error) => {
        console.error("Error logging in with Microsoft:", error);
      });
  }

  loginWithApple(): void {
    const provider = new OAuthProvider("apple.com");
    signInWithPopup(this.#auth, provider)
      .then((result) => {
        console.log("Logged in with Apple:", result.user);
        this.#router.navigate(["./"]);
      })
      .catch((error) => {
        console.error("Error logging in with Apple:", error);
      });
  }
}
