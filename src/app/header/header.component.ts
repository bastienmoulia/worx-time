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
import { TooltipComponent } from "../tooltip/tooltip.component";

@Component({
  selector: "app-header",
  imports: [AsyncPipe, TimePipe, FormsModule, RouterLink, TooltipComponent],
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
  hoursPeriodByDay = computed(() => {
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

  hoursAbsenceByDay = computed(() => {
    return this.days().map((day, index) => {
      // TODO: use settings to get the hours
      if (index < 4) {
        if (day.absence === "day") {
          return 7.5;
        } else if (day.absence === "morning") {
          return 3.75;
        } else if (day.absence === "afternoon") {
          return 3.75;
        }
      } else {
        if (day.absence === "day") {
          return 7;
        } else if (day.absence === "morning") {
          return 3.5;
        } else if (day.absence === "afternoon") {
          return 3.5;
        }
      }
      return 0;
    });
  });

  totalByDay = computed(() => {
    return this.hoursPeriodByDay().map((hoursByDay, index) => {
      return hoursByDay + this.hoursAbsenceByDay()[index];
    });
  });
  hoursPeriod = computed(() => {
    return this.hoursPeriodByDay().reduce((acc, total) => acc + total, 0);
  });
  total = computed(() => {
    return this.totalByDay().reduce((acc, total) => acc + total, 0);
  });
  hoursAbsence = computed(() => {
    return this.total() - this.hoursPeriod();
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

  private getIsoWeek(d: Date): string {
    const date = new Date(d.getTime());
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() + 3 - ((date.getDay() + 6) % 7));
    const week1 = new Date(date.getFullYear(), 0, 4);
    const weekNumber = Math.round(
      ((date.getTime() - week1.getTime()) / 86400000 -
        3 +
        ((week1.getDay() + 6) % 7)) /
        7 +
        1,
    );
    return `${date.getFullYear()}-W${weekNumber.toString().padStart(2, "0")}`;
  }
}
