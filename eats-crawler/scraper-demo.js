import { chromium } from "playwright";
import fs from "fs";

const scraper = async () => {
  // Use a simple demo site that's scraper-friendly
  const TARGET_URL = "https://quotes.toscrape.com/";
  const OUTPUT_FILE = "products.json";

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    console.log(`Navigating to ${TARGET_URL}...`);
    await page.goto(TARGET_URL, { waitUntil: "load" });

    console.log("Extracting quote data...");

    // Extract quotes from the demo site
    const products = await page.evaluate(() => {
      const items = [];

      // This site has quotes in span.text elements
      document.querySelectorAll(".quote").forEach((el) => {
        const textEl = el.querySelector(".text");
        const authorEl = el.querySelector(".author");

        if (textEl) {
          items.push({
            name: textEl.innerText.replace(/[""]/g, "").trim(),
            category: "Quote",
            author: authorEl?.innerText.replace("--", "").trim() || "Unknown",
          });
        }
      });

      return items;
    });

    console.log(`Found ${products.length} items`);
    if (products.length > 0) {
      console.log("Sample:", products.slice(0, 2));
    }

    // Save to file
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(products, null, 2));
    console.log(`Saved to ${OUTPUT_FILE}`);
  } catch (error) {
    console.error("Error:", error.message);
  } finally {
    await browser.close();
  }
};

scraper();
