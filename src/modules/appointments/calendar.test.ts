import { describe, expect, it } from "vitest";
import {
  addDays,
  getWeekStart,
  getWeekRange,
  getMonthGridRange,
  getAgendaRange,
  toIsoDateString,
  parseIsoDateOrToday,
  packAppointmentsIntoLanes,
} from "./calendar";

function d(iso: string): Date {
  return new Date(`${iso}T00:00:00`);
}

function dt(iso: string, time: string): Date {
  return new Date(`${iso}T${time}:00`);
}

describe("getWeekStart", () => {
  it("returns the same date when given a Monday", () => {
    // 2026-08-10 is a Monday.
    expect(toIsoDateString(getWeekStart(d("2026-08-10")))).toBe("2026-08-10");
  });

  it("goes back to Monday for a mid-week date", () => {
    // 2026-08-13 is a Thursday.
    expect(toIsoDateString(getWeekStart(d("2026-08-13")))).toBe("2026-08-10");
  });

  it("goes back to Monday for a Sunday (wraps correctly)", () => {
    // 2026-08-16 is a Sunday, belongs to the week starting 2026-08-10.
    expect(toIsoDateString(getWeekStart(d("2026-08-16")))).toBe("2026-08-10");
  });
});

describe("getWeekRange", () => {
  it("returns 7 consecutive days from Monday to Sunday", () => {
    const { days, from, to } = getWeekRange(d("2026-08-13"));
    expect(days).toHaveLength(7);
    expect(toIsoDateString(days[0])).toBe("2026-08-10");
    expect(toIsoDateString(days[6])).toBe("2026-08-16");
    expect(toIsoDateString(from)).toBe("2026-08-10");
    expect(toIsoDateString(to)).toBe("2026-08-17");
  });
});

describe("getMonthGridRange", () => {
  it("includes leading/trailing days to complete full weeks", () => {
    // Agosto 2026: 1 agosto è sabato, 31 agosto è lunedì.
    const { weeks, from, to } = getMonthGridRange(d("2026-08-13"));

    // La griglia deve iniziare di lunedì e finire di domenica (to è esclusivo).
    expect(from.getDay()).toBe(1);
    expect(addDays(to, -1).getDay()).toBe(0);
    for (const week of weeks) {
      expect(week).toHaveLength(7);
      expect(week[0].getDay()).toBe(1); // lunedì
      expect(week[6].getDay()).toBe(0); // domenica
    }

    // Il primo giorno del mese e l'ultimo devono essere inclusi in qualche settimana.
    const allDays = weeks.flat().map(toIsoDateString);
    expect(allDays).toContain("2026-08-01");
    expect(allDays).toContain("2026-08-31");
  });
});

describe("getAgendaRange", () => {
  it("returns a [from, to) range of the given number of days", () => {
    const { from, to } = getAgendaRange(d("2026-08-13"), 14);
    expect(toIsoDateString(from)).toBe("2026-08-13");
    expect(toIsoDateString(to)).toBe("2026-08-27");
  });
});

describe("parseIsoDateOrToday", () => {
  it("parses a valid ISO date string", () => {
    expect(toIsoDateString(parseIsoDateOrToday("2026-08-13"))).toBe("2026-08-13");
  });

  it("falls back to today for undefined or invalid input", () => {
    expect(toIsoDateString(parseIsoDateOrToday(undefined))).toBe(toIsoDateString(new Date()));
    expect(toIsoDateString(parseIsoDateOrToday("not-a-date"))).toBe(toIsoDateString(new Date()));
  });
});

describe("packAppointmentsIntoLanes", () => {
  it("assigns every item to lane 0 with laneCount 1 when nothing overlaps", () => {
    const items = [
      { id: "a", startsAt: dt("2026-08-13", "09:00"), endsAt: dt("2026-08-13", "10:00") },
      { id: "b", startsAt: dt("2026-08-13", "10:00"), endsAt: dt("2026-08-13", "11:00") },
      { id: "c", startsAt: dt("2026-08-13", "14:00"), endsAt: dt("2026-08-13", "15:00") },
    ];
    const placements = packAppointmentsIntoLanes(items);
    expect(placements.every((p) => p.lane === 0 && p.laneCount === 1)).toBe(true);
  });

  it("splits two overlapping appointments into separate lanes", () => {
    const items = [
      { id: "a", startsAt: dt("2026-08-13", "09:00"), endsAt: dt("2026-08-13", "10:00") },
      { id: "b", startsAt: dt("2026-08-13", "09:30"), endsAt: dt("2026-08-13", "10:30") },
    ];
    const placements = packAppointmentsIntoLanes(items);
    const byId = new Map(placements.map((p) => [p.id, p]));
    expect(byId.get("a")?.lane).not.toBe(byId.get("b")?.lane);
    expect(byId.get("a")?.laneCount).toBe(2);
    expect(byId.get("b")?.laneCount).toBe(2);
  });

  it("reuses a freed lane for a staggered cascade (A/B overlap, B/C overlap, A/C don't)", () => {
    const items = [
      { id: "a", startsAt: dt("2026-08-13", "09:00"), endsAt: dt("2026-08-13", "10:00") },
      { id: "b", startsAt: dt("2026-08-13", "09:30"), endsAt: dt("2026-08-13", "10:30") },
      { id: "c", startsAt: dt("2026-08-13", "10:15"), endsAt: dt("2026-08-13", "11:00") },
    ];
    const placements = packAppointmentsIntoLanes(items);
    const byId = new Map(placements.map((p) => [p.id, p]));
    expect(byId.get("a")?.lane).toBe(byId.get("c")?.lane);
    expect(byId.get("b")?.lane).not.toBe(byId.get("a")?.lane);
    expect(byId.get("a")?.laneCount).toBe(2);
    expect(byId.get("b")?.laneCount).toBe(2);
    expect(byId.get("c")?.laneCount).toBe(2);
  });

  it("computes laneCount per cluster, not globally, for two separate overlapping pairs", () => {
    const items = [
      { id: "a", startsAt: dt("2026-08-13", "09:00"), endsAt: dt("2026-08-13", "10:00") },
      { id: "b", startsAt: dt("2026-08-13", "09:00"), endsAt: dt("2026-08-13", "10:00") },
      { id: "c", startsAt: dt("2026-08-13", "14:00"), endsAt: dt("2026-08-13", "15:00") },
    ];
    const placements = packAppointmentsIntoLanes(items);
    const byId = new Map(placements.map((p) => [p.id, p]));
    expect(byId.get("a")?.laneCount).toBe(2);
    expect(byId.get("b")?.laneCount).toBe(2);
    // c non si sovrappone a nessuno: resta laneCount 1, non "contagiato" dal cluster a/b.
    expect(byId.get("c")?.laneCount).toBe(1);
  });
});
