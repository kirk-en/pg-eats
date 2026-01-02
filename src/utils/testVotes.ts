import {
  collection,
  getDocs,
  doc,
  writeBatch,
  Timestamp,
  deleteField,
} from "firebase/firestore";
import { db } from "../lib/firebase";

const TEST_USER_IDS = [
  "d4a07479-6064-46c5-bfa9-b25b62039283", // Andrew Konrad
  "0ab6eea9-8441-43a1-8ff9-3b9c3f4db05c", // Robert Waters
  "c1e564c4-d180-41ab-a9db-a843e89b7c0d", // Paulina Lancaster
  "30f75d89-ac04-4050-a058-6d04877a7572", // Oscar Rolf
  "fe499f71-24bf-4e48-a899-803b4c3c4191", // Sajni Patel
  "293460ab-62dc-4bad-a878-d2cea08f62bf", // Aileen Gray
  "2a1336ae-d36b-478c-82bd-a8fb5ab1a447", // Emma Chaves
  "ec0b10e4-0f1d-47d5-a460-2616ad5d9f56", // Aaron Wagner
  "a908d761-6175-4d3d-9619-58e52c684636", // Camren Bruno
  "08dc1697-37e6-4b7d-bd51-1cbbd5031cf4", // Joseph Grosso
];

export const addTestVotesNYC = async () => {
  console.log("Starting test vote injection for NYC...");

  try {
    // Get all active products
    const productsRef = collection(db, "products");
    const snapshot = await getDocs(productsRef);
    const allProducts = snapshot.docs.filter((doc) => doc.data().isActive);

    console.log(`Found ${allProducts.length} active products`);

    // Randomly select ~100 products
    const numProductsToVote = Math.min(100, allProducts.length);
    const shuffledProducts = allProducts.sort(() => Math.random() - 0.5);
    const products = shuffledProducts.slice(0, numProductsToVote);

    console.log(`Voting on ${products.length} random products`);

    let totalVotesAdded = 0;
    let batch = writeBatch(db);
    let batchOps = 0;

    // For each product, randomly assign 1-14 upvotes
    for (const productDoc of products) {
      const numVotes = Math.floor(Math.random() * 14) + 1; // 1-14 votes
      const productId = productDoc.id;
      const currentUserVotes_nyc = productDoc.data().userVotes_nyc || {};
      const currentVotes_nyc = productDoc.data().votes_nyc || 0;

      console.log(
        `Product: ${productDoc.data().name} - Adding ${numVotes} votes`
      );

      // Create array of vote assignments: [userId, voteCount]
      const voteAssignments: [string, number][] = [];
      let votesRemaining = numVotes;

      // Randomly distribute votes among users
      while (votesRemaining > 0) {
        const randomUserIndex = Math.floor(
          Math.random() * TEST_USER_IDS.length
        );
        const userId = TEST_USER_IDS[randomUserIndex];

        // Assign 1-3 votes to this user
        const votesForUser = Math.min(
          Math.floor(Math.random() * 3) + 1,
          votesRemaining
        );
        votesRemaining -= votesForUser;

        // Check if user already has votes on this product
        const existingAssignment = voteAssignments.find(
          ([id]) => id === userId
        );
        if (existingAssignment) {
          existingAssignment[1] += votesForUser;
        } else {
          voteAssignments.push([userId, votesForUser]);
        }
      }

      // Update the product with new vote data
      const updatedUserVotes_nyc = { ...currentUserVotes_nyc };
      let voteIncrement = 0;

      for (const [userId, voteCount] of voteAssignments) {
        updatedUserVotes_nyc[userId] =
          (updatedUserVotes_nyc[userId] || 0) + voteCount;
        voteIncrement += voteCount;
      }

      // Generate random downvotes (1-3, but never exceeding upvotes)
      // Downvotes are stored as negative values in the same userVotes map
      const maxDownvotes = Math.min(3, voteIncrement);
      const numDownvotes = Math.floor(Math.random() * maxDownvotes) + 1;
      let downvoteIncrement = 0;
      const usedUserIds = new Set(voteAssignments.map(([id]) => id));
      let attempts = 0;
      const maxAttempts = 50;
      let downvotesRemaining = numDownvotes;

      while (downvotesRemaining > 0 && attempts < maxAttempts) {
        attempts++;
        const randomUserIndex = Math.floor(
          Math.random() * TEST_USER_IDS.length
        );
        const userId = TEST_USER_IDS[randomUserIndex];

        // Make sure this user didn't vote upvotes
        if (usedUserIds.has(userId)) {
          continue;
        }

        usedUserIds.add(userId);
        const downvotesForUser = Math.min(downvotesRemaining, 3);
        downvotesRemaining -= downvotesForUser;
        downvoteIncrement -= downvotesForUser; // Negative for downvotes
        updatedUserVotes_nyc[userId] =
          (updatedUserVotes_nyc[userId] || 0) - downvotesForUser;
      }

      // Generate a timestamp for today with random time not exceeding current time
      const now = new Date();
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const timeDiffMs = now.getTime() - today.getTime();
      const randomMs = Math.random() * timeDiffMs;
      const randomTime = new Date(today.getTime() + randomMs);

      // Add to batch
      const productRef = doc(db, "products", productId);
      batch.update(productRef, {
        userVotes_nyc: updatedUserVotes_nyc,
        votes_nyc: currentVotes_nyc + voteIncrement + downvoteIncrement,
        lastVotedAt_nyc: Timestamp.fromDate(randomTime),
      });

      totalVotesAdded += voteIncrement;
      batchOps++;

      // Commit batch every 50 operations
      if (batchOps >= 50) {
        await batch.commit();
        console.log(`Committed ${batchOps} operations...`);
        batch = writeBatch(db);
        batchOps = 0;
      }
    }

    // Commit remaining operations
    if (batchOps > 0) {
      await batch.commit();
      console.log(`Committed final ${batchOps} operations`);
    }

    console.log(`✅ Test vote injection complete!`);
    console.log(`Total votes added: ${totalVotesAdded}`);
    console.log(`Products updated: ${products.length}`);
  } catch (error) {
    console.error("Error adding test votes:", error);
    throw error;
  }
};

