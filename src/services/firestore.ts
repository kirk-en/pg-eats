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
  deleteDoc,
  increment,
  runTransaction,
  orderBy,
  limit,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { tipSnackCzar } from "../utils/supabaseApi";
import type { User, Product, Office, BannerAd } from "../types/firestore";
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
    userVotes_nyc: doc.data().userVotes_nyc || {},
    userVotes_denver: doc.data().userVotes_denver || {},
    lastVotedAt_nyc: doc.data().lastVotedAt_nyc || null,
    lastVotedAt_denver: doc.data().lastVotedAt_denver || null,
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
        userVotes_nyc: doc.data().userVotes_nyc || {},
        userVotes_denver: doc.data().userVotes_denver || {},
        lastVotedAt_nyc: doc.data().lastVotedAt_nyc || null,
        lastVotedAt_denver: doc.data().lastVotedAt_denver || null,
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

export const getMostRecentlyVotedProducts = async (
  office: "nyc" | "denver"
): Promise<Product[]> => {
  const lastVotedAtField =
    office === "nyc" ? "lastVotedAt_nyc" : "lastVotedAt_denver";

  const q = query(
    collection(db, "products"),
    where("isActive", "==", true),
    where(lastVotedAtField, "!=", null),
    orderBy(lastVotedAtField, "desc"),
    limit(24)
  );

  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc) => ({
    id: doc.id,
    name: doc.data().name,
    category: doc.data().category,
    price: doc.data().price,
    imageUrl: doc.data().imageUrl,
    votes_nyc: doc.data().votes_nyc || 0,
    votes_denver: doc.data().votes_denver || 0,
    tags: doc.data().tags || [],
    isActive: doc.data().isActive,
    userVotes_nyc: doc.data().userVotes_nyc || {},
    userVotes_denver: doc.data().userVotes_denver || {},
    lastVotedAt_nyc: doc.data().lastVotedAt_nyc || null,
    lastVotedAt_denver: doc.data().lastVotedAt_denver || null,
  })) as Product[];
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

