import {
  Component,
  effect,
  inject,
  input,
  OnInit,
  output,
  signal,
} from "@angular/core";
import { TimePipe } from "../pipes/time.pipe";
import { AsyncPipe } from "@angular/common";
import {
  Auth,
  GoogleAuthProvider,
  user,
  signInWithPopup,
  signOut,
} from "@angular/fire/auth";
import { FormsModule } from "@angular/forms";

@Component({
  selector: "app-header",
  imports: [AsyncPipe, TimePipe, FormsModule],
  templateUrl: "./header.component.html",
  styleUrl: "./header.component.css",
})
export class HeaderComponent implements OnInit {
  #auth = inject(Auth);

  provider = new GoogleAuthProvider();
  user$ = user(this.#auth);

  weekHours = input(35);
  total = input(0);
  week = signal("");
  weekYear = output<{ week: number; year: number }>();

  ngOnInit(): void {
    this.week.set(this.getIsoWeek(new Date()));
    this.weekChange();
  }

  weekChange() {
    const weekYear = this.week().split("-W");
    this.weekYear.emit({
      week: parseInt(weekYear[1]),
      year: parseInt(weekYear[0]),
    });
  }

  login() {
    signInWithPopup(this.#auth, this.provider).then((result) => {
      const credential = GoogleAuthProvider.credentialFromResult(result);
      console.log("credential", credential);
      return credential;
    });
  }

  logout() {
    signOut(this.#auth)
      .then(() => {
        console.log("signed out");
      })
      .catch((error) => {
        console.log("sign out error: " + error);
      });
  }

  private getIsoWeek(d: Date) {
    const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil(
      ((d.valueOf() - yearStart.valueOf()) / 86400000 + 1) / 7,
    );
    return `${date.getUTCFullYear()}-W${weekNo.toFixed(0).padStart(2, "0")}`;
  }
}
