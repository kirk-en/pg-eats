import {
  collection,
  getDocs,
  doc,
  writeBatch,
  Timestamp,
} from "firebase/firestore";
import { db } from "../lib/firebase";

const TEST_USER_IDS = [
  "01798f4f-ed45-4516-9d9c-23591f38a8e0",
  "1ea57c0b-38c1-4649-a786-ba03bceb6e24",
  "6287a104-a362-4224-a87e-312da4ea30c3",
  "660a1ac4-41ff-4e43-9bcf-f3aeec1697f0",
  "a48bc44a-2c67-4d5a-833a-5f1807d6c8a0",
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
        votes_nyc: currentVotes_nyc + voteIncrement,
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
        votes_denver: currentVotes_denver + voteIncrement,
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