export const addTestVotesDenver = async () => {
  console.log("Starting test vote injection for Denver...");

  try {
    // Get all active products
    const productsRef = collection(db, "products");
    const snapshot = await getDocs(productsRef);
    const allProducts = snapshot.docs.filter((doc) => doc.data().isActive);

    console.log(`Found ${allProducts.length} active products`);

    // Randomly select ~100 products
    const numProductsToVote = Math.min(100, allProducts.length);
    const shuffledProducts = allProducts.sort(() => Math.random() - 0.5);
    const products = shuffledProducts.slice(0, numProductsToVote);

    console.log(`Voting on ${products.length} random products`);

    let totalVotesAdded = 0;
    let batch = writeBatch(db);
    let batchOps = 0;

    // For each product, randomly assign 1-14 upvotes
    for (const productDoc of products) {
      const numVotes = Math.floor(Math.random() * 14) + 1; // 1-14 votes
      const productId = productDoc.id;
      const currentUserVotes_denver = productDoc.data().userVotes_denver || {};
      const currentVotes_denver = productDoc.data().votes_denver || 0;

      console.log(
        `Product: ${productDoc.data().name} - Adding ${numVotes} votes`
      );

      // Create array of vote assignments: [userId, voteCount]
      const voteAssignments: [string, number][] = [];
      let votesRemaining = numVotes;

      // Randomly distribute votes among users
      while (votesRemaining > 0) {
        const randomUserIndex = Math.floor(
          Math.random() * TEST_USER_IDS.length
        );
        const userId = TEST_USER_IDS[randomUserIndex];

        // Assign 1-3 votes to this user
        const votesForUser = Math.min(
          Math.floor(Math.random() * 3) + 1,
          votesRemaining
        );
        votesRemaining -= votesForUser;

        // Check if user already has votes on this product
        const existingAssignment = voteAssignments.find(
          ([id]) => id === userId
        );
        if (existingAssignment) {
          existingAssignment[1] += votesForUser;
        } else {
          voteAssignments.push([userId, votesForUser]);
        }
      }

      // Update the product with new vote data
      const updatedUserVotes_denver = { ...currentUserVotes_denver };
      let voteIncrement = 0;

      for (const [userId, voteCount] of voteAssignments) {
        updatedUserVotes_denver[userId] =
          (updatedUserVotes_denver[userId] || 0) + voteCount;
        voteIncrement += voteCount;
      }

      // Generate random downvotes (1-3, but never exceeding upvotes)
      // Downvotes are stored as negative values in the same userVotes map
      const maxDownvotes = Math.min(3, voteIncrement);
      const numDownvotes = Math.floor(Math.random() * maxDownvotes) + 1;
      let downvoteIncrement = 0;
      const usedUserIds = new Set(voteAssignments.map(([id]) => id));
      let attempts = 0;
      const maxAttempts = 50;
      let downvotesRemaining = numDownvotes;

      while (downvotesRemaining > 0 && attempts < maxAttempts) {
        attempts++;
        const randomUserIndex = Math.floor(
          Math.random() * TEST_USER_IDS.length
        );
        const userId = TEST_USER_IDS[randomUserIndex];

        // Make sure this user didn't vote upvotes
        if (usedUserIds.has(userId)) {
          continue;
        }

        usedUserIds.add(userId);
        const downvotesForUser = Math.min(downvotesRemaining, 3);
        downvotesRemaining -= downvotesForUser;
        downvoteIncrement -= downvotesForUser; // Negative for downvotes
        updatedUserVotes_denver[userId] =
          (updatedUserVotes_denver[userId] || 0) - downvotesForUser;
      }

      // Generate a timestamp for today with random time not exceeding current time
      const now = new Date();
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const timeDiffMs = now.getTime() - today.getTime();
      const randomMs = Math.random() * timeDiffMs;
      const randomTime = new Date(today.getTime() + randomMs);

      // Add to batch
      const productRef = doc(db, "products", productId);
      batch.update(productRef, {
        userVotes_denver: updatedUserVotes_denver,
        votes_denver: currentVotes_denver + voteIncrement + downvoteIncrement,
        lastVotedAt_denver: Timestamp.fromDate(randomTime),
      });

      totalVotesAdded += voteIncrement;
      batchOps++;

      // Commit batch every 50 operations
      if (batchOps >= 50) {
        await batch.commit();
        console.log(`Committed ${batchOps} operations...`);
        batch = writeBatch(db);
        batchOps = 0;
      }
    }

    // Commit remaining operations
    if (batchOps > 0) {
      await batch.commit();
      console.log(`Committed final ${batchOps} operations`);
    }

    console.log(`✅ Test vote injection complete!`);
    console.log(`Total votes added: ${totalVotesAdded}`);
    console.log(`Products updated: ${products.length}`);
  } catch (error) {
    console.error("Error adding test votes:", error);
    throw error;
  }
};

