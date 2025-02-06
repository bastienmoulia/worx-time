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
import {
  Firestore,
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  deleteDoc,
  addDoc,
} from "@angular/fire/firestore";
import { FormsModule } from "@angular/forms";
import { HeaderComponent } from "../header/header.component";
import { TimePipe } from "../pipes/time.pipe";

interface Period {
  in: string;
  out: string;
  periodUid: string;
}

export interface Day {
  date: Date;
  periods: Period[];
  dayUid?: string;
}

export interface Settings {
  weekHours: number;
}

@Component({
  selector: "app-main",
  imports: [FormsModule, TimePipe, HeaderComponent, HeaderComponent, DatePipe],
  templateUrl: "./main.component.html",
  styleUrl: "./main.component.css",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MainComponent {
  #auth = inject(Auth);
  #firestore = inject(Firestore);

  user = toSignal(user(this.#auth));

  settings = signal<Settings>(null!);
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

  constructor() {
    effect(() => {
      console.debug(this.days());
    });

    effect(() => {
      if (this.user()) {
        console.log("user", this.user());
        this.getSettings(this.user()!.uid).then((settings) => {
          console.log("settings", settings);
          this.settings.set(settings!);
        });
      }
    });

    effect(() => {
      if (this.mondayOfWeek() && this.user()) {
        this.getData(this.mondayOfWeek(), this.user()!.uid);
      }
    });
  }

  async getSettings(uid: string): Promise<Settings | null> {
    console.log("getSettings", uid);
    const settingsRef = doc(this.#firestore, "settings", uid);
    const settingsSnap = await getDoc(settingsRef);
    if (settingsSnap.exists()) {
      console.log("Settings data:", settingsSnap.data());
      return settingsSnap.data() as Settings;
    } else {
      console.log("No such document!");
      return null!;
    }
  }

  async getDayUid(uid: string, date: Date): Promise<string | null> {
    console.log("getPeriods", uid, date);
    const starDate = new Date(date);
    starDate.setHours(0, 0, 0, 0);
    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);
    const q = query(
      collection(this.#firestore, "days"),
      where("uid", "==", uid),
      where("date", "<=", endDate),
      where("date", ">=", starDate),
    );

    const querySnapshot = await getDocs(q);
    let dayUid = null;
    querySnapshot.forEach((doc) => {
      dayUid = doc.id;
    });
    return dayUid!;
  }

  async getPeriods(dayUid: string): Promise<Period[]> {
    const q = query(collection(this.#firestore, "days", dayUid, "periods"));
    const querySnapshot = await getDocs(q);
    const periods: Period[] = [];
    querySnapshot.forEach((doc) => {
      periods.push({ ...doc.data(), periodUid: doc.id } as Period);
    });
    return periods.sort((a, b) => {
      if (a.in < b.in) {
        return -1;
      }
      if (a.in > b.in) {
        return 1;
      }
      return 0;
    });
  }

  async updatePeriod(
    dayUid: string,
    periodUid: string,
    period: Partial<Period>,
  ) {
    console.log("updatePeriod", dayUid, periodUid, period);
    const periodRef = doc(
      this.#firestore,
      "days",
      dayUid,
      "periods",
      periodUid,
    );
    await updateDoc(periodRef, period);
  }

  async deletePeriod(dayUid: string, periodUid: string) {
    console.log("deletePeriod", dayUid, periodUid);
    const periodRef = doc(
      this.#firestore,
      "days",
      dayUid,
      "periods",
      periodUid,
    );
    await deleteDoc(periodRef);
  }

  async addPeriod(dayUid: string, period: Partial<Period>): Promise<string> {
    const docRef = await addDoc(
      collection(this.#firestore, "days", dayUid, "periods"),
      period,
    );
    return docRef.id;
  }

  async addDay(uid: string, date: Date): Promise<string> {
    const docRef = await addDoc(collection(this.#firestore, "days"), {
      uid,
      date,
    });
    return docRef.id;
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
      const dayUid = await this.getDayUid(uid, date);
      if (dayUid) {
        days[i].dayUid = dayUid;
        const periods = await this.getPeriods(dayUid);
        days[i].periods = periods;
      }
    }

    this.days.set(days);
  }

  async add(dayIndex: number) {
    let dayUid = this.days()[dayIndex].dayUid;
    if (!dayUid) {
      dayUid = await this.addDay(this.user()!.uid, this.days()[dayIndex].date);
      this.days.update((days) => {
        days[dayIndex].dayUid = dayUid;
        return [...days];
      });
    }
    this.addPeriod(dayUid, { in: "", out: "" }).then((periodUid) => {
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
    this.deletePeriod(
      this.days()[dayIndex].dayUid!,
      this.days()[dayIndex].periods[periodIndex].periodUid!,
    ).then(() => {
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
    this.updatePeriod(
      this.days()[dayIndex].dayUid!,
      this.days()[dayIndex].periods[periodIndex].periodUid!,
      { [key]: value },
    ).then(() => {
      this.days.update((days) => {
        days[dayIndex].periods[periodIndex][key] = value;
        return [...days];
      });
    });
  }
}
