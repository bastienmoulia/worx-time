import { inject, Injectable, signal } from "@angular/core";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  Firestore,
  getDoc,
  getDocs,
  query,
  setDoc,
  updateDoc,
  where,
} from "@angular/fire/firestore";

export interface Period {
  in: string;
  out: string;
  periodUid: string;
}

export interface Day {
  date: Date;
  periods: Period[];
  dayUid?: string;
  absence?: "day" | "morning" | "afternoon";
}

export interface Settings {
  weekHours: number;
  minTime?: string;
  maxTime?: string;
}

export const DEFAULT_SETTINGS: Settings = {
  weekHours: 35,
  minTime: "08:00",
  maxTime: "18:00",
};

@Injectable({
  providedIn: "root",
})
export class AppService {
  #firestore = inject(Firestore);

  settings = signal<Settings>(null!);

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

  async setSettings(uid: string, settings: Settings): Promise<void> {
    await setDoc(doc(this.#firestore, "settings", uid), settings);
  }

  async getDay(uid: string, date: Date): Promise<Day | null> {
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
    let day: Day | null = null;
    querySnapshot.forEach((doc) => {
      day = { ...doc.data(), dayUid: doc.id } as Day;
    });
    return day!;
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

  async updateAbsence(
    dayUid: string,
    absence: "day" | "morning" | "afternoon" | undefined,
  ): Promise<void> {
    const dayRef = doc(this.#firestore, "days", dayUid);
    await updateDoc(dayRef, { absence: absence || "" });
  }
}
