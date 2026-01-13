import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Update data with user IDs and new balances
const balanceUpdates = {
  "f1b197ba-f637-4b93-8a20-1ff5cf4766b5": 1000.0104553790459,
  "9b0878b1-ac48-4c07-a6a0-ceceb7362fa6": 12075.63667185837,
  "a48bc44a-2c67-4d5a-833a-5f1807d6c8a0": 0.938296884685,
  "6287a104-a362-4224-a87e-312da4ea30c3": 0.464184895123,
  "293460ab-62dc-4bad-a878-d2cea08f62bf": 12241.436398963288,
  "9d075981-85bd-4ede-b7aa-9e4c2ff5df06": 96.880320068849,
  "80a15c6d-01ab-4c1b-952b-46614a4848af": 0.000254522953,
  "97820e94-a87a-45ad-a8c0-fb9c717422a9": 0.000040685879,
  "0ab6eea9-8441-43a1-8ff9-3b9c3f4db05c": 12000,
  "42ea256f-afd2-4dd4-aa3e-b32d0f2d6531": 10000.0,
  "6e77b153-1ca5-4174-86bb-1db50ff184d8": 1082.791959535122,
  "c1e564c4-d180-41ab-a9db-a843e89b7c0d": 2000.87227477521,
  "32469e4a-1b91-4667-950f-54bcf091f7c5": 7601.712474912629,
  "69bc8e2b-807f-442f-a10a-ca45730bb302": 2987.405616892472,
  "dd09b4a9-7f65-4364-8475-b29cad8db6f8": 10000.0,
  "ad5f00d8-4410-4b24-bbfe-551bba1e0351": 1014.521132387288,
  "76994ad5-a2a9-4a5a-b20e-bd920fbd7ee3": 11001,
  "eb5cd07d-ccc5-4924-a279-ff50eb806cc9": 0,
  "c448cdc4-b35e-4a72-b46e-3a671e7b6417": 9598.801707835088,
  "aa317bb2-caff-4cdb-8f0a-8f97c3f12e64": 10034.394420011746,
  "670edf28-fce2-48f7-a198-db1bb318f022": 10000.0,
  "b73c61fc-073c-435d-8b63-c78498e68e08": 11002.103534542486,
  "1ea57c0b-38c1-4649-a786-ba03bceb6e24": 10023.45910269257,
  "a908d761-6175-4d3d-9619-58e52c684636": 10978.054173060227,
  "93beab1b-0ad7-4d1a-a4fe-f5a47564795e": 10963.403644343833,
  "c5f685fb-b513-4332-8bb2-27f595b1ab0c": 11000,
  "f7ea60af-ddd3-4cf3-9ed2-922de7895bef": 3682.603765104514,
  "54a729d9-6af8-45ce-90fe-b83367ef8fef": 3128.3885426452134,
  "ec0b10e4-0f1d-47d5-a460-2616ad5d9f56": 7708.656196419646,
  "08dc1697-37e6-4b7d-bd51-1cbbd5031cf4": 12000.182638328912,
  "01798f4f-ed45-4516-9d9c-23591f38a8e0": 1419.830248456903,
  "d50c81a5-e6bc-4cf4-a10b-1a4cc3bfad9d": 6000,
  "5a87650e-8540-4475-82e7-9539e0963d10": 3135.4587700101233,
  "ce136c73-32ad-4bd1-894f-7efff0c1a6a6": 7085.67381820401,
  "2a1336ae-d36b-478c-82bd-a8fb5ab1a447": 4013.690382845055,
  "30f75d89-ac04-4050-a058-6d04877a7572": 39356.74552160976,
  "f8a041d4-d726-4325-ab9e-eb48facd7e3b": 10000.0,
  "660a1ac4-41ff-4e43-9bcf-f3aeec1697f0": 2674.527272490618,
  "8b2ad1a9-0865-437b-95be-aac0726228ac": 6703.7432316596405,
  "9a9a844e-2cb6-4cdb-a8c4-cc0a7f186f64": 10000.0,
  "d4a07479-6064-46c5-bfa9-b25b62039283": 10000,
  "fe499f71-24bf-4e48-a899-803b4c3c4191": 348.448403610786,
};

// Read the current users.json file
const filePath = path.join(__dirname, "src/data/users.json");

try {
  const fileContent = fs.readFileSync(filePath, "utf-8");
  const users = JSON.parse(fileContent);

  // Update balances for matching users
  let updatedCount = 0;
  users.forEach((user) => {
    if (balanceUpdates.hasOwnProperty(user.id)) {
      user.balance = balanceUpdates[user.id];
      updatedCount++;
    }
  });

  // Write the updated data back to the file with proper formatting
  fs.writeFileSync(filePath, JSON.stringify(users, null, 2) + "\n", "utf-8");

  console.log(
    `✓ Successfully updated ${updatedCount} user balances in ${filePath}`
  );
  console.log(`✓ Total users in file: ${users.length}`);
  console.log("✓ All changes have been written to disk");
} catch (error) {
  console.error("Error updating user balances:", error.message);
  process.exit(1);
}
