import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  OnInit,
  signal,
  viewChild,
} from "@angular/core";
import { FormsModule } from "@angular/forms";
import { Router } from "@angular/router";
import { toSignal } from "@angular/core/rxjs-interop";
import { Auth, user } from "@angular/fire/auth";
import { AppService, DEFAULT_SETTINGS, Settings } from "../app/app.service";
import { Dialog } from "../dialog/dialog";

@Component({
  selector: "wt-settings-dialog",
  imports: [FormsModule, Dialog],
  templateUrl: "./settings-dialog.html",
  styleUrl: "./settings-dialog.css",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsDialog implements OnInit {
  #auth = inject(Auth);
  #appService = inject(AppService);
  #router = inject(Router);

  protected settingsDialog = viewChild.required<Dialog>("settingsDialog");
  protected user = toSignal(user(this.#auth));

  protected settingsEdit = signal<Settings>(null!);
  protected newSettings = signal(false);

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
    this.settingsDialog().open({ closeOnOutsideClick: false });
  }

  save(): void {
    this.#appService
      .setSettings(this.user()!.uid, this.settingsEdit())
      .then(() => {
        this.#appService.settings.set(this.settingsEdit());
      });
    this.#router.navigate([{ outlets: { modal: null } }]);
  }

  close(): void {
    this.settingsDialog().close();
  }

  onClosed(): void {
    window.setTimeout(() => {
      this.#router.navigate([{ outlets: { modal: null } }]);
    }, 500);
  }
}
