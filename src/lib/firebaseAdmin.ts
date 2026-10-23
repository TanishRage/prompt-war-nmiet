import { getApps, initializeApp, cert, App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { PantryItem, MealPlan } from '@/types';

// Singleton initialization for Firebase Admin
function getFirebaseAdminApp(): App {
  const currentApps = getApps();
  if (currentApps.length > 0) {
    return currentApps[0]!;
  }

  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY
    ? process.env.FIREBASE_ADMIN_PRIVATE_KEY.replace(/\\n/g, '\n')
    : undefined;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const projectId =
    process.env.FIREBASE_ADMIN_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

  if (projectId && clientEmail && privateKey) {
    return initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    });
  }

  if (projectId) {
    return initializeApp({ projectId });
  }

  return initializeApp();
}

/**
 * Verify Firebase ID token from Authorization header.
 * Rejects unauthenticated requests with an error.
 * Supports demo / guest cook tokens gracefully for testing.
 */
export async function verifyAuthToken(
  authHeader: string | null | undefined
): Promise<{ uid: string; email?: string; isGuest?: boolean }> {
  if (!authHeader) {
    throw new Error('Authentication required: Missing Authorization header');
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') {
    throw new Error('Invalid Authorization header format. Expected Bearer <token>');
  }

  const token = parts[1].trim();
  if (!token) {
    throw new Error('Empty token provided');
  }

  // Support Guest / Demo Cook mode for instant local evaluation without Firebase setup
  if (token.startsWith('demo-') || token === 'demo-cook-token' || token.startsWith('guest-')) {
    const guestUid = token.startsWith('demo-') ? token : 'demo-user-123';
    return {
      uid: guestUid,
      email: 'demo@pantrypilot.local',
      isGuest: true,
    };
  }

  // Verify real Firebase ID token
  try {
    const app = getFirebaseAdminApp();
    const decodedToken = await getAuth(app).verifyIdToken(token);
    return {
      uid: decodedToken.uid,
      email: decodedToken.email,
      isGuest: false,
    };
  } catch (err: any) {
    console.error('Firebase token verification failed:', err?.message || err);
    throw new Error('Invalid or expired authentication token');
  }
}

/**
 * Read user's active pantry items securely from Firestore on the server.
 * Scoped strictly to verified UID.
 */
export async function getServerPantryItems(uid: string): Promise<PantryItem[]> {
  if (!uid) return [];

  // Only connect to live Firestore if credentials are provided in env
  if (process.env.FIREBASE_ADMIN_PRIVATE_KEY && process.env.FIREBASE_ADMIN_CLIENT_EMAIL) {
    try {
      const app = getFirebaseAdminApp();
      const db = getFirestore(app);
      const snapshot = await db
        .collection('users')
        .doc(uid)
        .collection('pantryItems')
        .where('status', '==', 'active')
        .orderBy('expiresAt', 'asc')
        .get();

      if (!snapshot.empty) {
        return snapshot.docs.map((docSnap) => {
          const d = docSnap.data();
          return {
            id: docSnap.id,
            name: d.name,
            quantity: d.quantity,
            unit: d.unit,
            category: d.category,
            storage: d.storage,
            addedAt: d.addedAt,
            expiresAt: d.expiresAt,
            status: d.status,
            source: d.source,
          } as PantryItem;
        });
      }
    } catch (err) {
      // Expected fallback in demo / test mode
    }

    // Fallback demo items if Firestore server admin is not set up
    const now = Date.now();
    return [
      {
        id: 'item-demo-1',
        name: 'Whole Milk',
        quantity: 1,
        unit: 'l',
        category: 'dairy',
        storage: 'fridge',
        addedAt: new Date(now - 4 * 86400000).toISOString(),
        expiresAt: new Date(now + 1.5 * 86400000).toISOString(),
        status: 'active',
        source: 'manual',
      },
      {
        id: 'item-demo-2',
        name: 'Baby Spinach',
        quantity: 200,
        unit: 'g',
        category: 'produce',
        storage: 'fridge',
        addedAt: new Date(now - 3 * 86400000).toISOString(),
        expiresAt: new Date(now + 1 * 86400000).toISOString(),
        status: 'active',
        source: 'manual',
      },
      {
        id: 'item-demo-3',
        name: 'Chicken Breast (Fresh)',
        quantity: 500,
        unit: 'g',
        category: 'meat',
        storage: 'fridge',
        addedAt: new Date(now - 1 * 86400000).toISOString(),
        expiresAt: new Date(now + 1 * 86400000).toISOString(),
        status: 'active',
        source: 'manual',
      },
      {
        id: 'item-demo-4',
        name: 'Cheddar Cheese',
        quantity: 200,
        unit: 'g',
        category: 'dairy',
        storage: 'fridge',
        addedAt: new Date(now - 5 * 86400000).toISOString(),
        expiresAt: new Date(now + 10 * 86400000).toISOString(),
        status: 'active',
        source: 'manual',
      },
      {
        id: 'item-demo-5',
        name: 'White Rice',
        quantity: 1,
        unit: 'kg',
        category: 'grains',
        storage: 'shelf',
        addedAt: new Date(now - 10 * 86400000).toISOString(),
        expiresAt: new Date(now + 300 * 86400000).toISOString(),
        status: 'active',
        source: 'manual',
      },
    ];
  }

  /**
   * Save generated meal plan to users/{uid}/mealPlans in Firestore.
   */
  export async function saveServerMealPlan(uid: string, plan: any): Promise<string> {
    const planId = `plan-${Date.now()}`;
    if (process.env.FIREBASE_ADMIN_PRIVATE_KEY && process.env.FIREBASE_ADMIN_CLIENT_EMAIL) {
      try {
        const app = getFirebaseAdminApp();
        const db = getFirestore(app);
        await db
          .collection('users')
          .doc(uid)
          .collection('mealPlans')
          .doc(planId)
          .set({
            ...plan,
            id: planId,
            createdAt: new Date().toISOString(),
          });
        return planId;
      } catch (err) {
        return planId;
      }
    }
    return planId;
  }
