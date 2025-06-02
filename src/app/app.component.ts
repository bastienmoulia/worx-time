import { registerLocaleData } from "@angular/common";
import { ChangeDetectionStrategy, Component, LOCALE_ID } from "@angular/core";
import localeFr from "@angular/common/locales/fr";
import { RouterOutlet } from "@angular/router";

@Component({
  selector: "wt-root",
  imports: [RouterOutlet],
  providers: [{ provide: LOCALE_ID, useValue: "fr" }],
  templateUrl: "./app.component.html",
  styleUrl: "./app.component.css",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {
  constructor() {
    registerLocaleData(localeFr, "fr");
  }
}
