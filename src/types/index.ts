export type UnitType = 'g' | 'kg' | 'ml' | 'l' | 'pcs';

export type CategoryType =
  | 'produce'
  | 'dairy'
  | 'meat'
  | 'grains'
  | 'pantry'
  | 'frozen'
  | 'other';

export type StorageType = 'fridge' | 'freezer' | 'shelf';

export type ItemStatus = 'active' | 'used' | 'wasted';

export type ItemSource = 'manual' | 'ai';

export type ExpiryStatus = 'fresh' | 'expiring' | 'expired';

export interface PantryItem {
  id: string;
  name: string;
  quantity: number;
  unit: UnitType;
  category: CategoryType;
  storage: StorageType;
  addedAt: string; // ISO string format
  expiresAt: string; // ISO string format
  status: ItemStatus;
  source: ItemSource;
}

export type PantryItemInput = Omit<PantryItem, 'id'>;

// Reserved for future meal planning prompt
export interface MealPlanDay {
  date: string;
  meals: {
    mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
    recipeName: string;
    pantryItemIdsUsed: string[];
    servings: number;
    notes?: string;
  }[];
}

export interface MealPlan {
  id: string;
  createdAt: string;
  startDate: string;
  endDate: string;
  status: 'active' | 'completed' | 'archived';
  days: MealPlanDay[];
  generatedByAi: boolean;
}

export interface ShelfLifeSuggestion {
  name: string;
  category: CategoryType;
  storage: StorageType;
  shelfLifeDays: number;
}
