'use client';

import React from 'react';
import { PantryItem } from '@/types';
import { getExpiryStatus, formatExpiryLabel } from '@/lib/expiry';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import {
  Check,
  Trash2,
  Edit2,
  Calendar,
  Layers,
  ThermometerSnowflake,
  Refrigerator,
  Package,
  Sparkles,
} from 'lucide-react';

interface PantryItemCardProps {
  item: PantryItem;
  onEdit: (item: PantryItem) => void;
  onDelete: (item: PantryItem) => void;
  onMarkUsed: (item: PantryItem) => void;
  onMarkWasted: (item: PantryItem) => void;
}

export function PantryItemCard({
  item,
  onEdit,
  onDelete,
  onMarkUsed,
  onMarkWasted,
}: PantryItemCardProps) {
  const expiryStatus = getExpiryStatus(item.expiresAt);
  const expiryLabel = formatExpiryLabel(item.expiresAt);

  const storageIcons = {
    fridge: <Refrigerator className="w-3.5 h-3.5" />,
    freezer: <ThermometerSnowflake className="w-3.5 h-3.5" />,
    shelf: <Package className="w-3.5 h-3.5" />,
  };

  const categoryLabels: Record<string, string> = {
    produce: 'Produce',
    dairy: 'Dairy',
    meat: 'Meat & Poultry',
    grains: 'Grains & Bread',
    pantry: 'Pantry Staples',
    frozen: 'Frozen',
    other: 'Other',
  };

  return (
    <Card className="flex flex-col justify-between overflow-hidden hover:shadow-card transition-shadow border-slate-200 dark:border-slate-800">
      <div className="p-4 sm:p-5">
        {/* Header row: Categories and Badges */}
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <div className="flex items-center gap-1.5 flex-wrap">
            <Badge variant="outline" size="sm" className="capitalize">
              {categoryLabels[item.category] || item.category}
            </Badge>
            <Badge variant="storage" size="sm" className="capitalize flex items-center gap-1">
              {storageIcons[item.storage]}
              <span>{item.storage}</span>
            </Badge>
            {item.source === 'ai' && (
              <Badge variant="info" size="sm" className="flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                <span>AI</span>
              </Badge>
            )}
          </div>

          <Badge variant={expiryStatus} size="sm">
            {expiryLabel}
          </Badge>
        </div>

        {/* Item Title & Quantity */}
        <div className="flex items-baseline justify-between gap-2 mt-1">
          <h4 className="text-base font-bold text-slate-900 dark:text-white truncate" title={item.name}>
            {item.name}
          </h4>
          <span className="shrink-0 text-sm font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md">
            {item.quantity} {item.unit}
          </span>
        </div>

        {/* Date metadata */}
        <div className="mt-3.5 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>
              Expires: {new Date(item.expiresAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
          </div>
          {item.status !== 'active' && (
            <span className={item.status === 'used' ? 'text-emerald-600 font-medium capitalize' : 'text-red-500 font-medium capitalize'}>
              {item.status}
            </span>
          )}
        </div>
      </div>

      {/* Action Toolbar */}
      <div className="px-4 py-3 bg-slate-50/80 dark:bg-slate-900/60 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-1">
        {item.status === 'active' ? (
          <div className="flex items-center gap-1.5 flex-1">
            <Button
              size="sm"
              variant="outline"
              onClick={() => onMarkUsed(item)}
              className="text-xs text-emerald-700 border-emerald-300 hover:bg-emerald-50 dark:text-emerald-400 dark:border-emerald-800 dark:hover:bg-emerald-950/50 py-1 px-2.5 h-8 flex-1"
              title="Mark as consumed"
            >
              <Check className="w-3.5 h-3.5 mr-1" />
              <span>Used</span>
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onMarkWasted(item)}
              className="text-xs text-red-700 border-red-300 hover:bg-red-50 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-950/50 py-1 px-2.5 h-8 flex-1"
              title="Mark as thrown away / wasted"
            >
              <Trash2 className="w-3.5 h-3.5 mr-1" />
              <span>Wasted</span>
            </Button>
          </div>
        ) : (
          <span className="text-xs italic text-slate-400">Archived item</span>
        )}

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onEdit(item)}
            aria-label={`Edit ${item.name}`}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-200 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800 transition-colors"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => onDelete(item)}
            aria-label={`Delete ${item.name}`}
            className="p-1.5 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 dark:text-slate-400 dark:hover:text-red-400 dark:hover:bg-red-950/40 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </Card>
  );
}
