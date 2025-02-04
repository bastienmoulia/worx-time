import { registerLocaleData } from "@angular/common";
import {
  Component,
  computed,
  effect,
  LOCALE_ID,
  OnInit,
  signal,
} from "@angular/core";
import localeFr from "@angular/common/locales/fr";
import { FormsModule } from "@angular/forms";
import { TimePipe } from "./time.pipe";

interface Period {
  in: string;
  out: string;
}

interface Day {
  name: string;
  periods: Period[];
}

@Component({
  selector: "app-root",
  imports: [FormsModule, TimePipe],
  providers: [{ provide: LOCALE_ID, useValue: "fr" }],
  templateUrl: "./app.component.html",
  styleUrl: "./app.component.css",
})
export class AppComponent implements OnInit {
  weekHours = 37;
  dayOffHours = 7;
  days = signal<Day[]>([
    { name: "Lundi", periods: [] },
    { name: "Mardi", periods: [] },
    { name: "Mercredi", periods: [] },
    { name: "Jeudi", periods: [] },
    { name: "Vendredi", periods: [] },
  ]);
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

  constructor() {
    registerLocaleData(localeFr, "fr");
    effect(() => {
      console.debug(this.days());
      localStorage.setItem("days", JSON.stringify(this.days()));
    });
  }

  ngOnInit(): void {
    const days = localStorage.getItem("days");
    if (days) {
      this.days.set(JSON.parse(days));
    }
  }

  add(dayIndex: number) {
    this.days.update((days) => {
      days[dayIndex].periods.push({
        in: null!,
        out: null!,
      });
      return [...days];
    });
  }

  remove(day: number, periodIndex: number) {
    this.days.update((days) => {
      days[day].periods.splice(periodIndex, 1);
      return [...days];
    });
  }

  update(
    dayIndex: number,
    periodIndex: number,
    key: keyof Period,
    value: string,
  ) {
    this.days.update((days) => {
      days[dayIndex].periods[periodIndex][key] = value;
      return [...days];
    });
  }

  reset() {
    this.days.set([
      { name: "Lundi", periods: [] },
      { name: "Mardi", periods: [] },
      { name: "Mercredi", periods: [] },
      { name: "Jeudi", periods: [] },
      { name: "Vendredi", periods: [] },
    ]);
  }
}
