import {
  collection,
  doc,
  writeBatch,
  getDocs,
  getDoc,
  deleteDoc,
  Timestamp,
  updateDoc,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import usersData from "../data/users.json";
import productsData from "../../products-catalog.json";

export const clearFirestore = async () => {
  const collections = [
    "offices",
    "users",
    "products",
    "votes",
    "voting_periods",
  ];

  for (const collectionName of collections) {
    try {
      const collectionRef = collection(db, collectionName);
      const snapshot = await getDocs(collectionRef);

      for (const doc of snapshot.docs) {
        await deleteDoc(doc.ref);
        console.log(`Deleted ${collectionName}/${doc.id}`);
      }
      console.log(`Cleared collection: ${collectionName}`);
    } catch (error) {
      console.error(`Error clearing ${collectionName}:`, error);
    }
  }

  console.log("All collections cleared!");
};

export const resetUsers = async () => {
  const batch = writeBatch(db);
  let operationCount = 0;

  // 1. Delete existing users
  const usersRef = collection(db, "users");
  const snapshot = await getDocs(usersRef);
  for (const doc of snapshot.docs) {
    batch.delete(doc.ref);
    operationCount++;
  }

  // 2. Re-seed users from JSON
  usersData.forEach((user: any) => {
    const userRef = doc(db, "users", user.id);
    batch.set(userRef, {
      email: user.email,
      displayName: user.username,
      photoURL: "", // No photo in JSON
      balance: user.balance,
      isAdmin: user.isAdmin ?? false,
    });
    operationCount++;
  });

  console.log(`Resetting users... (${operationCount} operations)`);
  await batch.commit();
  console.log("Users reset complete!");
};

export const seedFirestore = async () => {
  const batch = writeBatch(db);
  let operationCount = 0;

  // Calculate next Friday for voting periods
  const nextFriday = new Date();
  nextFriday.setDate(
    nextFriday.getDate() + ((5 - nextFriday.getDay() + 7) % 7)
  );
  nextFriday.setHours(17, 0, 0, 0);

  // Seed Offices
  // NYC Office
  const nycRef = doc(db, "offices", "nyc");
  const nycSnap = await getDoc(nycRef);
  const nycData = nycSnap.exists() ? nycSnap.data() : null;

  batch.set(nycRef, {
    name: "New York",
    timezone: "America/New_York",
    czar: null,
    tippingEnabled: nycData?.tippingEnabled ?? true,
    currentVotingPeriod: {
      startDate: Timestamp.now(),
      endDate: Timestamp.fromDate(nextFriday),
      status: "active",
    },
  });
  operationCount++;

  // Denver Office
  const denverRef = doc(db, "offices", "denver");
  const denverSnap = await getDoc(denverRef);
  const denverData = denverSnap.exists() ? denverSnap.data() : null;

  batch.set(denverRef, {
    name: "Denver",
    timezone: "America/Denver",
    czar: null,
    tippingEnabled: denverData?.tippingEnabled ?? true,
    currentVotingPeriod: {
      startDate: Timestamp.now(),
      endDate: Timestamp.fromDate(nextFriday),
      status: "active",
    },
  });
  operationCount++;

  // Seed Users
  usersData.forEach((user: any) => {
    const userRef = doc(db, "users", user.id);
    batch.set(userRef, {
      email: user.email,
      displayName: user.username,
      photoURL: "", // No photo in JSON
      balance: user.balance,
      isAdmin: user.isAdmin ?? false,
    });
    operationCount++;
  });

  // Seed Products
  productsData.products.forEach((product: any) => {
    const productRef = doc(db, "products", product.id);
    // Convert price string "$14.42" to number 14.42
    const priceNumber = parseFloat(product.price.replace("$", ""));

    batch.set(productRef, {
      name: product.name,
      category: product.category,
      price: isNaN(priceNumber) ? 0 : priceNumber,
      imageUrl: product.imageUrl,
      tags: product.tags || [],
      searchText: product.searchText || "",
      isActive: true,
      votes_nyc: 0,
      votes_denver: 0,
      userVotes_nyc: {},
      userVotes_denver: {},
      lastVotedAt_nyc: null,
      lastVotedAt_denver: null,
    });
    operationCount++;
  });

  console.log(`Committing ${operationCount} operations...`);
  await batch.commit();
  console.log("Seeding complete!");
};

export const updateUserBalances = async () => {
  const batch = writeBatch(db);
  let updateCount = 0;
  let addCount = 0;

  // Get existing users from Firestore
  const usersRef = collection(db, "users");
  const snapshot = await getDocs(usersRef);
  const existingUserIds = new Set(snapshot.docs.map((doc) => doc.id));

  usersData.forEach((user: any) => {
    const userRef = doc(db, "users", user.id);

    if (existingUserIds.has(user.id)) {
      // User exists, update balance
      batch.update(userRef, {
        balance: user.balance,
      });
      updateCount++;
    } else {
      // User doesn't exist, create them
      const newUserData: any = {
        displayName: user.username,
        balance: user.balance,
        isAdmin: user.isAdmin ?? false,
      };
      if (user.email) {
        newUserData.email = user.email;
      }
      batch.set(userRef, newUserData);
      addCount++;
    }
  });

  console.log(
    `Updating ${updateCount} users and adding ${addCount} new users... (${
      updateCount + addCount
    } operations)`
  );
  await batch.commit();
  console.log("User balances updated and new users added!");
};

export const addBonusCoinsToAllUsers = async (bonusAmount: number = 150) => {
  try {
    const usersRef = collection(db, "users");
    const snapshot = await getDocs(usersRef);

    console.log(
      `Adding ${bonusAmount} bonus coins to ${snapshot.size} users...`
    );

    let updateCount = 0;
    for (const userDoc of snapshot.docs) {
      await updateDoc(userDoc.ref, {
        bonusCoins: bonusAmount,
      });
      updateCount++;
    }

    console.log(
      `Successfully added ${bonusAmount} bonus coins to ${updateCount} users!`
    );
  } catch (error) {
    console.error("Error adding bonus coins to users:", error);
    throw error;
  }
};