export const addProduct = async (productData: {
  name: string;
  category: string;
  price: number;
  imageUrl: string;
  tags: string[];
  addedBy: string;
}): Promise<string> => {
  // Generate searchText from name, category, and tags
  const searchText = [
    productData.name,
    productData.category,
    ...productData.tags,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  // Create product with unique ID (timestamp-based)
  const productId = `product_${Date.now()}_${Math.random()
    .toString(36)
    .substr(2, 9)}`;
  const productRef = doc(db, "products", productId);

  await setDoc(productRef, {
    name: productData.name,
    category: productData.category,
    price: productData.price,
    imageUrl: productData.imageUrl,
    tags: productData.tags,
    searchText: searchText,
    addedBy: productData.addedBy,
    isActive: true,
    votes_nyc: 0,
    votes_denver: 0,
    userVotes_nyc: {},
    userVotes_denver: {},
    lastVotedAt_nyc: null,
    lastVotedAt_denver: null,
    createdAt: Timestamp.now(),
  });

  clearProductsCache();
  return productId;
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
): Promise<{ regularCoinsSpent: number }> => {
  const cost = 1;
  let regularCoinsSpent = 0;

  await runTransaction(db, async (transaction) => {
    const userRef = doc(db, "users", userId);
    const productRef = doc(db, "products", productId);

    const userDoc = await transaction.get(userRef);
    if (!userDoc.exists()) {
      throw new Error("User not found");
    }

    const userData = userDoc.data() as User;
    const bonusCoins = userData.bonusCoins ?? 0;
    const totalAvailable = (userData.balance ?? 0) + bonusCoins;

    if (totalAvailable < cost) {
      throw new Error("Insufficient funds");
    }

    // Calculate how much comes from bonus vs regular coins
    const bonusCoinsToDeduct = Math.min(bonusCoins, cost);
    regularCoinsSpent = cost - bonusCoinsToDeduct;

    const field = `votes_${office}`;
    const value = direction === "up" ? 1 : -1;

    transaction.update(userRef, {
      bonusCoins: bonusCoins - bonusCoinsToDeduct,
      balance: (userData.balance ?? 0) - regularCoinsSpent,
    });
    transaction.update(productRef, {
      [field]: increment(value),
      [`userVotes_${office}.${userId}`]: increment(value),
      [`lastVotedAt_${office}`]: Timestamp.now(),
    });
  });

  // Invalidate cache after vote
  clearProductsCache();

  return { regularCoinsSpent };
};

export const voteForProductBatch = async (
  userId: string,
  productId: string,
  office: string,
  voteChange: number,
  cost: number
): Promise<{ regularCoinsSpent: number }> => {
  if (cost === 0 && voteChange === 0) return { regularCoinsSpent: 0 };

  let regularCoinsSpent = 0;

  await runTransaction(db, async (transaction) => {
    const userRef = doc(db, "users", userId);
    const productRef = doc(db, "products", productId);

    const userDoc = await transaction.get(userRef);
    if (!userDoc.exists()) {
      throw new Error("User not found");
    }

    const userData = userDoc.data() as User;
    const bonusCoins = userData.bonusCoins ?? 0;
    const totalAvailable = (userData.balance ?? 0) + bonusCoins;

    if (totalAvailable < cost) {
      throw new Error("Insufficient funds");
    }

    // Calculate how much comes from bonus vs regular coins
    const bonusCoinsToDeduct = Math.min(bonusCoins, cost);
    regularCoinsSpent = cost - bonusCoinsToDeduct;

    const field = `votes_${office}`;

    transaction.update(userRef, {
      bonusCoins: bonusCoins - bonusCoinsToDeduct,
      balance: (userData.balance ?? 0) - regularCoinsSpent,
    });
    transaction.update(productRef, {
      [field]: increment(voteChange),
      [`userVotes_${office}.${userId}`]: increment(voteChange),
      [`lastVotedAt_${office}`]: Timestamp.now(),
    });
  });

  // Invalidate cache after vote
  clearProductsCache();

  return { regularCoinsSpent };
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
        [`userVotes_${office}`]: {},
        [`lastVotedAt_${office}`]: Timestamp.now(),
      });
    })
  );

  // Update office with next drop date
  await updateOffice(office, {
    nextDropDate: nextDropDate,
    lastResetAt: Timestamp.now(),
  });
};

