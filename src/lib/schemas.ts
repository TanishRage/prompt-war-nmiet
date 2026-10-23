import { z } from 'zod';

export const unitEnum = z.enum(['g', 'kg', 'ml', 'l', 'pcs'], {
  errorMap: () => ({ message: 'Unit must be g, kg, ml, l, or pcs' }),
});

export const categoryEnum = z.enum(
  ['produce', 'dairy', 'meat', 'grains', 'pantry', 'frozen', 'other'],
  {
    errorMap: () => ({ message: 'Please select a valid category' }),
  }
);

export const storageEnum = z.enum(['fridge', 'freezer', 'shelf'], {
  errorMap: () => ({ message: 'Please select storage location' }),
});

export const itemStatusEnum = z.enum(['active', 'used', 'wasted'], {
  errorMap: () => ({ message: 'Invalid status' }),
});

export const itemSourceEnum = z.enum(['manual', 'ai'], {
  errorMap: () => ({ message: 'Invalid source' }),
});

export const basePantryItemSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Item name is required')
    .max(60, 'Item name must not exceed 60 characters'),
  quantity: z.coerce
    .number({ invalid_type_error: 'Quantity must be a valid number' })
    .min(0.1, 'Quantity must be at least 0.1')
    .max(1000, 'Quantity cannot exceed 1000'),
  unit: unitEnum,
  category: categoryEnum,
  storage: storageEnum,
  addedAt: z.string().datetime({ message: 'Added date must be a valid ISO timestamp' }),
  expiresAt: z.string().datetime({ message: 'Expiry date must be a valid ISO timestamp' }),
  status: itemStatusEnum.default('active'),
  source: itemSourceEnum.default('manual'),
});

export const pantryItemSchema = basePantryItemSchema.refine(
  (data) => {
    const added = new Date(data.addedAt).getTime();
    const expires = new Date(data.expiresAt).getTime();
    const oneYearInMs = 365 * 24 * 60 * 60 * 1000;
    // Expiry cannot be before addedAt by more than 1 year
    return expires >= added - oneYearInMs;
  },
  {
    message: 'Expiry date cannot be more than 1 year before the date added',
    path: ['expiresAt'],
  }
);

export type PantryItemFormData = z.infer<typeof pantryItemSchema>;

export const pantryItemUpdateSchema = basePantryItemSchema.partial();
