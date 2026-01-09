import { initializeApp } from "firebase/app";
import {
  collection,
  doc,
  writeBatch,
  getFirestore,
  getDocs,
  getDoc,
} from "firebase/firestore";
import usersData from "./src/data/users.json" assert { type: "json" };

// Firebase config
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function updateUserBalances() {
  try {
    // Get existing users from Firestore
    const usersRef = collection(db, "users");
    const snapshot = await getDocs(usersRef);
    const existingUserIds = new Set(snapshot.docs.map((doc) => doc.id));

    const batch = writeBatch(db);
    let updateCount = 0;
    let addCount = 0;

    usersData.forEach((user) => {
      const userRef = doc(db, "users", user.id);

      if (existingUserIds.has(user.id)) {
        // User exists, update balance
        batch.update(userRef, {
          balance: user.balance,
        });
        updateCount++;
      } else {
        // User doesn't exist, create them
        batch.set(userRef, {
          email: user.email,
          displayName: user.username,
          photoURL: "",
          balance: user.balance,
          isAdmin: user.isAdmin ?? false,
        });
        addCount++;
      }
    });

    console.log(
      `Updating ${updateCount} users and adding ${addCount} new users... (${
        updateCount + addCount
      } operations)`
    );
    await batch.commit();
    console.log("✅ User balances updated and new users added successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error updating user balances:", error);
    process.exit(1);
  }
}

updateUserBalances();
