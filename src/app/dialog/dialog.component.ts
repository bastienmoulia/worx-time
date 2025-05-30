import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  input,
  OnDestroy,
  output,
  signal,
  viewChild,
  DOCUMENT,
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

  cssClass = input<string>();
  class = computed(() => {
    let classString = this.cssClass();
    if (this.isCloseCancelled()) {
      classString += " close-cancelled";
    }
    return classString;
  });
  dialog = viewChild.required<ElementRef<HTMLDialogElement>>("dialog");
  params = signal<DialogParams>({
    closeOnOutsideClick: true,
    closeOnEscape: true,
  });
  closed = output<void>();
  isCloseCancelled = signal(false);

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

  open(params?: DialogParams): void {
    if (params) {
      this.params.set({ ...this.params(), ...params });
    }
    this.dialog().nativeElement.showModal();
  }

  close(): void {
    this.dialog().nativeElement.close();
    this.closed.emit();
  }

  private handleEscapeKey = (event: KeyboardEvent) => {
    if (event.key === "Escape") {
      if (this.params().closeOnEscape) {
        this.close();
      } else {
        this.closeCancelled();
      }
    }
  };

  private handleOutsideClick = (event: MouseEvent) => {
    if (event.target === event.currentTarget) {
      if (this.params().closeOnOutsideClick) {
        this.close();
      } else {
        this.closeCancelled();
      }
    }
  };

  private closeCancelled() {
    this.isCloseCancelled.set(true);
    setTimeout(() => {
      this.isCloseCancelled.set(false);
    }, 100);
  }
}
