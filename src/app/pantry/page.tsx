'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import {
  fetchPantryItems,
  addPantryItem,
  updatePantryItem,
  deletePantryItem,
  updatePantryItemStatus,
} from '@/lib/pantryRepo';
import {
  PantryItem,
  PantryItemInput,
  CategoryType,
  StorageType,
  ItemStatus,
} from '@/types';
import { PantryItemCard } from '@/components/pantry/PantryItemCard';
import { PantryItemModal } from '@/components/pantry/PantryItemModal';
import { PantryFilterBar } from '@/components/pantry/PantryFilterBar';
import { DeleteConfirmModal } from '@/components/pantry/DeleteConfirmModal';
import { EmptyState } from '@/components/ui/EmptyState';
import { PantryCardSkeleton } from '@/components/ui/Skeleton';
import { Button } from '@/components/ui/Button';
import { Plus, Refrigerator, SearchX } from 'lucide-react';

export default function PantryPage() {
  const { user } = useAuth();
  const { success, error } = useToast();

  const [items, setItems] = useState<PantryItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<CategoryType | 'all'>('all');
  const [selectedStorage, setSelectedStorage] = useState<StorageType | 'all'>('all');
  const [selectedStatus, setSelectedStatus] = useState<ItemStatus | 'all'>('active');

  // Modal states
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<PantryItem | null>(null);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingItem, setDeletingItem] = useState<PantryItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Load pantry items
  useEffect(() => {
    async function loadData() {
      if (!user) return;
      try {
        setLoading(true);
        const data = await fetchPantryItems(user.uid);
        setItems(data);
      } catch (err) {
        console.error('Error loading pantry items:', err);
        error('Failed to load pantry items. Please refresh the page.');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [user, error]);

  // Filtering and sorting by soonest expiry
  const filteredItems = useMemo(() => {
    return items
      .filter((item) => {
        // Status match
        if (selectedStatus !== 'all' && item.status !== selectedStatus) {
          return false;
        }
        // Category match
        if (selectedCategory !== 'all' && item.category !== selectedCategory) {
          return false;
        }
        // Storage match
        if (selectedStorage !== 'all' && item.storage !== selectedStorage) {
          return false;
        }
        // Search query match
        if (searchQuery.trim()) {
          const query = searchQuery.toLowerCase();
          const matchName = item.name.toLowerCase().includes(query);
          const matchCategory = item.category.toLowerCase().includes(query);
          if (!matchName && !matchCategory) return false;
        }
        return true;
      })
      .sort((a, b) => new Date(a.expiresAt).getTime() - new Date(b.expiresAt).getTime());
  }, [items, searchQuery, selectedCategory, selectedStorage, selectedStatus]);

  // Open Create Modal
  const handleOpenCreate = () => {
    setEditingItem(null);
    setIsFormModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (item: PantryItem) => {
    setEditingItem(item);
    setIsFormModalOpen(true);
  };

  // Open Delete Modal
  const handleOpenDelete = (item: PantryItem) => {
    setDeletingItem(item);
    setIsDeleteModalOpen(true);
  };

  // Form Submit Handler (Create or Edit) with optimistic update
  const handleFormSubmit = async (itemData: PantryItemInput) => {
    if (!user) return;

    if (editingItem) {
      // Optimistic edit
      const previousItems = [...items];
      const updated: PantryItem = { ...editingItem, ...itemData };
      setItems((prev) => prev.map((i) => (i.id === editingItem.id ? updated : i)));

      try {
        await updatePantryItem(user.uid, editingItem.id, itemData);
        success(`Updated "${itemData.name}" successfully!`);
      } catch (err) {
        setItems(previousItems); // Rollback
        error('Failed to update item. Reverting changes.');
        console.error(err);
      }
    } else {
      // Optimistic create
      const tempId = `temp-${Date.now()}`;
      const optimisticItem: PantryItem = { id: tempId, ...itemData };
      const previousItems = [...items];
      setItems((prev) => [...prev, optimisticItem]);

      try {
        const created = await addPantryItem(user.uid, itemData);
        setItems((prev) => prev.map((i) => (i.id === tempId ? created : i)));
        success(`Added "${itemData.name}" to your pantry!`);
      } catch (err) {
        setItems(previousItems); // Rollback
        error('Failed to add pantry item. Please try again.');
        console.error(err);
      }
    }
  };

  // Quick action: Mark Used with optimistic update
  const handleMarkUsed = async (item: PantryItem) => {
    if (!user) return;
    const previousItems = [...items];
    setItems((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, status: 'used' as ItemStatus } : i))
    );

    try {
      await updatePantryItemStatus(user.uid, item.id, 'used');
      success(`Marked "${item.name}" as used! Great job cutting waste.`);
    } catch (err) {
      setItems(previousItems); // Rollback
      error('Failed to update status. Please try again.');
      console.error(err);
    }
  };

  // Quick action: Mark Wasted with optimistic update
  const handleMarkWasted = async (item: PantryItem) => {
    if (!user) return;
    const previousItems = [...items];
    setItems((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, status: 'wasted' as ItemStatus } : i))
    );

    try {
      await updatePantryItemStatus(user.uid, item.id, 'wasted');
      success(`Marked "${item.name}" as wasted.`);
    } catch (err) {
      setItems(previousItems); // Rollback
      error('Failed to update status. Please try again.');
      console.error(err);
    }
  };

  // Confirm Delete Handler with optimistic update
  const handleConfirmDelete = async () => {
    if (!user || !deletingItem) return;
    setIsDeleting(true);
    const previousItems = [...items];
    setItems((prev) => prev.filter((i) => i.id !== deletingItem.id));

    try {
      await deletePantryItem(user.uid, deletingItem.id);
      success(`Deleted "${deletingItem.name}" from pantry.`);
      setIsDeleteModalOpen(false);
      setDeletingItem(null);
    } catch (err) {
      setItems(previousItems); // Rollback
      error('Failed to delete item. Please try again.');
      console.error(err);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Household Pantry
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Sorted by soonest expiry date so you always know what to cook first.
          </p>
        </div>

        <Button
          variant="primary"
          leftIcon={<Plus className="w-4 h-4" />}
          onClick={handleOpenCreate}
        >
          Add Item
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <PantryFilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        selectedStorage={selectedStorage}
        onStorageChange={setSelectedStorage}
        selectedStatus={selectedStatus}
        onStatusChange={setSelectedStatus}
      />

      {/* Main Pantry Items Grid or States */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <PantryCardSkeleton />
          <PantryCardSkeleton />
          <PantryCardSkeleton />
          <PantryCardSkeleton />
          <PantryCardSkeleton />
          <PantryCardSkeleton />
        </div>
      ) : filteredItems.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map((item) => (
            <PantryItemCard
              key={item.id}
              item={item}
              onEdit={handleOpenEdit}
              onDelete={handleOpenDelete}
              onMarkUsed={handleMarkUsed}
              onMarkWasted={handleMarkWasted}
            />
          ))}
        </div>
      ) : items.length === 0 ? (
        /* Entire Pantry is empty */
        <EmptyState
          icon={Refrigerator}
          title="Your pantry is empty"
          description="Track items currently in your fridge, freezer, and pantry shelves to monitor expiry dates and stop food waste."
          actionLabel="Add Your First Item"
          onAction={handleOpenCreate}
        />
      ) : (
        /* Filters produced 0 results */
        <EmptyState
          icon={SearchX}
          title="No items matched your filters"
          description="Try clearing your search query or adjusting the category and storage filters."
          actionLabel="Reset Filters"
          onAction={() => {
            setSearchQuery('');
            setSelectedCategory('all');
            setSelectedStorage('all');
            setSelectedStatus('active');
          }}
        />
      )}

      {/* Create / Edit Modal */}
      <PantryItemModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        onSubmit={handleFormSubmit}
        initialItem={editingItem}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        item={deletingItem}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        isDeleting={isDeleting}
      />
    </div>
  );
}
