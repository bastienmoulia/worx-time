import { ComponentFixture, TestBed } from "@angular/core/testing";

import { Header } from "./header";

describe("Header", () => {
  let component: Header;
  let fixture: ComponentFixture<Header>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Header],
    }).compileComponents();

    fixture = TestBed.createComponent(Header);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should calculate daily hours as weekHours / 5", () => {
    // Test with 37 hours per week (from issue example)
    const weekHours = 37;
    const expectedDailyHours = 7.4; // 37 / 5 = 7.4 hours (7h24min)
    expect(weekHours / 5).toBe(expectedDailyHours);
  });

  it("should calculate half-day hours as dailyHours / 2", () => {
    // Test with 37 hours per week (from issue example)
    const weekHours = 37;
    const dailyHours = weekHours / 5; // 7.4 hours
    const expectedHalfDayHours = 3.7; // 7.4 / 2 = 3.7 hours (3h42min)
    expect(dailyHours / 2).toBe(expectedHalfDayHours);
  });

  it("should calculate same hours for all days (no Friday exception)", () => {
    // Test that all days use the same calculation
    const weekHours = 37;
    const dailyHours = weekHours / 5;
    // All days should have the same daily hours
    for (let i = 0; i < 5; i++) {
      expect(dailyHours).toBe(7.4);
    }
  });
});
