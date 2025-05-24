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
import { Router } from "@angular/router";
import { AppService, Day, DEFAULT_SETTINGS, Period } from "../app.service";
import { DialogComponent } from "../dialog/dialog.component";
import { NgxoTooltipComponent } from "@ngx-overlay/ngx-overlay";

@Component({
  selector: "app-main",
  imports: [
    FormsModule,
    TimePipe,
    HeaderComponent,
    HeaderComponent,
    DatePipe,
    DialogComponent,
    NgxoTooltipComponent,
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

  settings = computed(() => {
    return this.#appService.settings();
  });

  constructor() {
    effect(() => {
      console.debug(this.days());
    });

    effect(() => {
      if (this.user()) {
        this.#appService
          .getSettings(this.user()!.uid)
          .then((settings) => {
            if (settings) {
              this.#appService.settings.set({
                ...DEFAULT_SETTINGS,
                ...settings,
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
      const day = await this.#appService.getDay(uid, date);
      if (day) {
        const { date: _, ...dayWithoutDate } = day;
        days[i] = { ...days[i], ...dayWithoutDate };
        const periods = await this.#appService.getPeriods(day.dayUid!);
        days[i].periods = periods;
      }
    }

    this.days.set(days);
  }

  async add(dayIndex: number) {
    let dayUid = this.days()[dayIndex].dayUid;
    if (!dayUid) {
      dayUid = await this.addDay(dayIndex);
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

  remove(
    dayIndex: number,
    periodIndex: number,
    confirmDialog?: DialogComponent,
  ) {
    if (
      !confirmDialog ||
      (!this.days()[dayIndex].periods[periodIndex].in &&
        !this.days()[dayIndex].periods[periodIndex].out)
    ) {
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
    } else {
      confirmDialog?.open();
    }
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

  async markAbsence(
    dayIndex: number,
    type: "day" | "morning" | "afternoon" | undefined,
  ) {
    let dayUid = this.days()[dayIndex].dayUid;
    if (!dayUid) {
      dayUid = await this.addDay(dayIndex);
    }
    this.#appService
      .updateAbsence(this.days()[dayIndex].dayUid!, type)
      .then(() => {
        this.days.update((days) => {
          days[dayIndex].absence = type;
          return [...days];
        });
      });
  }

  private async addDay(dayIndex: number): Promise<string> {
    const dayUid = await this.#appService.addDay(
      this.user()!.uid,
      this.days()[dayIndex].date,
    );
    this.days.update((days) => {
      days[dayIndex].dayUid = dayUid;
      return [...days];
    });
    return dayUid;
  }
}
