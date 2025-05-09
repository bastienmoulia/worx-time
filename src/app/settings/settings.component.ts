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
import { AppService, DEFAULT_SETTINGS, Settings } from "../app.service";

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

  settingsEdit = signal<Settings>(null!);
  newSettings = signal(false);

  constructor() {
    effect(() => {
      if (this.user()) {
        this.#appService.getSettings(this.user()!.uid).then((settings) => {
          this.settingsEdit.set({ ...DEFAULT_SETTINGS, ...settings });
          if (!settings) {
            this.newSettings.set(true);
          }
        });
      }
    });
  }

  ngOnInit(): void {
    this.settingsDialog().nativeElement.showModal();
  }

  save(): void {
    this.#appService
      .setSettings(this.user()!.uid, this.settingsEdit())
      .then(() => {
        this.#appService.settings.set(this.settingsEdit());
      });
    this.#router.navigate(["./"]);
  }
}
