import type { ActivityLevel, DietIntensity, NutritionGoal, PatientSex } from "./types";

const SEX_LABELS: Record<PatientSex, string> = {
  MALE: "Maschio",
  FEMALE: "Femmina",
};

const DIET_INTENSITY_LABELS: Record<DietIntensity, string> = {
  LIGHT: "Leggera",
  MEDIUM: "Media",
  HARD: "Intensa",
};

const NUTRITION_GOAL_LABELS: Record<NutritionGoal, string> = {
  WEIGHT_LOSS: "Dimagrimento",
  WEIGHT_GAIN: "Aumento massa",
  MAINTENANCE: "Mantenimento",
  CLINICAL: "Percorso clinico/patologico",
  OTHER: "Altro",
};

const ACTIVITY_LEVEL_LABELS: Record<ActivityLevel, string> = {
  SEDENTARY: "Sedentario",
  LIGHT: "Leggera",
  MODERATE: "Moderata",
  INTENSE: "Intensa",
};

export function getNutritionGoalLabel(goal: NutritionGoal): string {
  return NUTRITION_GOAL_LABELS[goal];
}

export function getActivityLevelLabel(level: ActivityLevel): string {
  return ACTIVITY_LEVEL_LABELS[level];
}

export function getSexLabel(sex: PatientSex): string {
  return SEX_LABELS[sex];
}

export function getDietIntensityLabel(intensity: DietIntensity): string {
  return DIET_INTENSITY_LABELS[intensity];
}

export const NUTRITION_GOAL_OPTIONS: { value: NutritionGoal; label: string }[] = (
  Object.keys(NUTRITION_GOAL_LABELS) as NutritionGoal[]
).map((value) => ({ value, label: NUTRITION_GOAL_LABELS[value] }));

export const ACTIVITY_LEVEL_OPTIONS: { value: ActivityLevel; label: string }[] = (
  Object.keys(ACTIVITY_LEVEL_LABELS) as ActivityLevel[]
).map((value) => ({ value, label: ACTIVITY_LEVEL_LABELS[value] }));

export const SEX_OPTIONS: { value: PatientSex; label: string }[] = (
  Object.keys(SEX_LABELS) as PatientSex[]
).map((value) => ({ value, label: SEX_LABELS[value] }));

export const DIET_INTENSITY_OPTIONS: { value: DietIntensity; label: string }[] = (
  Object.keys(DIET_INTENSITY_LABELS) as DietIntensity[]
).map((value) => ({ value, label: DIET_INTENSITY_LABELS[value] }));