// Banner Ad Services
export const createBannerAd = async (adData: {
  createdBy: string;
  productId: string;
  productName: string;
  productImageUrl: string;
  displayName: string;
  styleVariant: string;
  customText: string;
  voteDirection: "upvote" | "downvote";
  office: string;
}): Promise<{ adId: string; regularCoinsSpent: number }> => {
  const adId = `ad_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const cost = 50;
  let regularCoinsSpent = 0;

  await runTransaction(db, async (transaction) => {
    const userRef = doc(db, "users", adData.createdBy);
    const adRef = doc(db, "bannerAds", adId);

    const userDoc = await transaction.get(userRef);
    if (!userDoc.exists()) {
      throw new Error("User not found");
    }

    const userData = userDoc.data() as User;
    const bonusCoins = userData.bonusCoins ?? 0;
    const totalAvailable = (userData.balance ?? 0) + bonusCoins;

    if (totalAvailable < cost) {
      throw new Error("Insufficient funds");
    }

    // Calculate how much comes from bonus vs regular coins
    const bonusCoinsToDeduct = Math.min(bonusCoins, cost);
    regularCoinsSpent = cost - bonusCoinsToDeduct;

    // Calculate 7-day expiry
    const createdAt = Timestamp.now();
    const expiresAt = new Timestamp(
      createdAt.seconds + 7 * 24 * 60 * 60,
      createdAt.nanoseconds
    );

    transaction.update(userRef, {
      bonusCoins: bonusCoins - bonusCoinsToDeduct,
      balance: (userData.balance ?? 0) - regularCoinsSpent,
    });
    transaction.set(adRef, {
      createdBy: adData.createdBy,
      productId: adData.productId,
      productName: adData.productName,
      productImageUrl: adData.productImageUrl,
      displayName: adData.displayName,
      styleVariant: adData.styleVariant,
      customText: adData.customText,
      voteDirection: adData.voteDirection,
      createdAt: createdAt,
      expiresAt: expiresAt,
      isActive: true,
    });
  });

  // Tip the czar only for regular coins spent (not for bonus coins)
  try {
    const officeData = await getOffice(adData.office);
    if (
      officeData?.czar &&
      officeData?.tippingEnabled &&
      regularCoinsSpent > 0
    ) {
      await tipSnackCzar(adData.createdBy, officeData.czar, regularCoinsSpent);
    }
  } catch (error) {
    console.error("Error tipping czar for ad purchase:", error);
    // Don't throw - we don't want a failed tip to break the ad purchase experience
  }

  return { adId, regularCoinsSpent };
};

export const getActiveBannerAds = async (): Promise<BannerAd[]> => {
  const now = Timestamp.now();
  const q = query(
    collection(db, "bannerAds"),
    where("isActive", "==", true),
    where("expiresAt", ">", now)
  );

  const querySnapshot = await getDocs(q);
  return querySnapshot.docs
    .map((doc) => ({ id: doc.id, ...doc.data() } as BannerAd))
    .filter((ad) => {
      if (!ad.disabledUntil) return true;
      return ad.disabledUntil.toMillis() <= now.toMillis();
    });
};

export const deleteBannerAd = async (adId: string): Promise<void> => {
  const adRef = doc(db, "bannerAds", adId);
  await updateDoc(adRef, { isActive: false });
};

export const incrementAdViewCount = async (adId: string): Promise<void> => {
  const adRef = doc(db, "bannerAds", adId);
  const randomIncrement = Math.floor(Math.random() * 3) + 1;
  await updateDoc(adRef, {
    viewCount: increment(randomIncrement),
  });
};

export const getUserBannerAds = async (userId: string): Promise<BannerAd[]> => {
  const q = query(
    collection(db, "bannerAds"),
    where("createdBy", "==", userId),
    orderBy("createdAt", "desc")
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(
    (doc) => ({ id: doc.id, ...doc.data() } as BannerAd)
  );
};

export const disableBannerAd = async (
  adId: string,
  userId: string
): Promise<void> => {
  const cost = 75;
  let adData: BannerAd;
  let reporterData: User;

  await runTransaction(db, async (transaction) => {
    const userRef = doc(db, "users", userId);
    const adRef = doc(db, "bannerAds", adId);

    const userDoc = await transaction.get(userRef);
    const adDoc = await transaction.get(adRef);

    if (!userDoc.exists()) {
      throw new Error("User not found");
    }

    if (!adDoc.exists()) {
      throw new Error("Ad not found");
    }

    const userData = userDoc.data() as User;
    adData = { id: adDoc.id, ...adDoc.data() } as BannerAd;
    reporterData = userData;

    const bonusCoins = userData.bonusCoins ?? 0;
    const totalAvailable = (userData.balance ?? 0) + bonusCoins;

    if (totalAvailable < cost) {
      throw new Error("Insufficient funds");
    }

    const bonusCoinsToDeduct = Math.min(bonusCoins, cost);
    const regularCoinsSpent = cost - bonusCoinsToDeduct;

    const now = Timestamp.now();
    const disabledUntil = new Timestamp(
      now.seconds + 48 * 60 * 60,
      now.nanoseconds
    );

    transaction.update(userRef, {
      bonusCoins: bonusCoins - bonusCoinsToDeduct,
      balance: (userData.balance ?? 0) - regularCoinsSpent,
    });

    transaction.update(adRef, {
      disabledUntil: disabledUntil,
      disabledBy: reporterData.displayName,
    });
  });

  // After transaction succeeds, send email notification
  try {
    const adOwnerRef = doc(db, "users", adData.createdBy);
    const adOwnerDoc = await getDoc(adOwnerRef);

    if (adOwnerDoc.exists()) {
      const adOwnerData = adOwnerDoc.data() as User;

      await fetch("/api/send-ad-disabled-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          adOwnerEmail: adOwnerData.email,
          adOwnerName: adOwnerData.displayName,
          reporterName: reporterData.displayName,
          adText: adData.customText,
          productImageUrl: adData.productImageUrl,
        }),
      });
    }
  } catch (error) {
    console.error("Failed to send ad disabled notification email:", error);
    // Don't throw - the main action (disabling ad) succeeded
  }
};
