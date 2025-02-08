import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  OnDestroy,
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
import { Router, RouterLink } from "@angular/router";
import { Day, AppService } from "../app.service";

@Component({
  selector: "app-header",
  imports: [AsyncPipe, TimePipe, FormsModule, RouterLink],
  templateUrl: "./header.component.html",
  styleUrl: "./header.component.css",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeaderComponent implements OnInit, OnDestroy {
  #auth = inject(Auth);
  #router = inject(Router);
  #appService = inject(AppService);

  provider = new GoogleAuthProvider();
  user$ = user(this.#auth);

  days = input.required<Day[]>();
  week = signal("");
  weekYear = output<{ week: number; year: number }>();
  totalByDay = computed(() => {
    return this.days().map((day) => {
      return day.periods.reduce((acc, period) => {
        if (period.in && period.out) {
          const inTime = new Date(`2021-01-01T${period.in}`);
          const outTime = new Date(`2021-01-01T${period.out}`);
          const diff = outTime.getTime() - inTime.getTime();
          const hours = diff / 1000 / 60 / 60;
          return acc + hours;
        }
        return acc;
      }, 0);
    });
  });
  total = computed(() => {
    return this.totalByDay().reduce((acc, total) => acc + total, 0);
  });
  today = signal(new Date());
  totalNow = computed(() => {
    const totalNow = this.total();
    const todayDay = this.days().find((day) => {
      return (
        day.date.toISOString().split("T")[0] ===
        this.today().toISOString().split("T")[0]
      );
    });
    if (todayDay) {
      const lastPeriod = todayDay.periods[todayDay.periods.length - 1];
      if (lastPeriod.in && !lastPeriod.out) {
        const inTime = new Date(
          `${this.today().toISOString().split("T")[0]}T${lastPeriod.in}`,
        );
        const diff = this.today().getTime() - inTime.getTime();
        const hours = diff / 1000 / 60 / 60;
        return totalNow + hours;
      }
    }
    return totalNow;
  });
  settings = computed(() => {
    return this.#appService.settings();
  });
  interval: number = null!;

  ngOnInit(): void {
    this.week.set(this.getIsoWeek(new Date()));
    this.weekChange();
    this.interval = window.setInterval(() => {
      this.today.set(new Date());
    }, 60000);
  }

  ngOnDestroy(): void {
    clearInterval(this.interval);
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
    this.#router.navigate(["./login"]);
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
