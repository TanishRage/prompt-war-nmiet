import { describe, it, expect } from 'vitest';
import { pantryItemSchema } from '../src/lib/schemas';

describe('Pantry Item Zod Validation Schema', () => {
  const validItem = {
    name: 'Organic Whole Milk',
    quantity: 1,
    unit: 'l',
    category: 'dairy',
    storage: 'fridge',
    addedAt: '2026-10-23T12:00:00.000Z',
    expiresAt: '2026-10-30T12:00:00.000Z',
    status: 'active',
    source: 'manual',
  };

  it('validates a correct pantry item payload', () => {
    const result = pantryItemSchema.safeParse(validItem);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe('Organic Whole Milk');
      expect(result.data.quantity).toBe(1);
    }
  });

  it('trims leading and trailing whitespace from the item name', () => {
    const untrimmed = { ...validItem, name: '  Fresh Spinach  ' };
    const result = pantryItemSchema.safeParse(untrimmed);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe('Fresh Spinach');
    }
  });

  it('rejects an empty item name', () => {
    const emptyName = { ...validItem, name: '   ' };
    const result = pantryItemSchema.safeParse(emptyName);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.name).toContain('Item name is required');
    }
  });

  it('rejects an item name longer than 60 characters', () => {
    const longName = { ...validItem, name: 'A'.repeat(61) };
    const result = pantryItemSchema.safeParse(longName);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.name).toContain(
        'Item name must not exceed 60 characters'
      );
    }
  });

  it('rejects negative or zero quantity (< 0.1)', () => {
    const negative = { ...validItem, quantity: 0 };
    const result = pantryItemSchema.safeParse(negative);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.quantity).toContain('Quantity must be at least 0.1');
    }
  });

  it('rejects absurd quantities (> 1000)', () => {
    const absurd = { ...validItem, quantity: 1000.5 };
    const result = pantryItemSchema.safeParse(absurd);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.quantity).toContain('Quantity cannot exceed 1000');
    }
  });

  it('rejects invalid enum values for unit, category, and storage', () => {
    const badUnit = { ...validItem, unit: 'gallons' };
    expect(pantryItemSchema.safeParse(badUnit).success).toBe(false);

    const badCat = { ...validItem, category: 'junk' };
    expect(pantryItemSchema.safeParse(badCat).success).toBe(false);

    const badStorage = { ...validItem, storage: 'cellar' };
    expect(pantryItemSchema.safeParse(badStorage).success).toBe(false);
  });

  it('rejects expiry date that is more than 1 year before addedAt', () => {
    const moreThanOneYearBefore = {
      ...validItem,
      addedAt: '2026-10-23T12:00:00.000Z',
      expiresAt: '2025-10-20T12:00:00.000Z', // 368 days before addedAt
    };
    const result = pantryItemSchema.safeParse(moreThanOneYearBefore);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.expiresAt).toContain(
        'Expiry date cannot be more than 1 year before the date added'
      );
    }
  });

  it('allows expiry within 1 year before addedAt (e.g. tracking already-expired food)', () => {
    const expiredRecently = {
      ...validItem,
      addedAt: '2026-10-23T12:00:00.000Z',
      expiresAt: '2026-10-20T12:00:00.000Z', // 3 days before addedAt
    };
    const result = pantryItemSchema.safeParse(expiredRecently);
    expect(result.success).toBe(true);
  });

  it('sets default values for status and source if not provided', () => {
    const itemWithoutDefaults = {
      name: 'Apples',
      quantity: 5,
      unit: 'pcs',
      category: 'produce',
      storage: 'shelf',
      addedAt: '2026-10-23T12:00:00.000Z',
      expiresAt: '2026-10-30T12:00:00.000Z',
    };
    const result = pantryItemSchema.safeParse(itemWithoutDefaults);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.status).toBe('active');
      expect(result.data.source).toBe('manual');
    }
  });
});
