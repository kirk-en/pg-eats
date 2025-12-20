import { chromium } from "playwright";
import fs from "fs";

const scraper = async () => {
  const TARGET_URL =
    "https://www.instacart.com/store/costco/collections/soda-soft-drinks";
  const OUTPUT_FILE = "products.json";

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent:
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    viewport: { width: 1280, height: 800 },
  });
  const page = await context.newPage();

  try {
    console.log(`Navigating to ${TARGET_URL}...`);
    await page.goto(TARGET_URL, { waitUntil: "domcontentloaded" });

    console.log("Waiting for products to load...");

    // Wait a bit for JS to render
    await page.waitForTimeout(3000);

    // Scroll down to trigger lazy loading of prices
    console.log("Scrolling to load prices...");
    for (let i = 0; i < 3; i++) {
      await page.evaluate(() => {
        window.scrollBy(0, 300);
      });
      await page.waitForTimeout(800);
    }

    // Scroll back to top to ensure all items are visible
    await page.evaluate(() => {
      window.scrollTo(0, 0);
    });
    await page.waitForTimeout(1000);

    // Try to close any modal that might be blocking
    try {
      console.log("Checking for login/modal overlays...");

      // Try multiple ways to close the modal
      const closeButtons = await page.$$(
        'button[aria-label*="Close"], button[aria-label*="close"], button[class*="close"], [data-testid="close"]'
      );

      if (closeButtons.length > 0) {
        console.log(
          `Found ${closeButtons.length} close button(s), clicking first one...`
        );
        await closeButtons[0].click();
        await page.waitForTimeout(1500);
      } else {
        // Try clicking outside the modal (esc key)
        await page.press("Escape");
        await page.waitForTimeout(1000);
      }
    } catch (e) {
      // Modal handling is optional - don't fail if it doesn't exist
      console.log("No blocking modal found or already closed");
    }

    // Extract products using the item-card-image selector we found
    const products = await page.evaluate(() => {
      const items = [];

      // Get all product cards - try multiple selectors
      const cards = document.querySelectorAll(
        '[data-testid="item-card-image"], [data-testid^="item-card"], a[href*="/p/"], [class*="ProductCard"]'
      );

      console.log(`Found ${cards.length} product cards`);

      // Process each card
      cards.forEach((card, idx) => {
        try {
          // Get the parent product container - go up several levels to get the full card
          let productContainer = card;
          for (let i = 0; i < 8; i++) {
            if (productContainer.parentElement) {
              productContainer = productContainer.parentElement;
            }
          }

          // Extract data
          const imageEl = productContainer.querySelector("img");
          const imageAlt = imageEl?.alt || "";
          const imageSrc = imageEl?.src || "";

          // Try to find name in various ways
          let name = imageAlt;
          if (!name || name.length < 3) {
            const nameEl = productContainer.querySelector(
              "h1, h2, h3, span[class*='name'], p[class*='name'], a[class*='name']"
            );
            name = nameEl?.innerText || imageAlt;
          }

          // Look for price - extract from full container text
          let price = "";
          const containerText = productContainer.innerText || "";
          const priceMatch = containerText.match(/\$[\d.,]+/);
          if (priceMatch) {
            price = priceMatch[0];
          }

          if (name && name.trim().length > 2) {
            items.push({
              name: name.trim(),
              price: price || "Price not displayed",
              imageUrl: imageSrc,
              category: "Soda & Soft Drinks",
            });
          }
        } catch (err) {
          // Skip this card if extraction fails
        }
      });

      return items;
    });

    // Deduplicate by name
    const uniqueProducts = Array.from(
      new Map(products.map((p) => [p.name, p])).values()
    );

    console.log(`Found ${uniqueProducts.length} unique products`);
    if (uniqueProducts.length > 0) {
      console.log("Sample:", uniqueProducts.slice(0, 2));
    }

    // Save
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(uniqueProducts, null, 2));
    console.log(`Saved to ${OUTPUT_FILE}`);
  } catch (error) {
    console.error("Error:", error.message);
  } finally {
    await context.close();
    await browser.close();
  }
};

scraper();
