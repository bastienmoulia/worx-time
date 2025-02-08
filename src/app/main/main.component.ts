import { DatePipe } from "@angular/common";
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import { Auth, user } from "@angular/fire/auth";
import { FormsModule } from "@angular/forms";
import { HeaderComponent } from "../header/header.component";
import { TimePipe } from "../pipes/time.pipe";
import { Router, RouterOutlet } from "@angular/router";
import {
  AppService,
  Day,
  DEFAULT_SETTINGS,
  Period,
  Settings,
} from "../app.service";

@Component({
  selector: "app-main",
  imports: [
    FormsModule,
    TimePipe,
    HeaderComponent,
    HeaderComponent,
    DatePipe,
    RouterOutlet,
  ],
  templateUrl: "./main.component.html",
  styleUrl: "./main.component.css",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MainComponent {
  #auth = inject(Auth);
  #appService = inject(AppService);
  #router = inject(Router);

  user = toSignal(user(this.#auth));

  mondayOfWeek = signal<Date>(null!);
  days = signal<Day[]>([]);
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
  settings = computed(() => {
    return this.#appService.settings();
  });

  constructor() {
    effect(() => {
      console.debug(this.days());
    });

    effect(() => {
      if (this.user()) {
        console.log("user", this.user());
        this.#appService
          .getSettings(this.user()!.uid)
          .then((settings) => {
            console.log("settings", settings);
            if (settings) {
              this.#appService.settings.set({
                ...settings,
                ...DEFAULT_SETTINGS,
              });
            } else {
              this.#router.navigate(["./settings"]);
            }
          })
          .catch((error) => {
            console.error("Error getting settings:", error);
          });
      }
    });

    effect(() => {
      if (this.mondayOfWeek() && this.user()) {
        this.getData(this.mondayOfWeek(), this.user()!.uid);
      }
    });
  }

  weekYearChange(weekYear: { week: number; year: number }) {
    const firstDayOfWeek = new Date();
    firstDayOfWeek.setFullYear(weekYear.year, 0, 1);
    firstDayOfWeek.setDate(
      firstDayOfWeek.getDate() +
        ((weekYear.week - 1) * 7 - firstDayOfWeek.getDay()),
    );

    const mondayOfWeek = new Date(firstDayOfWeek);
    mondayOfWeek.setDate(mondayOfWeek.getDate() + 1);
    this.mondayOfWeek.set(mondayOfWeek);
  }

  async getData(mondayOfWeek: Date, uid: string) {
    console.log("getData", mondayOfWeek);
    const days: Day[] = [];
    for (let i = 0; i < 5; i++) {
      const date = new Date(mondayOfWeek);
      date.setDate(date.getDate() + i);
      days.push({
        date,
        periods: [],
      });
      const dayUid = await this.#appService.getDayUid(uid, date);
      if (dayUid) {
        days[i].dayUid = dayUid;
        const periods = await this.#appService.getPeriods(dayUid);
        days[i].periods = periods;
      }
    }

    this.days.set(days);
  }

  async add(dayIndex: number) {
    let dayUid = this.days()[dayIndex].dayUid;
    if (!dayUid) {
      dayUid = await this.#appService.addDay(
        this.user()!.uid,
        this.days()[dayIndex].date,
      );
      this.days.update((days) => {
        days[dayIndex].dayUid = dayUid;
        return [...days];
      });
    }
    this.#appService
      .addPeriod(dayUid, { in: "", out: "" })
      .then((periodUid) => {
        this.days.update((days) => {
          days[dayIndex].periods.push({
            in: null!,
            out: null!,
            periodUid,
          });
          return [...days];
        });
      });
  }

  remove(dayIndex: number, periodIndex: number) {
    this.#appService
      .deletePeriod(
        this.days()[dayIndex].dayUid!,
        this.days()[dayIndex].periods[periodIndex].periodUid!,
      )
      .then(() => {
        this.days.update((days) => {
          days[dayIndex].periods.splice(periodIndex, 1);
          return [...days];
        });
      });
  }

  update(
    dayIndex: number,
    periodIndex: number,
    key: keyof Period,
    value: string,
  ) {
    this.#appService
      .updatePeriod(
        this.days()[dayIndex].dayUid!,
        this.days()[dayIndex].periods[periodIndex].periodUid!,
        { [key]: value },
      )
      .then(() => {
        this.days.update((days) => {
          days[dayIndex].periods[periodIndex][key] = value;
          return [...days];
        });
      });
  }
}
