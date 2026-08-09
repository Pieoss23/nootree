import type { ActivityLevel, NutritionGoal } from "./types";

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

export const NUTRITION_GOAL_OPTIONS: { value: NutritionGoal; label: string }[] = (
  Object.keys(NUTRITION_GOAL_LABELS) as NutritionGoal[]
).map((value) => ({ value, label: NUTRITION_GOAL_LABELS[value] }));

export const ACTIVITY_LEVEL_OPTIONS: { value: ActivityLevel; label: string }[] = (
  Object.keys(ACTIVITY_LEVEL_LABELS) as ActivityLevel[]
).map((value) => ({ value, label: ACTIVITY_LEVEL_LABELS[value] }));
