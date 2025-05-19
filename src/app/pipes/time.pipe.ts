import { Pipe, PipeTransform } from "@angular/core";

@Pipe({
  name: "time",
})
export class TimePipe implements PipeTransform {
  transform(value: number, ..._args: unknown[]): unknown {
    const hours = Math.floor(value);
    const minutes = Math.round((value - hours) * 60);
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
  }
}
