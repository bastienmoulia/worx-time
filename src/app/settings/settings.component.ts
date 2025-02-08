import {
  ChangeDetectionStrategy,
  Component,
  effect,
  ElementRef,
  inject,
  OnInit,
  signal,
  viewChild,
} from "@angular/core";
import { FormsModule } from "@angular/forms";
import { Router, RouterLink } from "@angular/router";
import { toSignal } from "@angular/core/rxjs-interop";
import { Auth, user } from "@angular/fire/auth";
import { AppService, Settings } from "../app.service";

@Component({
  selector: "app-settings",
  imports: [RouterLink, FormsModule],
  templateUrl: "./settings.component.html",
  styleUrl: "./settings.component.css",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsComponent implements OnInit {
  #auth = inject(Auth);
  #appService = inject(AppService);
  #router = inject(Router);

  settingsDialog =
    viewChild.required<ElementRef<HTMLDialogElement>>("settingsDialog");
  user = toSignal(user(this.#auth));

  settings = signal<Settings>(null!);

  constructor() {
    effect(() => {
      if (this.user()) {
        this.#appService.getSettings(this.user()!.uid).then((settings) => {
          if (settings) {
            this.settings.set(settings!);
          } else {
            this.settings.set({ weekHours: 35 });
          }
        });
      }
    });
  }

  ngOnInit(): void {
    this.settingsDialog().nativeElement.showModal();
  }

  save(): void {
    this.#appService.setSettings(this.user()!.uid, this.settings());
    this.#router.navigate(["./"]);
  }
}
