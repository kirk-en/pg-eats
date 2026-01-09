// Node.js script to add bonus coins to all users
const admin = require("firebase-admin");

const serviceAccount = require("./firebase-key.json"); // You'll need to provide your Firebase service account key

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function addBonusCoinsToAllUsers(bonusAmount = 150) {
  try {
    const usersRef = db.collection("users");
    const snapshot = await usersRef.get();

    console.log(
      `Adding ${bonusAmount} bonus coins to ${snapshot.size} users...`
    );

    let updateCount = 0;
    for (const userDoc of snapshot.docs) {
      await userDoc.ref.update({
        bonusCoins: bonusAmount,
      });
      updateCount++;
      console.log(`Updated user ${updateCount}/${snapshot.size}`);
    }

    console.log(
      `Successfully added ${bonusAmount} bonus coins to ${updateCount} users!`
    );
    process.exit(0);
  } catch (error) {
    console.error("Error adding bonus coins to users:", error);
    process.exit(1);
  }
}

addBonusCoinsToAllUsers(150);
