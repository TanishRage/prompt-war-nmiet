import shelfLifeData from '@/data/shelfLife.json';
import recipesData from '@/data/recipes.json';
import { getServerPantryItems } from '@/lib/firebaseAdmin';
import { calculatePlanImpact } from '@/lib/insights';
import {
  identifyItemsOutputSchema,
  estimateExpiryOutputSchema,
  searchRecipesOutputSchema,
  mealPlanResultSchema,
  IdentifiedItem,
  EstimatedExpiryItem,
  MatchedRecipe,
  MealPlanResult,
} from './schemas';
import { PantryItem, ShelfLifeSuggestion } from '@/types';

// Strip control characters for security
export function sanitizeText(text: string): string {
  if (typeof text !== 'string') return '';
  // Remove control characters except standard whitespace \n \r \t
  return text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '').trim();
}

/**
 * Tool 1: identify_items
 * Fallback/deterministic parser or vision extractor validation
 */
export async function toolIdentifyItems(rawItems: unknown): Promise<IdentifiedItem[]> {
  const sanitized = Array.isArray(rawItems)
    ? rawItems.map((item: any) => ({
        name: sanitizeText(item.name || '').slice(0, 60),
        quantity: typeof item.quantity === 'number' ? item.quantity : 1,
        unit: item.unit || 'pcs',
        category: item.category || 'other',
        storage: item.storage || 'fridge',
      }))
    : [];

  const parsed = identifyItemsOutputSchema.parse(sanitized);
  return parsed;
}

/**
 * Tool 2: estimate_expiry
 * Deterministic lookup from shelfLife.json
 */
export function toolEstimateExpiry(
  items: Array<{ name: string; category?: string; storage?: string }>
): EstimatedExpiryItem[] {
  const shelfList = shelfLifeData as ShelfLifeSuggestion[];
  const now = new Date();

  const results: EstimatedExpiryItem[] = items.map((item) => {
    const cleanName = sanitizeText(item.name).toLowerCase();
    const cleanCat = item.category ? sanitizeText(item.category).toLowerCase() : '';
    const cleanStorage = item.storage ? sanitizeText(item.storage).toLowerCase() : '';

    // Match shelfLife list by exact name or substring
    const match = shelfList.find((entry) => {
      const entryName = entry.name.toLowerCase();
      const storageMatch = !cleanStorage || entry.storage.toLowerCase() === cleanStorage;
      const catMatch = !cleanCat || entry.category.toLowerCase() === cleanCat;

      const nameMatch =
        cleanName === entryName ||
        cleanName.includes(entryName) ||
        entryName.includes(cleanName);

      return nameMatch && storageMatch && catMatch;
    }) || shelfList.find((entry) => {
      const entryName = entry.name.toLowerCase();
      return cleanName.includes(entryName) || entryName.includes(cleanName);
    });

    const shelfLifeDays = match ? match.shelfLifeDays : 7; // Default 7 days
    const expiryDate = new Date(now.getTime() + shelfLifeDays * 24 * 60 * 60 * 1000);

    return {
      name: item.name,
      shelfLifeDays,
      suggestedExpiryDate: expiryDate.toISOString(),
    };
  });

  return estimateExpiryOutputSchema.parse(results);
}

/**
 * Tool 3: get_pantry
 * Reads user's active items from Firestore, strictly scoped to verified UID.
 */
export async function toolGetPantry(uid: string): Promise<PantryItem[]> {
  if (!uid) return [];
  const items = await getServerPantryItems(uid);
  return items.filter((i) => i.status === 'active');
}

/**
 * Tool 4: search_recipes
 * Matches src/data/recipes.json and ranks by use of soonest-expiring items.
 */
export function toolSearchRecipes(
  pantryItems: PantryItem[],
  maxResults = 8
): MatchedRecipe[] {
  const recipes = recipesData as any[];
  const now = Date.now();
  const threeDaysMs = 3 * 86400000;

  // Identify expiring items
  const expiringItems = pantryItems.filter((i) => {
    const diff = new Date(i.expiresAt).getTime() - now;
    return diff <= threeDaysMs;
  });

  const pantryNames = pantryItems.map((i) => i.name.toLowerCase().trim());
  const expiringNames = expiringItems.map((i) => i.name.toLowerCase().trim());

  const scoredRecipes = recipes.map((recipe) => {
    const matchedExpiring: string[] = [];
    let matchedTotalCount = 0;
    let missingCount = 0;

    recipe.ingredients.forEach((ing: any) => {
      const ingName = ing.name.toLowerCase().trim();
      const isExpiringMatch = expiringNames.some(
        (exp) => exp.includes(ingName) || ingName.includes(exp)
      );
      const isPantryMatch = pantryNames.some(
        (p) => p.includes(ingName) || ingName.includes(p)
      );

      if (isExpiringMatch) {
        matchedExpiring.push(ing.name);
        matchedTotalCount++;
      } else if (isPantryMatch) {
        matchedTotalCount++;
      } else {
        missingCount++;
      }
    });

    // Score priority: expiring items matches have highest weight (+10 each), total matches (+3), missing items (-1)
    const score = matchedExpiring.length * 10 + matchedTotalCount * 3 - missingCount * 1;

    return {
      id: recipe.id,
      name: recipe.name,
      mealType: recipe.mealType,
      prepTimeMinutes: recipe.prepTimeMinutes,
      servings: recipe.servings,
      ingredients: recipe.ingredients,
      instructions: recipe.instructions,
      matchedExpiringItems: matchedExpiring,
      missingIngredientsCount: missingCount,
      score,
    };
  });

  // Sort descending by score
  scoredRecipes.sort((a, b) => b.score - a.score);

  const cleanResults = scoredRecipes.slice(0, maxResults).map(({ score, ...r }) => r);
  return searchRecipesOutputSchema.parse(cleanResults);
}

/**
 * Tool 5: calc_impact
 * Reuses insights.ts functions
 */
export function toolCalcImpact(
  pantryItems: PantryItem[],
  usedRecipeIngredientNames: string[]
) {
  return calculatePlanImpact(pantryItems, usedRecipeIngredientNames);
}

/**
 * Tool 6: build_plan
 * Validates and normalizes 3-day meal plan + shopping gaps
 */
export function toolBuildPlan(rawPlan: unknown): MealPlanResult {
  return mealPlanResultSchema.parse(rawPlan);
}
