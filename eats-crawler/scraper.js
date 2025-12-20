import { chromium } from "playwright";
import fs from "fs";

const scraper = async () => {
  // Configuration
  const TARGET_URL =
    "https://www.instacart.com/store/costco/collections/soda-soft-drinks";
  const OUTPUT_FILE = "products.json";

  // Launch browser
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent:
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    viewport: { width: 1280, height: 720 },
  });
  const page = await context.newPage();

  try {
    console.log(`Navigating to ${TARGET_URL}...`);
    // Use domcontentloaded for faster load
    await page.goto(TARGET_URL, {
      waitUntil: "domcontentloaded",
      timeout: 60000,
    });

    // Wait longer for JavaScript to render
    console.log("Waiting for JavaScript to render...");
    await page.waitForTimeout(5000);

    // Debug: Log what we found BEFORE waiting
    const allDivs = await page.evaluate(() => {
      return {
        totalDivs: document.querySelectorAll("div").length,
        dataTestIds: Array.from(document.querySelectorAll("[data-testid]"))
          .slice(0, 30)
          .map((el) => el.getAttribute("data-testid")),
        allClassNames: Array.from(document.querySelectorAll("*[class]"))
          .slice(0, 30)
          .map((el) => el.className)
          .filter((c) => c && c.length < 150),
      };
    });
    console.log("Page debug info:", JSON.stringify(allDivs, null, 2));

    // Try to wait for any of these common product containers
    try {
      await Promise.race([
        page.waitForSelector('[data-testid="product-item"]', {
          timeout: 5000,
        }),
        page.waitForSelector('[class*="ProductItem"]', { timeout: 5000 }),
        page.waitForSelector('[class*="product"]', { timeout: 5000 }),
      ]);
    } catch (e) {
      console.log("Product selector timeout - continuing anyway...");
      await page.screenshot({ path: "debug-screenshot.png" });
      console.log("Screenshot saved as debug-screenshot.png");
    }

    // Wait for content to actually load by checking body
    console.log("Waiting for content...");
    await page.waitForFunction(() => document.body.innerText.length > 100, {
      timeout: 30000,
    });

    // Scroll to trigger lazy loading
    console.log("Scrolling to load products...");
    await page.evaluate(() => {
      window.scrollBy(0, window.innerHeight);
    });
    await page.waitForTimeout(2000);

    // Extract products from Instacart
    const products = await page.evaluate(() => {
      const items = [];

      // Try new selectors based on what we found
      const productCards = document.querySelectorAll(
        '[data-testid="item-card-image"], [class*="ProductCard"], a[href*="/p/"]'
      );

      console.log("Found elements with selector:", productCards.length);

      // If no products found with main selector, try to find any product containers
      let containers =
        productCards.length > 0
          ? productCards
          : document.querySelectorAll("[class*='card'], [class*='item']");

      containers.forEach((el) => {
        // Get closest product container
        const container =
          el.closest('[class*="Product"], [class*="Item"], a[href*="/p/"]') ||
          el;

        const imageEl = container.querySelector("img");
        const nameEl = container.querySelector(
          "span, p, h3, h2, a, [class*='name'], [class*='title']"
        );

        const name = nameEl?.innerText || imageEl?.alt;
        const imageUrl = imageEl?.src;

        if (name && name.trim()) {
          items.push({
            name: name.trim(),
            category: "Soda & Soft Drinks",
            imageUrl: imageUrl || null,
            price: null,
          });
        }
      });

      // Deduplicate by name
      const seen = new Set();
      return items.filter((item) => {
        if (seen.has(item.name)) return false;
        seen.add(item.name);
        return true;
      });
    });

    console.log(`Found ${products.length} products`);
    console.log("Sample:", products.slice(0, 3));

    // Save to file
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(products, null, 2));
    console.log(`Saved to ${OUTPUT_FILE}`);
  } catch (error) {
    console.error("Scraping error:", error.message);
  } finally {
    await context.close();
    await browser.close();
  }
};

scraper();
