import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  query,
  where,
  getDocs,
  onSnapshot,
  Timestamp,
  addDoc,
  deleteDoc,
  increment,
  runTransaction,
  QueryConstraint,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import type { User, Product, Office } from "../types/firestore";

// Simple in-memory cache for products
let productsCache: Product[] | null = null;
let productsCacheTimestamp = 0;
const CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes

// Helper to find top voter and downvoter
export const getTopVoters = (userVotes: Record<string, number>) => {
  let topVoterId: string | null = null;
  let topVoterCount = 0;
  let topDownvoterId: string | null = null;
  let topDownvoterCount = 0;

  Object.entries(userVotes).forEach(([userId, votes]) => {
    if (votes > topVoterCount) {
      topVoterId = userId;
      topVoterCount = votes;
    }
    if (votes < topDownvoterCount) {
      topDownvoterId = userId;
      topDownvoterCount = votes;
    }
  });

  return {
    topVoterId: topVoterId ? { id: topVoterId, votes: topVoterCount } : null,
    topDownvoterId: topDownvoterId
      ? { id: topDownvoterId, votes: topDownvoterCount }
      : null,
  };
};

// User Services
export const getUser = async (uid: string): Promise<User | null> => {
  const docRef = doc(db, "users", uid);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as User;
  } else {
    return null;
  }
};

export const getUserByEmail = async (email: string): Promise<User | null> => {
  const q = query(collection(db, "users"), where("email", "==", email));
  const querySnapshot = await getDocs(q);
  if (!querySnapshot.empty) {
    const doc = querySnapshot.docs[0];
    return { id: doc.id, ...doc.data() } as User;
  }
  return null;
};

export const getAllUsers = async (): Promise<User[]> => {
  const querySnapshot = await getDocs(collection(db, "users"));
  return querySnapshot.docs.map(
    (doc) => ({ id: doc.id, ...doc.data() } as User)
  );
};

export const createUser = async (user: User): Promise<void> => {
  await setDoc(doc(db, "users", user.id), user);
};

export const deleteUser = async (uid: string): Promise<void> => {
  await deleteDoc(doc(db, "users", uid));
};

export const updateUserBalance = async (
  uid: string,
  newBalance: number
): Promise<void> => {
  const userRef = doc(db, "users", uid);
  await updateDoc(userRef, { balance: newBalance });
};

export const updateUser = async (
  uid: string,
  data: Partial<User>
): Promise<void> => {
  const userRef = doc(db, "users", uid);
  await updateDoc(userRef, data);
};

// Product Services
export const getProducts = async (): Promise<Product[]> => {
  // Check cache first
  const now = Date.now();
  if (productsCache && now - productsCacheTimestamp < CACHE_DURATION_MS) {
    console.log("Using cached products");
    return productsCache;
  }

  const q = query(collection(db, "products"), where("isActive", "==", true));
  const querySnapshot = await getDocs(q);
  const products = querySnapshot.docs.map((doc) => ({
    id: doc.id,
    name: doc.data().name,
    category: doc.data().category,
    price: doc.data().price,
    imageUrl: doc.data().imageUrl,
    votes_nyc: doc.data().votes_nyc || 0,
    votes_denver: doc.data().votes_denver || 0,
    tags: doc.data().tags || [],
    isActive: doc.data().isActive,
    userVotes: doc.data().userVotes || {},
    lastVotedAt: doc.data().lastVotedAt || null,
  })) as Product[];

  // Update cache
  productsCache = products;
  productsCacheTimestamp = now;

  return products;
};

export const clearProductsCache = () => {
  productsCache = null;
  productsCacheTimestamp = 0;
};

// Real-time listener for products
export const subscribeToProducts = (
  callback: (products: Product[]) => void,
  onError?: (error: Error) => void
): (() => void) => {
  const q = query(collection(db, "products"), where("isActive", "==", true));

  const unsubscribe = onSnapshot(
    q,
    (querySnapshot) => {
      const products = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        name: doc.data().name,
        category: doc.data().category,
        price: doc.data().price,
        imageUrl: doc.data().imageUrl,
        votes_nyc: doc.data().votes_nyc || 0,
        votes_denver: doc.data().votes_denver || 0,
        tags: doc.data().tags || [],
        isActive: doc.data().isActive,
        userVotes: doc.data().userVotes || {},
        lastVotedAt: doc.data().lastVotedAt || null,
      })) as Product[];

      callback(products);
    },
    (error) => {
      console.error("Error listening to products:", error);
      onError?.(error as Error);
    }
  );

  return unsubscribe;
};

