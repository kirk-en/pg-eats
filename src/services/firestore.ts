import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  query,
  where,
  getDocs,
  Timestamp,
  addDoc,
  deleteDoc,
  increment,
  runTransaction,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import type { User, Product, Office } from "../types/firestore";

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
  const q = query(collection(db, "products"), where("isActive", "==", true));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(
    (doc) => ({ id: doc.id, ...doc.data() } as Product)
  );
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
};

export const undeleteProduct = async (productId: string): Promise<void> => {
  const productRef = doc(db, "products", productId);
  await updateDoc(productRef, { isActive: true });
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
