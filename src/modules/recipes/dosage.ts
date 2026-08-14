// Tipi importati dal file concreto, non dal barrel `@/modules/patients`
// (che re-esporta anche codice `"server-only"`) — questo modulo è puro e
// pensato per essere usato anche da Client Component (es. il dialog di
// assegnazione ricetta), stesso motivo già documentato per
// `@/modules/products` — vedi docs/audit/open-risks.md.
import type {
  ActivityLevel,
  DietIntensity,
  NutritionGoal,
  PatientSex,
} from "@/modules/patients/types";

/**
 * Fattori di attività standard (Harris-Benedict/Mifflin-St Jeor) applicati al
 * BMR per stimare il fabbisogno energetico totale (TDEE).
 */
const ACTIVITY_FACTORS: Record<ActivityLevel, number> = {
  SEDENTARY: 1.2,
  LIGHT: 1.375,
  MODERATE: 1.55,
  INTENSE: 1.725,
};

/**
 * Deficit/surplus calorico giornaliero applicato al TDEE in base
 * all'intensità della dieta — valori indicativi comuni in pratica
 * nutrizionistica (non un parametro clinico validato), pensati come default
 * ragionevole e regolabile, non come prescrizione. Si applica solo per
 * obiettivi di dimagrimento/aumento massa — vedi `computeDailyKcalTarget`.
 */
const DIET_INTENSITY_KCAL_DELTA: Record<DietIntensity, number> = {
  LIGHT: 250,
  MEDIUM: 500,
  HARD: 750,
};

/**
 * Quota del fabbisogno giornaliero che una singola ricetta assegnata è
 * pensata coprire (assunzione: "un pasto principale"). Non c'è oggi un
 * concetto di "slot pasto" (colazione/pranzo/cena) nel dominio — un valore
 * fisso è la scelta più semplice che non richiede dati aggiuntivi. Vedi
 * docs/audit/decisions.md.
 */
export const DEFAULT_MEAL_KCAL_FRACTION = 0.3;

export type DailyTargetInput = {
  sex: PatientSex | null;
  birthDate: string | null; // "YYYY-MM-DD"
  activityLevel: ActivityLevel | null;
  nutritionGoal: NutritionGoal | null;
  dietIntensity: DietIntensity | null;
  /** BMR realmente misurato dalla bilancia BIA, dall'ultima misurazione — ha sempre priorità sulla stima. */
  measuredBmrKcal: number | null;
  /** Peso/altezza dall'ultima misurazione, per la stima Mifflin-St Jeor se manca il BMR misurato. */
  weightKg: number | null;
  heightCm: number | null;
  /** Solo per i test — di default `new Date()`. */
  asOf?: Date;
};

export type DailyTargetResult =
  | {
      status: "ok";
      bmrKcal: number;
      bmrSource: "MEASURED" | "ESTIMATED_MIFFLIN_ST_JEOR";
      tdeeKcal: number;
      dailyKcalTarget: number;
    }
  | { status: "insufficient_data"; missing: string[] };

function computeAgeYears(birthDate: string, asOf: Date): number {
  const birth = new Date(birthDate);
  let age = asOf.getFullYear() - birth.getFullYear();
  const monthDiff = asOf.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && asOf.getDate() < birth.getDate())) age -= 1;
  return age;
}

/** Formula Mifflin-St Jeor — la stima standard più usata quando manca un BMR misurato da bilancia BIA. */
function mifflinStJeorBmr(input: {
  sex: PatientSex;
  weightKg: number;
  heightCm: number;
  ageYears: number;
}): number {
  const base = 10 * input.weightKg + 6.25 * input.heightCm - 5 * input.ageYears;
  return input.sex === "MALE" ? base + 5 : base - 161;
}

/**
 * Risolve il fabbisogno calorico giornaliero del paziente. Preferisce sempre
 * il BMR misurato (più affidabile di qualunque formula); se assente, prova a
 * stimarlo — se anche i dati per la stima mancano, restituisce
 * `insufficient_data` invece di indovinare (nessuna assunzione silenziosa su
 * dati clinici mancanti).
 */
export function computeDailyKcalTarget(input: DailyTargetInput): DailyTargetResult {
  const asOf = input.asOf ?? new Date();
  const missing: string[] = [];

  let bmrKcal: number;
  let bmrSource: "MEASURED" | "ESTIMATED_MIFFLIN_ST_JEOR";

  if (input.measuredBmrKcal !== null) {
    bmrKcal = input.measuredBmrKcal;
    bmrSource = "MEASURED";
  } else {
    if (input.sex === null) missing.push("sesso");
    if (input.birthDate === null) missing.push("data di nascita");
    if (input.weightKg === null) missing.push("peso (ultima misurazione)");
    if (input.heightCm === null) missing.push("altezza (ultima misurazione)");
    if (missing.length > 0) return { status: "insufficient_data", missing };

    bmrKcal = mifflinStJeorBmr({
      sex: input.sex!,
      weightKg: input.weightKg!,
      heightCm: input.heightCm!,
      ageYears: computeAgeYears(input.birthDate!, asOf),
    });
    bmrSource = "ESTIMATED_MIFFLIN_ST_JEOR";
  }

  if (input.activityLevel === null)
    return { status: "insufficient_data", missing: ["livello di attività"] };
  const tdeeKcal = bmrKcal * ACTIVITY_FACTORS[input.activityLevel];

  // Nessun obiettivo impostato = trattato come mantenimento (nessuna
  // assunzione di deficit/surplus non richiesto esplicitamente).
  let dailyKcalTarget = tdeeKcal;
  if (input.nutritionGoal === "WEIGHT_LOSS" || input.nutritionGoal === "WEIGHT_GAIN") {
    // Intensità non impostata ma obiettivo di perdita/aumento sì: MEDIUM come default intermedio.
    const delta = DIET_INTENSITY_KCAL_DELTA[input.dietIntensity ?? "MEDIUM"];
    dailyKcalTarget = input.nutritionGoal === "WEIGHT_LOSS" ? tdeeKcal - delta : tdeeKcal + delta;
  }

  return { status: "ok", bmrKcal, bmrSource, tdeeKcal, dailyKcalTarget };
}

/**
 * Porzione (in grammi) di una ricetta che copre la quota di fabbisogno
 * giornaliero assegnata a un singolo pasto — vedi `DEFAULT_MEAL_KCAL_FRACTION`.
 * Ritorna `null` se la ricetta non ha densità calorica (nessun ingrediente).
 */
export function suggestRecipePortionGrams(
  dailyKcalTarget: number,
  recipeKcalPer100g: number,
  mealFraction: number = DEFAULT_MEAL_KCAL_FRACTION,
): number | null {
  if (recipeKcalPer100g <= 0) return null;
  const targetKcalForPortion = dailyKcalTarget * mealFraction;
  return (targetKcalForPortion / recipeKcalPer100g) * 100;
}
