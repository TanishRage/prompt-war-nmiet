import { PantryItem, MealPlan } from '@/types';

export interface PlanImpact {
  totalItemsUsed: number;
  expiringItemsSaved: number;
  estimatedMoneySavedUSD: number;
  foodWasteDivertedKg: number;
  carbonFootprintPreventedKgCo2: number;
  projectedWasteReductionPct: number;
}

// Average estimated value per category per unit
const ESTIMATED_UNIT_VALUES_USD: Record<string, number> = {
  meat: 8.5, // ~$8.50 per unit/pack
  dairy: 3.2,
  produce: 2.5,
  grains: 1.8,
  pantry: 3.0,
  frozen: 4.0,
  other: 2.5,
};

// CO2 emission factor per kg of food waste prevented (avg ~2.5 kg CO2e / kg food)
const CO2_FACTOR_PER_KG_FOOD = 2.5;

/**
 * Calculate the projected waste, financial, and environmental impact of a meal plan.
 */
export function calculatePlanImpact(
  pantryItems: PantryItem[],
  recipeItemNamesUsed: string[]
): PlanImpact {
  const normalizedUsed = new Set(
    recipeItemNamesUsed.map((n) => n.trim().toLowerCase())
  );

  let itemsUsedCount = 0;
  let expiringSavedCount = 0;
  let estimatedMoneySaved = 0;
  let divertedKg = 0;

  const now = Date.now();
  const threeDaysMs = 3 * 24 * 60 * 60 * 1000;

  pantryItems.forEach((item) => {
    const itemNameNorm = item.name.trim().toLowerCase();
    const isUsed =
      normalizedUsed.has(itemNameNorm) ||
      Array.from(normalizedUsed).some(
        (usedName) => usedName.includes(itemNameNorm) || itemNameNorm.includes(usedName)
      );

    if (isUsed) {
      itemsUsedCount++;

      const expiryTime = new Date(item.expiresAt).getTime();
      const diffMs = expiryTime - now;

      // Expiring soon (within next 3 days or already slightly overdue)
      if (diffMs <= threeDaysMs) {
        expiringSavedCount++;
      }

      // Money saved
      const baseValue = ESTIMATED_UNIT_VALUES_USD[item.category] || 2.5;
      estimatedMoneySaved += baseValue;

      // Weight approximation in kg
      if (item.unit === 'kg') {
        divertedKg += item.quantity;
      } else if (item.unit === 'g') {
        divertedKg += item.quantity / 1000;
      } else if (item.unit === 'l') {
        divertedKg += item.quantity * 1.0;
      } else if (item.unit === 'ml') {
        divertedKg += (item.quantity * 1.0) / 1000;
      } else {
        // pcs: approx 0.15kg per piece on average
        divertedKg += item.quantity * 0.15;
      }
    }
  });

  const totalActive = pantryItems.filter((i) => i.status === 'active').length;
  const projectedWasteReductionPct =
    totalActive > 0 ? Math.min(100, Math.round((itemsUsedCount / totalActive) * 100)) : 100;

  const co2Saved = Math.round(divertedKg * CO2_FACTOR_PER_KG_FOOD * 10) / 10;

  return {
    totalItemsUsed: itemsUsedCount,
    expiringItemsSaved: expiringSavedCount,
    estimatedMoneySavedUSD: Math.round(estimatedMoneySaved * 100) / 100,
    foodWasteDivertedKg: Math.round(divertedKg * 100) / 100,
    carbonFootprintPreventedKgCo2: co2Saved,
    projectedWasteReductionPct,
  };
}

/**
 * Calculate household metrics from historical used vs wasted items.
 */
export function calculateHistoricalMetrics(items: PantryItem[]) {
  const used = items.filter((i) => i.status === 'used');
  const wasted = items.filter((i) => i.status === 'wasted');
  const totalClosed = used.length + wasted.length;

  const wasteReductionRate =
    totalClosed > 0 ? Math.round((used.length / totalClosed) * 100) : 0;

  const savingsUSD = used.reduce((acc, item) => {
    const val = ESTIMATED_UNIT_VALUES_USD[item.category] || 2.5;
    return acc + val;
  }, 0);

  const wastedCostUSD = wasted.reduce((acc, item) => {
    const val = ESTIMATED_UNIT_VALUES_USD[item.category] || 2.5;
    return acc + val;
  }, 0);

  return {
    wasteReductionRate,
    savingsUSD: Math.round(savingsUSD * 100) / 100,
    wastedCostUSD: Math.round(wastedCostUSD * 100) / 100,
    usedCount: used.length,
    wastedCount: wasted.length,
  };
}
