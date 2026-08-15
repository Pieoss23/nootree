/**
 * Pure date/layout math for the three appointment views (agenda/settimana/
 * mese) — no DB access, no framework imports, safe to import from any
 * Client Component. Settimana inizia sempre di lunedì.
 */

export function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/** `date.getDay()`: 0=domenica..6=sabato. Riporta al lunedì della stessa settimana. */
export function getWeekStart(date: Date): Date {
  const start = startOfDay(date);
  const day = start.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  return addDays(start, diffToMonday);
}

/** Formatta in YYYY-MM-DD usando i componenti locali (mai `toISOString()`,
 * che è in UTC e può far scivolare il giorno di una data "solo calendario"). */
export function toIsoDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function parseIsoDateOrToday(value: string | undefined): Date {
  if (!value) return startOfDay(new Date());
  const parsed = new Date(`${value}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? startOfDay(new Date()) : parsed;
}

export type AgendaRange = { from: Date; to: Date };

/** `to` esclusivo: [from, to). */
export function getAgendaRange(referenceDate: Date, days = 14): AgendaRange {
  const from = startOfDay(referenceDate);
  return { from, to: addDays(from, days) };
}

export type WeekRange = { from: Date; to: Date; days: Date[] };

export function getWeekRange(referenceDate: Date): WeekRange {
  const from = getWeekStart(referenceDate);
  const days = Array.from({ length: 7 }, (_, i) => addDays(from, i));
  return { from, to: addDays(from, 7), days };
}

export type MonthGridRange = { from: Date; to: Date; weeks: Date[][] };

/** Include i giorni di riempimento del mese precedente/successivo necessari
 * a completare le settimane (lunedì-domenica) della griglia. */
export function getMonthGridRange(referenceDate: Date): MonthGridRange {
  const firstOfMonth = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), 1);
  const lastOfMonth = new Date(referenceDate.getFullYear(), referenceDate.getMonth() + 1, 0);
  const from = getWeekStart(firstOfMonth);
  const to = addDays(getWeekStart(lastOfMonth), 7);

  const weeks: Date[][] = [];
  for (let cursor = from; cursor.getTime() < to.getTime(); cursor = addDays(cursor, 7)) {
    weeks.push(Array.from({ length: 7 }, (_, i) => addDays(cursor, i)));
  }

  return { from, to, weeks };
}

export type LanePlacement = { id: string; lane: number; laneCount: number };

type IntervalLike = { id: string; startsAt: Date; endsAt: Date };

/**
 * Assegna a ogni appuntamento una "corsia" (lane) tra quelli con cui si
 * sovrappone nel tempo, per la griglia settimanale — così due appuntamenti
 * sovrapposti si affiancano invece di sovrapporsi graficamente. `laneCount`
 * è calcolato per "cluster" di sovrapposizione transitiva (non
 * globalmente): due coppie di appuntamenti sovrapposti ma separate nel
 * tempo ottengono ciascuna il proprio laneCount, non quello combinato.
 *
 * Va chiamata con gli appuntamenti di **un solo giorno** alla volta (la
 * vista settimanale raggruppa per giorno prima di chiamarla).
 */
export function packAppointmentsIntoLanes(items: IntervalLike[]): LanePlacement[] {
  const sorted = [...items].sort(
    (a, b) =>
      a.startsAt.getTime() - b.startsAt.getTime() || a.endsAt.getTime() - b.endsAt.getTime(),
  );

  const placements: { id: string; lane: number; laneCount: number }[] = [];
  let laneEnds: number[] = [];
  let clusterStart = 0;
  let clusterEnd = -Infinity;

  function finalizeCluster(fromIndex: number) {
    const laneCount = laneEnds.length;
    for (let i = fromIndex; i < placements.length; i++) {
      placements[i].laneCount = laneCount;
    }
  }

  for (const item of sorted) {
    const startMs = item.startsAt.getTime();
    const endMs = item.endsAt.getTime();

    if (startMs >= clusterEnd) {
      finalizeCluster(clusterStart);
      laneEnds = [];
      clusterStart = placements.length;
      clusterEnd = -Infinity;
    }

    let lane = laneEnds.findIndex((end) => end <= startMs);
    if (lane === -1) {
      lane = laneEnds.length;
      laneEnds.push(endMs);
    } else {
      laneEnds[lane] = endMs;
    }

    clusterEnd = Math.max(clusterEnd, endMs);
    placements.push({ id: item.id, lane, laneCount: 0 });
  }
  finalizeCluster(clusterStart);

  return placements;
}
