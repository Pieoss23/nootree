import { z } from "zod";

const optionalTrimmed = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((value) => (value ? value : null));

const requiredNumber = (min: number, max: number) =>
  z
    .string()
    .trim()
    .min(1, "Campo obbligatorio")
    .transform((value) => Number(value.replace(",", ".")))
    .pipe(z.number().min(min).max(max));

export const recipeFormSchema = z.object({
  name: z.string().trim().min(1, "Il nome è obbligatorio").max(160),
  instructions: optionalTrimmed(4000),
});

export type RecipeFormValues = z.infer<typeof recipeFormSchema>;

/**
 * `ingredientRef` codifica in un solo valore (per un singolo <select>) quale
 * delle due fonti polimorfiche è stata scelta — es. "food:<uuid>" o
 * "product:<uuid>" — parsificato qui, non lasciato come stringa opaca al
 * repository. Vedi il vincolo `check` a livello DB in
 * `src/db/schema/recipes.ts` che impone comunque esattamente una fonte.
 */
export const recipeIngredientFormSchema = z
  .object({
    ingredientRef: z
      .string()
      .trim()
      .regex(/^(food|product):.+$/, "Seleziona un ingrediente"),
    quantityGrams: requiredNumber(1, 5000),
  })
  .transform((value) => {
    const [kind, id] = value.ingredientRef.split(":", 2);
    return {
      foodItemId: kind === "food" ? id : null,
      tenantProductId: kind === "product" ? id : null,
      quantityGrams: value.quantityGrams,
    };
  });

export type RecipeIngredientFormValues = z.infer<typeof recipeIngredientFormSchema>;

export const patientRecipeFormSchema = z.object({
  recipeId: z.string().trim().min(1, "Seleziona una ricetta"),
  portionGrams: requiredNumber(1, 5000),
  suggestedPortionGrams: z
    .string()
    .trim()
    .optional()
    .transform((value) => (value ? Number(value.replace(",", ".")) : null)),
  notes: optionalTrimmed(2000),
});

export type PatientRecipeFormValues = z.infer<typeof patientRecipeFormSchema>;