export const removeDownvoteFields = async () => {
  console.log("Starting cleanup of userDownvotes fields...");

  try {
    const productsRef = collection(db, "products");
    const snapshot = await getDocs(productsRef);

    let totalUpdated = 0;
    let batch = writeBatch(db);
    let batchOps = 0;

    for (const productDoc of snapshot.docs) {
      const data = productDoc.data();
      const hasNycDownvotes = "userDownvotes_nyc" in data;
      const hasDenverDownvotes = "userDownvotes_denver" in data;

      if (hasNycDownvotes || hasDenverDownvotes) {
        const productRef = doc(db, "products", productDoc.id);
        const updates: Record<string, any> = {};

        if (hasNycDownvotes) {
          updates.userDownvotes_nyc = deleteField();
        }
        if (hasDenverDownvotes) {
          updates.userDownvotes_denver = deleteField();
        }

        batch.update(productRef, updates);
        batchOps++;
        totalUpdated++;

        console.log(`Cleaning ${productDoc.data().name} (${productDoc.id})`);

        // Commit batch every 50 operations
        if (batchOps >= 50) {
          await batch.commit();
          console.log(`Committed ${batchOps} operations...`);
          batch = writeBatch(db);
          batchOps = 0;
        }
      }
    }

    // Commit remaining operations
    if (batchOps > 0) {
      await batch.commit();
      console.log(`Committed final ${batchOps} operations`);
    }

    console.log(`✅ Cleanup complete!`);
    console.log(`Total products updated: ${totalUpdated}`);
  } catch (error) {
    console.error("Error cleaning up downvote fields:", error);
    throw error;
  }
};
