'use client';

import React from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { PantryItem } from '@/types';
import { AlertTriangle } from 'lucide-react';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  item: PantryItem | null;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  isDeleting: boolean;
}

export function DeleteConfirmModal({
  isOpen,
  item,
  onClose,
  onConfirm,
  isDeleting,
}: DeleteConfirmModalProps) {
  if (!item) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Delete Pantry Item"
      maxWidth="sm"
    >
      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-full bg-red-100 text-red-600 dark:bg-red-950/60 dark:text-red-400 shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="text-sm text-slate-600 dark:text-slate-300">
            <p>
              Are you sure you want to delete{' '}
              <strong className="text-slate-900 dark:text-white font-semibold">
                &ldquo;{item.name}&rdquo;
              </strong>
              ?
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              This action cannot be undone. If you consumed or discarded it, consider marking it as
              Used or Wasted instead to keep your insights accurate.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
          <Button variant="outline" onClick={onClose} disabled={isDeleting}>
            Cancel
          </Button>
          <Button variant="danger" onClick={onConfirm} isLoading={isDeleting}>
            Delete Item
          </Button>
        </div>
      </div>
    </Modal>
  );
}
