import { DOCUMENT } from "@angular/common";
import {
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  input,
  OnDestroy,
  viewChild,
} from "@angular/core";

@Component({
  selector: "app-tooltip",
  imports: [],
  templateUrl: "./tooltip.component.html",
  styleUrl: "./tooltip.component.css",
})
export class TooltipComponent implements OnDestroy {
  #document = inject(DOCUMENT);

  target = input.required<HTMLElement>();
  tooltip = viewChild.required<ElementRef>("popover");
  position = input<"top" | "bottom" | "left" | "right">("top");
  tooltipClass = input<string>();
  class = computed<string>(() => {
    if (this.tooltipClass()) {
      return `tooltip-${this.position()} ${this.tooltipClass()}`;
    }
    return `tooltip-${this.position()}`;
  });

  constructor() {
    effect(() => {
      this.target().addEventListener("mouseenter", this.showTooltip);
      this.target().addEventListener("mouseleave", this.hideTooltip);
      this.target().addEventListener("focus", this.showTooltip);
      this.target().addEventListener("blur", this.hideTooltip);
      this.#document.addEventListener("keydown", this.handleEscapeKey);
    });
  }

  ngOnDestroy(): void {
    this.target().removeEventListener("mouseenter", this.showTooltip);
    this.target().removeEventListener("mouseleave", this.hideTooltip);
    this.target().removeEventListener("focus", this.showTooltip);
    this.target().removeEventListener("blur", this.hideTooltip);
    this.#document.removeEventListener("keydown", this.handleEscapeKey);
  }

  showTooltip = () => {
    this.tooltip().nativeElement.showPopover({
      source: this.target(),
    });
  };

  hideTooltip = () => {
    this.tooltip().nativeElement.hidePopover();
  };

  handleEscapeKey = (event: KeyboardEvent) => {
    if (event.key === "Escape") {
      this.hideTooltip();
    }
  };
}
