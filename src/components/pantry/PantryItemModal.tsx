'use client';

import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import {
  PantryItem,
  PantryItemInput,
  CategoryType,
  StorageType,
  UnitType,
} from '@/types';
import { pantryItemSchema } from '@/lib/schemas';
import shelfLifeData from '@/data/shelfLife.json';
import { Sparkles, Calendar } from 'lucide-react';

interface PantryItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (itemData: PantryItemInput) => Promise<void>;
  initialItem?: PantryItem | null;
}

export function PantryItemModal({
  isOpen,
  onClose,
  onSubmit,
  initialItem,
}: PantryItemModalProps) {
  const isEditing = Boolean(initialItem);

  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState<string>('1');
  const [unit, setUnit] = useState<UnitType>('pcs');
  const [category, setCategory] = useState<CategoryType>('produce');
  const [storage, setStorage] = useState<StorageType>('fridge');
  const [addedAtDate, setAddedAtDate] = useState<string>('');
  const [expiresAtDate, setExpiresAtDate] = useState<string>('');
  const [isAutoSuggested, setIsAutoSuggested] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Sync state when modal opens or initialItem changes
  useEffect(() => {
    if (isOpen) {
      if (initialItem) {
        setName(initialItem.name);
        setQuantity(String(initialItem.quantity));
        setUnit(initialItem.unit);
        setCategory(initialItem.category);
        setStorage(initialItem.storage);
        setAddedAtDate(initialItem.addedAt.substring(0, 10));
        setExpiresAtDate(initialItem.expiresAt.substring(0, 10));
        setIsAutoSuggested(false);
      } else {
        const todayStr = new Date().toISOString().substring(0, 10);
        setName('');
        setQuantity('1');
        setUnit('pcs');
        setCategory('produce');
        setStorage('fridge');
        setAddedAtDate(todayStr);
        setExpiresAtDate('');
        setIsAutoSuggested(false);
      }
      setErrors({});
    }
  }, [isOpen, initialItem]);

  // Shelf-life auto-suggest logic
  const handleNameChange = (newName: string) => {
    setName(newName);
    // If not editing, check for shelf life match
    if (!initialItem && newName.trim().length >= 2) {
      const lower = newName.trim().toLowerCase();
      const match = shelfLifeData.find(
        (item) =>
          item.name.toLowerCase().includes(lower) || lower.includes(item.name.toLowerCase())
      );

      if (match) {
        setCategory(match.category as CategoryType);
        setStorage(match.storage as StorageType);
        // Calculate recommended expiry date based on shelfLifeDays
        const baseDate = addedAtDate ? new Date(addedAtDate) : new Date();
        const suggestedDate = new Date(baseDate.getTime() + match.shelfLifeDays * 86400000);
        setExpiresAtDate(suggestedDate.toISOString().substring(0, 10));
        setIsAutoSuggested(true);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // If expiresAt is still empty, compute fallback shelf-life based on category and storage
    let finalExpiryStr = expiresAtDate;
    if (!finalExpiryStr) {
      const categoryMatch = shelfLifeData.find(
        (i) => i.category === category && i.storage === storage
      );
      const days = categoryMatch ? categoryMatch.shelfLifeDays : 7;
      const baseDate = addedAtDate ? new Date(addedAtDate) : new Date();
      const computedDate = new Date(baseDate.getTime() + days * 86400000);
      finalExpiryStr = computedDate.toISOString().substring(0, 10);
    }

    const addedAtIso = new Date(addedAtDate || new Date().toISOString()).toISOString();
    const expiresAtIso = new Date(finalExpiryStr).toISOString();

    const payload = {
      name: name.trim(),
      quantity: parseFloat(quantity) || 0,
      unit,
      category,
      storage,
      addedAt: addedAtIso,
      expiresAt: expiresAtIso,
      status: initialItem?.status || 'active',
      source: initialItem?.source || 'manual',
    };

    // Zod validation
    const validation = pantryItemSchema.safeParse(payload);
    if (!validation.success) {
      const fieldErrors: Record<string, string> = {};
      validation.error.issues.forEach((issue) => {
        const fieldName = issue.path[0]?.toString() || 'form';
        fieldErrors[fieldName] = issue.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(payload as PantryItemInput);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Pantry Item' : 'Add to Pantry'}
      description={
        isEditing
          ? 'Update the quantity, storage, or expiry date of this item.'
          : 'Track an ingredient to prevent spoilage and food waste.'
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Item Name */}
        <div>
          <Input
            label="Item Name"
            placeholder="e.g. Organic Whole Milk, Greek Yogurt, Spinach"
            value={name}
            onChange={(e) => handleNameChange(e.target.value)}
            error={errors.name}
            required
            autoFocus
          />
          {isAutoSuggested && (
            <p className="mt-1 flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
              <Sparkles className="w-3.5 h-3.5" />
              Auto-suggested expiry based on standard shelf life (feel free to adjust)
            </p>
          )}
        </div>

        {/* Quantity & Unit Row */}
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Quantity"
            type="number"
            step="0.1"
            min="0.1"
            max="1000"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            error={errors.quantity}
            required
          />

          <div className="space-y-1.5 text-left">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Unit
            </label>
            <select
              value={unit}
              onChange={(e) => setUnit(e.target.value as UnitType)}
              className="flex h-10 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            >
              <option value="pcs">Pieces (pcs)</option>
              <option value="g">Grams (g)</option>
              <option value="kg">Kilograms (kg)</option>
              <option value="ml">Milliliters (ml)</option>
              <option value="l">Liters (l)</option>
            </select>
          </div>
        </div>

        {/* Category & Storage Row */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5 text-left">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as CategoryType)}
              className="flex h-10 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 capitalize"
            >
              <option value="produce">Produce</option>
              <option value="dairy">Dairy</option>
              <option value="meat">Meat & Poultry</option>
              <option value="grains">Grains & Bread</option>
              <option value="pantry">Pantry Staples</option>
              <option value="frozen">Frozen Foods</option>
              <option value="other">Other</option>
            </select>
            {errors.category && <p className="text-xs text-red-500">{errors.category}</p>}
          </div>

          <div className="space-y-1.5 text-left">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Storage Location
            </label>
            <select
              value={storage}
              onChange={(e) => setStorage(e.target.value as StorageType)}
              className="flex h-10 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 capitalize"
            >
              <option value="fridge">Fridge</option>
              <option value="freezer">Freezer</option>
              <option value="shelf">Pantry Shelf</option>
            </select>
            {errors.storage && <p className="text-xs text-red-500">{errors.storage}</p>}
          </div>
        </div>

        {/* Added At & Expiry Dates */}
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Date Added"
            type="date"
            value={addedAtDate}
            onChange={(e) => setAddedAtDate(e.target.value)}
            error={errors.addedAt}
            required
          />

          <Input
            label="Expiry Date"
            type="date"
            value={expiresAtDate}
            onChange={(e) => {
              setExpiresAtDate(e.target.value);
              setIsAutoSuggested(false);
            }}
            error={errors.expiresAt}
            helperText={!expiresAtDate ? 'Auto-calculated if blank' : undefined}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isSubmitting}>
            {isEditing ? 'Save Changes' : 'Add Item'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
