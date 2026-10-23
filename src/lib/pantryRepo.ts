import {
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from './firebase';
import { PantryItem, PantryItemInput, ItemStatus } from '@/types';

const LOCAL_STORAGE_KEY_PREFIX = 'pantrypilot_items_';

function getLocalItems(uid: string): PantryItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(`${LOCAL_STORAGE_KEY_PREFIX}${uid}`);
    if (!raw) {
      // Seed with sample household items on first load in demo mode
      const seedItems: PantryItem[] = [
        {
          id: 'demo-1',
          name: 'Whole Milk',
          quantity: 1,
          unit: 'l',
          category: 'dairy',
          storage: 'fridge',
          addedAt: new Date(Date.now() - 4 * 86400000).toISOString(),
          expiresAt: new Date(Date.now() + 2 * 86400000).toISOString(),
          status: 'active',
          source: 'manual',
        },
        {
          id: 'demo-2',
          name: 'Baby Spinach',
          quantity: 200,
          unit: 'g',
          category: 'produce',
          storage: 'fridge',
          addedAt: new Date(Date.now() - 3 * 86400000).toISOString(),
          expiresAt: new Date(Date.now() + 1 * 86400000).toISOString(),
          status: 'active',
          source: 'manual',
        },
        {
          id: 'demo-3',
          name: 'Chicken Breast',
          quantity: 500,
          unit: 'g',
          category: 'meat',
          storage: 'fridge',
          addedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
          expiresAt: new Date(Date.now() - 1 * 86400000).toISOString(),
          status: 'active',
          source: 'manual',
        },
        {
          id: 'demo-4',
          name: 'Greek Yogurt',
          quantity: 500,
          unit: 'g',
          category: 'dairy',
          storage: 'fridge',
          addedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
          expiresAt: new Date(Date.now() + 7 * 86400000).toISOString(),
          status: 'active',
          source: 'manual',
        },
        {
          id: 'demo-5',
          name: 'White Basmati Rice',
          quantity: 2,
          unit: 'kg',
          category: 'grains',
          storage: 'shelf',
          addedAt: new Date(Date.now() - 10 * 86400000).toISOString(),
          expiresAt: new Date(Date.now() + 180 * 86400000).toISOString(),
          status: 'active',
          source: 'manual',
        },
      ];
      localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}${uid}`, JSON.stringify(seedItems));
      return seedItems;
    }
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveLocalItems(uid: string, items: PantryItem[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}${uid}`, JSON.stringify(items));
  } catch (err) {
    console.error('Failed to save to localStorage:', err);
  }
}

/**
 * Fetch pantry items for a user, sorted by soonest expiry date.
 */
export async function fetchPantryItems(uid: string): Promise<PantryItem[]> {
  if (!uid) return [];

  if (isFirebaseConfigured && db) {
    try {
      const itemsCol = collection(db, 'users', uid, 'pantryItems');
      const q = query(itemsCol, orderBy('expiresAt', 'asc'));
      const snapshot = await getDocs(q);

      return snapshot.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          name: data.name,
          quantity: data.quantity,
          unit: data.unit,
          category: data.category,
          storage: data.storage,
          addedAt: data.addedAt,
          expiresAt: data.expiresAt,
          status: data.status,
          source: data.source,
        } as PantryItem;
      });
    } catch (error) {
      console.warn('Firestore fetch failed or offline; falling back to local storage:', error);
      return getLocalItems(uid).sort(
        (a, b) => new Date(a.expiresAt).getTime() - new Date(b.expiresAt).getTime()
      );
    }
  }

  // Local fallback mode
  return getLocalItems(uid).sort(
    (a, b) => new Date(a.expiresAt).getTime() - new Date(b.expiresAt).getTime()
  );
}

/**
 * Add a new pantry item.
 */
export async function addPantryItem(uid: string, itemInput: PantryItemInput): Promise<PantryItem> {
  if (!uid) throw new Error('User ID is required to add pantry item');

  if (isFirebaseConfigured && db) {
    try {
      const itemsCol = collection(db, 'users', uid, 'pantryItems');
      const docRef = await addDoc(itemsCol, itemInput);
      return {
        id: docRef.id,
        ...itemInput,
      };
    } catch (error) {
      console.warn('Firestore add failed; saving to local storage:', error);
    }
  }

  const items = getLocalItems(uid);
  const newItem: PantryItem = {
    id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    ...itemInput,
  };
  items.push(newItem);
  saveLocalItems(uid, items);
  return newItem;
}

/**
 * Update an existing pantry item.
 */
export async function updatePantryItem(
  uid: string,
  itemId: string,
  updates: Partial<PantryItemInput>
): Promise<void> {
  if (!uid || !itemId) throw new Error('User ID and Item ID are required to update pantry item');

  if (isFirebaseConfigured && db) {
    try {
      const itemRef = doc(db, 'users', uid, 'pantryItems', itemId);
      await updateDoc(itemRef, updates);
      return;
    } catch (error) {
      console.warn('Firestore update failed; updating local storage:', error);
    }
  }

  const items = getLocalItems(uid);
  const index = items.findIndex((i) => i.id === itemId);
  if (index !== -1) {
    items[index] = { ...items[index], ...updates };
    saveLocalItems(uid, items);
  }
}

/**
 * Update status of an item (active -> used | wasted).
 */
export async function updatePantryItemStatus(
  uid: string,
  itemId: string,
  status: ItemStatus
): Promise<void> {
  return updatePantryItem(uid, itemId, { status });
}

/**
 * Delete a pantry item permanently.
 */
export async function deletePantryItem(uid: string, itemId: string): Promise<void> {
  if (!uid || !itemId) throw new Error('User ID and Item ID are required to delete pantry item');

  if (isFirebaseConfigured && db) {
    try {
      const itemRef = doc(db, 'users', uid, 'pantryItems', itemId);
      await deleteDoc(itemRef);
      return;
    } catch (error) {
      console.warn('Firestore delete failed; removing from local storage:', error);
    }
  }

  const items = getLocalItems(uid);
  const filtered = items.filter((i) => i.id !== itemId);
  saveLocalItems(uid, filtered);
}
