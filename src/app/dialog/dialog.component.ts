import { DOCUMENT } from "@angular/common";
import {
  ChangeDetectionStrategy,
  Component,
  effect,
  ElementRef,
  inject,
  input,
  OnDestroy,
  output,
  signal,
  viewChild,
} from "@angular/core";

export interface DialogParams {
  closeOnOutsideClick?: boolean;
  closeOnEscape?: boolean;
}

@Component({
  selector: "app-dialog",
  imports: [],
  templateUrl: "./dialog.component.html",
  styleUrl: "./dialog.component.css",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DialogComponent implements OnDestroy {
  #document = inject(DOCUMENT);

  class = input<string>();
  dialog = viewChild.required<ElementRef<HTMLDialogElement>>("dialog");
  params = signal<DialogParams>({
    closeOnOutsideClick: true,
    closeOnEscape: true,
  });
  closed = output<void>();

  constructor() {
    effect(() => {
      this.#document.addEventListener("keydown", this.handleEscapeKey);
      this.dialog().nativeElement.addEventListener(
        "mousedown",
        this.handleOutsideClick,
      );
    });
  }

  ngOnDestroy(): void {
    this.#document.removeEventListener("keydown", this.handleEscapeKey);
  }

  open(): void {
    this.dialog().nativeElement.showModal();
  }

  close(): void {
    this.dialog().nativeElement.close();
    this.closed.emit();
  }

  private handleEscapeKey = (event: KeyboardEvent) => {
    if (event.key === "Escape" && this.params().closeOnEscape) {
      this.close();
    }
  };

  private handleOutsideClick = (event: MouseEvent) => {
    if (
      event.target === event.currentTarget &&
      this.params().closeOnOutsideClick
    ) {
      this.close();
    }
  };
}
