import type { patients } from "@/db/schema";

export type Patient = typeof patients.$inferSelect;
export type PatientStatus = Patient["status"];