export const getAllProducts = async (): Promise<Product[]> => {
  const querySnapshot = await getDocs(collection(db, "products"));
  return querySnapshot.docs.map(
    (doc) => ({ id: doc.id, ...doc.data() } as Product)
  );
};

export const deleteProduct = async (productId: string): Promise<void> => {
  const productRef = doc(db, "products", productId);
  await updateDoc(productRef, { isActive: false });
  clearProductsCache();
};

export const undeleteProduct = async (productId: string): Promise<void> => {
  const productRef = doc(db, "products", productId);
  await updateDoc(productRef, { isActive: true });
  clearProductsCache();
};

// Office Services
export const getOffices = async (): Promise<Office[]> => {
  const querySnapshot = await getDocs(collection(db, "offices"));
  return querySnapshot.docs.map(
    (doc) => ({ id: doc.id, ...doc.data() } as Office)
  );
};

export const getOffice = async (officeId: string): Promise<Office | null> => {
  const docRef = doc(db, "offices", officeId);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as Office;
  } else {
    return null;
  }
};

export const updateOffice = async (
  officeId: string,
  data: Partial<Office>
): Promise<void> => {
  const docRef = doc(db, "offices", officeId);
  await updateDoc(docRef, data);
};

// Voting Services
export const voteForProduct = async (
  userId: string,
  productId: string,
  office: string,
  direction: "up" | "down"
): Promise<void> => {
  await runTransaction(db, async (transaction) => {
    const userRef = doc(db, "users", userId);
    const productRef = doc(db, "products", productId);

    const userDoc = await transaction.get(userRef);
    if (!userDoc.exists()) {
      throw new Error("User not found");
    }

    const userData = userDoc.data() as User;
    if (userData.balance < 1) {
      throw new Error("Insufficient funds");
    }

    const field = `votes_${office}`;
    const value = direction === "up" ? 1 : -1;

    transaction.update(userRef, { balance: userData.balance - 1 });
    transaction.update(productRef, {
      [field]: increment(value),
      [`userVotes.${userId}`]: increment(value),
      lastVotedAt: Timestamp.now(),
    });
  });

  // Invalidate cache after vote
  clearProductsCache();
};

export const voteForProductBatch = async (
  userId: string,
  productId: string,
  office: string,
  voteChange: number,
  cost: number
): Promise<void> => {
  if (cost === 0 && voteChange === 0) return;

  await runTransaction(db, async (transaction) => {
    const userRef = doc(db, "users", userId);
    const productRef = doc(db, "products", productId);

    const userDoc = await transaction.get(userRef);
    if (!userDoc.exists()) {
      throw new Error("User not found");
    }

    const userData = userDoc.data() as User;
    if (userData.balance < cost) {
      throw new Error("Insufficient funds");
    }

    const field = `votes_${office}`;

    transaction.update(userRef, { balance: userData.balance - cost });
    transaction.update(productRef, {
      [field]: increment(voteChange),
      [`userVotes.${userId}`]: increment(voteChange),
      lastVotedAt: Timestamp.now(),
    });
  });

  // Invalidate cache after vote
  clearProductsCache();
};

export const resetOfficeVotes = async (
  office: string,
  nextDropDate: string
): Promise<void> => {
  // Get all products
  const allProducts = await getAllProducts();

  // Batch update all products to reset votes for this office
  await Promise.all(
    allProducts.map((product) => {
      const productRef = doc(db, "products", product.id);
      return updateDoc(productRef, {
        [`votes_${office}`]: 0,
        userVotes: {},
        lastVotedAt: Timestamp.now(),
      });
    })
  );

  // Update office with next drop date
  await updateOffice(office, {
    nextDropDate: nextDropDate,
    lastResetAt: Timestamp.now(),
  });
};
