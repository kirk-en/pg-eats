import fs from "fs";
import path from "path";
import sharp from "sharp";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

try {
  const inputPath = path.join(__dirname, "src/assets/pg-coin.png");
  const outputPath = path.join(__dirname, "src/assets/pg-coin.webp");

  sharp(inputPath)
    .webp({ quality: 50 })
    .toFile(outputPath)
    .then((info) => {
      console.log("Conversion successful:", info);
      // Read file sizes
      const originalSize = fs.statSync(inputPath).size;
      const newSize = fs.statSync(outputPath).size;
      console.log(
        `Original: ${originalSize} bytes, WebP: ${newSize} bytes, Reduction: ${(
          100 -
          (newSize / originalSize) * 100
        ).toFixed(1)}%`
      );
    })
    .catch((err) => {
      console.error("Conversion error:", err);
      process.exit(1);
    });
} catch (e) {
  console.error("Sharp not available. Please install: npm install sharp");
  process.exit(1);
}
