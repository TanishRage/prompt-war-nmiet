import { z } from 'zod';
import { unitEnum, categoryEnum, storageEnum } from '@/lib/schemas';

// Max 4MB in binary = ~5.4MB in base64
const MAX_BASE64_LENGTH = 5.5 * 1024 * 1024;

export const agentInputSchema = z.object({
  mode: z.enum(['scan', 'plan'], {
    required_error: 'Mode must be either scan or plan',
  }),
  goal: z
    .string()
    .trim()
    .max(200, 'Goal must be 200 characters or fewer')
    .optional(),
  image: z
    .string()
    .max(MAX_BASE64_LENGTH, 'Image exceeds maximum size limit of 4MB')
    .refine(
      (val) => {
        if (!val) return true;
        // Data URL or raw base64
        return (
          val.startsWith('data:image/') ||
          /^[A-Za-z0-9+/=]+$/.test(val.slice(0, 100))
        );
      },
      {
        message: 'Image must be a valid base64 encoded JPEG, PNG, or WebP',
      }
    )
    .optional(),
});

export type AgentInput = z.infer<typeof agentInputSchema>;

// Tool 1: identify_items
export const identifiedItemSchema = z.object({
  name: z.string().trim().min(1).max(60),
  quantity: z.number().min(0.1).max(1000),
  unit: unitEnum,
  category: categoryEnum,
  storage: storageEnum,
});

export const identifyItemsOutputSchema = z.array(identifiedItemSchema);
export type IdentifiedItem = z.infer<typeof identifiedItemSchema>;

// Tool 2: estimate_expiry
export const estimatedExpiryItemSchema = z.object({
  name: z.string(),
  shelfLifeDays: z.number().min(1),
  suggestedExpiryDate: z.string(), // ISO string
});

export const estimateExpiryOutputSchema = z.array(estimatedExpiryItemSchema);
export type EstimatedExpiryItem = z.infer<typeof estimatedExpiryItemSchema>;

// Tool 4: search_recipes
export const recipeIngredientSchema = z.object({
  name: z.string(),
  quantity: z.number(),
  unit: z.string(),
  category: z.string().optional(),
});

export const recipeSchema = z.object({
  id: z.string(),
  name: z.string(),
  mealType: z.enum(['breakfast', 'lunch', 'dinner']),
  prepTimeMinutes: z.number(),
  servings: z.number(),
  ingredients: z.array(recipeIngredientSchema),
  instructions: z.string(),
  matchedExpiringItems: z.array(z.string()).default([]),
  missingIngredientsCount: z.number().default(0),
});

export const searchRecipesOutputSchema = z.array(recipeSchema);
export type MatchedRecipe = z.infer<typeof recipeSchema>;

// Tool 6: build_plan
export const planMealSchema = z.object({
  mealType: z.enum(['breakfast', 'lunch', 'dinner']),
  recipeName: z.string().trim().min(1).max(100),
  usedPantryItems: z.array(z.string()),
  missingIngredients: z.array(z.string()),
  instructions: z.string(),
});

export const planDaySchema = z.object({
  day: z.number().int().min(1).max(3),
  dayName: z.string(),
  date: z.string(),
  meals: z.array(planMealSchema),
});

export const shoppingItemSchema = z.object({
  name: z.string(),
  quantity: z.number(),
  unit: z.string(),
});

export const planImpactSchema = z.object({
  totalItemsUsed: z.number(),
  expiringItemsSaved: z.number(),
  estimatedMoneySavedUSD: z.number(),
  foodWasteDivertedKg: z.number(),
  carbonFootprintPreventedKgCo2: z.number(),
  projectedWasteReductionPct: z.number(),
});

export const mealPlanResultSchema = z.object({
  planTitle: z.string(),
  days: z.array(planDaySchema).length(3, 'Plan must cover exactly 3 days'),
  shoppingList: z.array(shoppingItemSchema),
  projectedImpact: planImpactSchema,
  summary: z.string(),
});

export type MealPlanResult = z.infer<typeof mealPlanResultSchema>;
export type PlanDay = z.infer<typeof planDaySchema>;
export type PlanMeal = z.infer<typeof planMealSchema>;
