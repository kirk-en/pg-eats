import { chromium } from "playwright";
import fs from "fs";

const scraper = async () => {
  // Using a simple demo e-commerce site for testing
  const TARGET_URL = "https://webscraper.io/test-sites/e-commerce/allinone";
  const OUTPUT_FILE = "products.json";

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent:
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
  });
  const page = await context.newPage();

  try {
    console.log(`Navigating to ${TARGET_URL}...`);
    await page.goto(TARGET_URL, {
      waitUntil: "networkidle",
      timeout: 30000,
    });

    console.log("Extracting products...");

    // Extract products from the demo site
    const products = await page.evaluate(() => {
      const items = [];

      // Demo site uses product-item class
      document.querySelectorAll(".product").forEach((el) => {
        const titleEl = el.querySelector("h2");
        const descEl = el.querySelector(".description");
        const priceEl = el.querySelector(".price");
        const imageEl = el.querySelector("img");

        if (titleEl) {
          items.push({
            name: titleEl.innerText.trim(),
            category: el.closest(".category")?.dataset.category || "General",
            description: descEl?.innerText.trim() || "",
            price: priceEl?.innerText.trim() || "",
            imageUrl: imageEl?.src || null,
          });
        }
      });

      return items;
    });

    console.log(`Found ${products.length} products`);
    console.log("Sample:", products.slice(0, 3));

    // Save to file
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(products, null, 2));
    console.log(`Saved ${products.length} products to ${OUTPUT_FILE}`);
  } catch (error) {
    console.error("Scraping error:", error.message);
  } finally {
    await context.close();
    await browser.close();
  }
};

scraper();
