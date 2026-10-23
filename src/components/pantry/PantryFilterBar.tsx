'use client';

import React from 'react';
import { Input } from '@/components/ui/Input';
import { Search, Filter, Layers } from 'lucide-react';
import { CategoryType, ItemStatus, StorageType } from '@/types';
import { cn } from '@/lib/utils';

interface PantryFilterBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedCategory: CategoryType | 'all';
  onCategoryChange: (category: CategoryType | 'all') => void;
  selectedStorage: StorageType | 'all';
  onStorageChange: (storage: StorageType | 'all') => void;
  selectedStatus: ItemStatus | 'all';
  onStatusChange: (status: ItemStatus | 'all') => void;
}

export function PantryFilterBar({
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  selectedStorage,
  onStorageChange,
  selectedStatus,
  onStatusChange,
}: PantryFilterBarProps) {
  const categories: { label: string; value: CategoryType | 'all' }[] = [
    { label: 'All Categories', value: 'all' },
    { label: 'Produce', value: 'produce' },
    { label: 'Dairy', value: 'dairy' },
    { label: 'Meat & Poultry', value: 'meat' },
    { label: 'Grains & Bread', value: 'grains' },
    { label: 'Pantry Staples', value: 'pantry' },
    { label: 'Frozen', value: 'frozen' },
    { label: 'Other', value: 'other' },
  ];

  const storageOptions: { label: string; value: StorageType | 'all' }[] = [
    { label: 'All Storage', value: 'all' },
    { label: 'Fridge', value: 'fridge' },
    { label: 'Freezer', value: 'freezer' },
    { label: 'Pantry Shelf', value: 'shelf' },
  ];

  const statusOptions: { label: string; value: ItemStatus | 'all' }[] = [
    { label: 'Active Items', value: 'active' },
    { label: 'Marked Used', value: 'used' },
    { label: 'Marked Wasted', value: 'wasted' },
    { label: 'All Items', value: 'all' },
  ];

  return (
    <div className="space-y-3.5 bg-white dark:bg-slate-900/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-subtle">
      {/* Search and Dropdowns Row */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
        <div className="sm:col-span-6">
          <Input
            placeholder="Search items by name..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            leftIcon={<Search className="w-4 h-4 text-slate-400" />}
          />
        </div>

        <div className="sm:col-span-3">
          <select
            value={selectedCategory}
            onChange={(e) => onCategoryChange(e.target.value as CategoryType | 'all')}
            aria-label="Filter by category"
            className="flex h-10 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          >
            {categories.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        <div className="sm:col-span-3">
          <select
            value={selectedStorage}
            onChange={(e) => onStorageChange(e.target.value as StorageType | 'all')}
            aria-label="Filter by storage"
            className="flex h-10 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          >
            {storageOptions.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Status Segmented Control */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 mr-1 shrink-0 flex items-center gap-1">
          <Filter className="w-3.5 h-3.5" /> Status:
        </span>
        {statusOptions.map((opt) => {
          const isSelected = selectedStatus === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onStatusChange(opt.value)}
              className={cn(
                'px-3 py-1 text-xs font-medium rounded-lg transition-colors whitespace-nowrap cursor-pointer',
                isSelected
                  ? 'bg-emerald-600 text-white font-semibold shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
              )}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
