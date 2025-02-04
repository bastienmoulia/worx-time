import { AsyncPipe, JsonPipe, registerLocaleData } from "@angular/common";
import {
  Component,
  computed,
  effect,
  inject,
  LOCALE_ID,
  OnInit,
  signal,
} from "@angular/core";
import localeFr from "@angular/common/locales/fr";
import { FormsModule } from "@angular/forms";
import { TimePipe } from "./time.pipe";
import {
  Auth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  user,
} from "@angular/fire/auth";
import { doc, Firestore, getDoc } from "@angular/fire/firestore";

interface Period {
  in: string;
  out: string;
}

interface Day {
  name: string;
  periods: Period[];
}

interface Settings {
  weekHours: number;
}

@Component({
  selector: "app-root",
  imports: [FormsModule, TimePipe, AsyncPipe],
  providers: [{ provide: LOCALE_ID, useValue: "fr" }],
  templateUrl: "./app.component.html",
  styleUrl: "./app.component.css",
})
export class AppComponent implements OnInit {
  #auth = inject(Auth);
  #firestore = inject(Firestore);

  provider = new GoogleAuthProvider();
  user$ = user(this.#auth);

  weekHours = signal(35);
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

    this.user$.subscribe((user) => {
      if (user) {
        console.log("user", user);
        this.getSettings(user.uid).then((settings) => {
          console.log("settings", settings);
          this.weekHours.set(settings!.weekHours);
        });
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
      // docSnap.data() will be undefined in this case
      console.log("No such document!");
      return null!;
    }
  }

  ngOnInit(): void {
    const days = localStorage.getItem("days");
    if (days) {
      this.days.set(JSON.parse(days));
    }
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
}
