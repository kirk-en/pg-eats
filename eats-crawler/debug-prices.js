import { chromium } from "playwright";

const scraper = async () => {
  const TARGET_URL =
    "https://www.instacart.com/store/costco/collections/soda-soft-drinks";

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
    await page.waitForTimeout(3000);

    // Check page source for price data
    const pageContent = await page.content();

    // Look for price patterns in the HTML
    const pricePatterns = pageContent.match(/\$[\d.,]+/g);
    if (pricePatterns && pricePatterns.length > 0) {
      console.log("Found prices in page source:");
      console.log(pricePatterns.slice(0, 10));
    } else {
      console.log("No prices found in page source");
    }

    // Check for specific price selectors
    const priceElements = await page.evaluate(() => {
      const selectors = [
        '[data-testid*="price"]',
        '[class*="price"]',
        '[class*="Price"]',
        'span:contains("$")',
        "[data-price]",
      ];

      const found = {};
      selectors.forEach((sel) => {
        const els = document.querySelectorAll(sel);
        if (els.length > 0) {
          found[sel] = els.length;
        }
      });
      return found;
    });

    console.log("Price selector matches:", priceElements);
  } catch (error) {
    console.error("Error:", error.message);
  } finally {
    await context.close();
    await browser.close();
  }
};

scraper();
