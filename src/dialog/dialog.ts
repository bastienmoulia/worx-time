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
  selector: "wt-dialog",
  imports: [],
  templateUrl: "./dialog.html",
  styleUrl: "./dialog.css",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Dialog implements OnDestroy {
  #document = inject(DOCUMENT);

  readonly cssClass = input<string>();
  protected class = computed(() => {
    let classString = this.cssClass();
    if (this.isCloseCancelled()) {
      classString += " close-cancelled";
    }
    return classString;
  });
  protected dialog =
    viewChild.required<ElementRef<HTMLDialogElement>>("dialog");
  protected params = signal<DialogParams>({
    closeOnOutsideClick: true,
    closeOnEscape: true,
  });
  readonly closed = output<void>();
  protected isCloseCancelled = signal(false);

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
