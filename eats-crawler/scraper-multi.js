import { chromium } from "playwright";
import fs from "fs";

// Anti-bot configuration
const CONFIG = {
  minDelayMs: 1000, // Minimum delay between requests
  maxDelayMs: 2500, // Maximum delay between requests
  requestsPerMinute: 12, // Max requests per minute per IP
  useRotatingUserAgents: true,
  headless: true,
};

// Rotating user agents to avoid detection
const USER_AGENTS = [
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15",
];

// Utility functions
const randomDelay = () => {
  const delay =
    Math.random() * (CONFIG.maxDelayMs - CONFIG.minDelayMs) + CONFIG.minDelayMs;
  return new Promise((resolve) => setTimeout(resolve, delay));
};

const getRandomUserAgent = () => {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
};

// Define your pages to scrape
const PAGES_TO_SCRAPE = [
  // DRINKS - Already scraped, comment out to skip

  // {
  //   url: "https://www.instacart.com/store/costco/collections/soda-soft-drinks",
  //   category: "Soda & Soft Drinks",
  //   tags: ["drinks", "soda", "beverages"],
  // },
  // {
  //   url: "https://www.instacart.com/store/costco/collections/water-sparkling-water/subjects/820",
  //   category: "Water & Sparkling Water",
  //   tags: ["water", "sparkling", "beverages"],
  // },
  // {
  //   url: "https://www.instacart.com/store/costco/collections/water-sparkling-water/subjects/819",
  //   category: "Water & Sparkling Water",
  //   tags: ["water", "sparkling", "beverages"],
  // },
  // {
  //   url: "https://www.instacart.com/store/costco/collections/energy-drinks",
  //   category: "Energy Drinks",
  //   tags: ["energy", "drinks", "beverages"],
  // },
  // {
  //   url: "https://www.instacart.com/store/costco/collections/coffee/subjects/811",
  //   category: "Coffee",
  //   tags: ["coffee", "beverages"],
  // },
  // {
  //   url: "https://www.instacart.com/store/costco/collections/coffee/subjects/810",
  //   category: "Coffee",
  //   tags: ["coffee", "beverages"],
  // },
  // {
  //   url: "https://www.instacart.com/store/costco/collections/990-protein-shakes",
  //   category: "Protein Shakes",
  //   tags: ["protein", "shakes", "beverages"],
  // },
  // {
  //   url: "https://www.instacart.com/store/costco/collections/kombucha",
  //   category: "Kombucha",
  //   tags: ["kombucha", "beverages"],
  // },
  // {
  //   url: "https://www.instacart.com/store/costco/collections/juice",
  //   category: "Juice",
  //   tags: ["juice", "beverages"],
  // },
  // {
  //   url: "https://www.instacart.com/store/costco/collections/sports-drinks",
  //   category: "Sports Drinks",
  //   tags: ["sports", "drinks", "beverages"],
  // },
  // {
  //   url: "https://www.instacart.com/store/costco/collections/tea",
  //   category: "Tea",
  //   tags: ["tea", "beverages"],
  // },
  // {
  //   url: "https://www.instacart.com/store/costco/collections/870-milk",
  //   category: "Milk",
  //   tags: ["milk", "beverages"],
  // },
  // {
  //   url: "https://www.instacart.com/store/costco/collections/drink-mixes",
  //   category: "Drink Mixes",
  //   tags: ["drink mixes", "beverages"],
  // },
  // // NEW SNACK CATEGORIES
  // {
  //   url: "https://www.instacart.com/store/costco/collections/fresh-fruits",
  //   category: "Fresh Fruits",
  //   tags: ["snacks", "fruits", "fresh"],
  // },
  // {
  //   url: "https://www.instacart.com/store/costco/collections/chocolate-candy",
  //   category: "Chocolate & Candy",
  //   tags: ["snacks", "chocolate", "candy"],
  // },
  // {
  //   url: "https://www.instacart.com/store/costco/collections/snack-bars",
  //   category: "Snack Bars",
  //   tags: ["snacks", "bars", "energy"],
  // },
  // {
  //   url: "https://www.instacart.com/store/costco/collections/chips",
  //   category: "Chips",
  //   tags: ["snacks", "chips", "salty"],
  // },
  // {
  //   url: "https://www.instacart.com/store/costco/collections/9795-nuts-trail-mix",
  //   category: "Nuts & Trail Mix",
  //   tags: ["snacks", "nuts", "trail mix"],
  // },
  // {
  //   url: "https://www.instacart.com/store/costco/collections/jerky",
  //   category: "Jerky",
  //   tags: ["snacks", "jerky", "protein"],
  // },
  // {
  //   url: "https://www.instacart.com/store/costco/collections/873-more-snacks",
  //   category: "More Snacks",
  //   tags: ["snacks", "miscellaneous"],
  // },
  // {
  //   url: "https://www.instacart.com/store/costco/collections/popcorn",
  //   category: "Popcorn",
  //   tags: ["snacks", "popcorn"],
  // },
  // {
  //   url: "https://www.instacart.com/store/costco/collections/9798-cookies-sweet-treats",
  //   category: "Cookies & Sweet Treats",
  //   tags: ["snacks", "cookies", "sweets"],
  // },
  // {
  //   url: "https://www.instacart.com/store/costco/collections/9796-dried-fruit-fruit-snacks",
  //   category: "Dried Fruit & Fruit Snacks",
  //   tags: ["snacks", "dried fruit", "fruit"],
  // },
  // {
  //   url: "https://www.instacart.com/store/costco/collections/dips",
  //   category: "Dips & Spreads",
  //   tags: ["snacks", "dips", "condiments"],
  // },
  // {
  //   url: "https://www.instacart.com/store/costco/collections/gum-and-mints",
  //   category: "Gum & Mints",
  //   tags: ["snacks", "gum", "candy"],
  // },
  // {
  //   url: "https://www.instacart.com/store/costco/collections/9804-fruit-cups-applesauce",
  //   category: "Fruit Cups & Applesauce",
  //   tags: ["snacks", "fruit", "healthy"],
  // },
  // {
  //   url: "https://www.instacart.com/store/costco/collections/9805-pudding-gelatin",
  //   category: "Pudding & Gelatin",
  //   tags: ["snacks", "pudding", "dessert"],
  // },
  {
    url: "https://www.instacart.com/store/costco/collections/10242-beer-cider",
    category: "Beer & Cider",
    tags: ["snacks", "beer", "cider"],
  },
  {
    url: "https://www.instacart.com/store/costco/collections/9863-eggs",
    category: "Eggs",
    tags: ["snacks", "eggs", "protein"],
  },
  {
    url: "https://www.instacart.com/store/costco/collections/hot-dogs-sausages",
    category: "Hot Dogs & Sausages",
    tags: ["snacks", "hot dogs", "sausages", "protein"],
  },
  {
    url: "https://www.instacart.com/store/costco/collections/breakfast-pastries",
    category: "Breakfast Pastries",
    tags: ["snacks", "breakfast", "pastries"],
  },
  {
    url: "https://www.instacart.com/store/costco/collections/cakes-pies",
    category: "Cakes & Pies",
    tags: ["snacks", "cakes", "pies"],
  },
  {
    url: "https://www.instacart.com/store/costco/collections/bread",
    category: "Bread",
    tags: ["snacks", "bread", "bakery"],
  },
  {
    url: "https://www.instacart.com/store/costco/collections/cookies-brownies",
    category: "Cookies & Brownies",
    tags: ["snacks", "cookies", "brownies"],
  },
  {
    url: "https://www.instacart.com/store/costco/collections/bagels-english-muffins",
    category: "Bagels & English Muffins",
    tags: ["snacks", "bagels", "english muffins"],
  },
  {
    url: "https://www.instacart.com/store/costco/collections/1367-canned-goods-soups",
    category: "Canned Goods & Soups",
    tags: ["snacks", "canned goods", "soups"],
  },
  {
    url: "https://www.instacart.com/store/costco/collections/1372-breakfast",
    category: "Breakfast",
    tags: ["snacks", "breakfast"],
  },
  {
    url: "https://www.instacart.com/store/costco/collections/1370-sauces-condiments",
    category: "Sauces & Condiments",
    tags: ["snacks", "sauces", "condiments"],
  },
  {
    url: "https://www.instacart.com/store/costco/collections/1371-nut-butters-spreads",
    category: "Nut Butters & Spreads",
    tags: ["snacks", "nut butters", "spreads"],
  },
  {
    url: "https://www.instacart.com/store/costco/collections/rc-christmas-toys-fy26",
    category: "Holiday",
    tags: ["misc", "holiday"],
  },
  // Add more snack pages below as needed
];

const scraper = async () => {
  const OUTPUT_FILE = "products-catalog.json";
  let allProducts = [];
  const categories = new Set();
  let requestCount = 0;
  let lastRequestTime = Date.now();

  // Load existing catalog if it exists
  let existingCatalog = null;
  if (fs.existsSync(OUTPUT_FILE)) {
    try {
      const fileContent = fs.readFileSync(OUTPUT_FILE, "utf-8");
      existingCatalog = JSON.parse(fileContent);
      console.log(
        `📦 Loaded existing catalog with ${existingCatalog.products.length} products`
      );
      allProducts = existingCatalog.products.map((p) => ({
        name: p.name,
        price: p.price,
        imageUrl: p.imageUrl,
        category: p.category,
        tags: p.tags,
      }));
      // Load existing categories
      existingCatalog.metadata.categories.forEach((cat) => categories.add(cat));
    } catch (error) {
      console.error(
        "⚠️  Could not load existing catalog, starting fresh:",
        error.message
      );
    }
  }

  const browser = await chromium.launch({ headless: CONFIG.headless });

  try {
    // Scrape each page
    for (const pageConfig of PAGES_TO_SCRAPE) {
      // Rate limiting: ensure we don't exceed requests per minute
      const timeSinceLastRequest = Date.now() - lastRequestTime;
      const minIntervalMs = 60000 / CONFIG.requestsPerMinute;

      if (timeSinceLastRequest < minIntervalMs) {
        const waitTime = minIntervalMs - timeSinceLastRequest;
        console.log(`Rate limiting: waiting ${Math.round(waitTime)}ms...`);
        await new Promise((resolve) => setTimeout(resolve, waitTime));
      }

      console.log(
        `\nScraping (${requestCount + 1}/${PAGES_TO_SCRAPE.length}): ${
          pageConfig.category
        }...`
      );

      // Add random delay before request
      await randomDelay();

      // Create new context for each page to avoid detection
      const context = await browser.newContext({
        userAgent: CONFIG.useRotatingUserAgents
          ? getRandomUserAgent()
          : USER_AGENTS[0],
        viewport: { width: 1280, height: 800 },
        extraHTTPHeaders: {
          "Accept-Language": "en-US,en;q=0.9",
          Accept: "text/html,application/xhtml+xml",
          Referer: "https://www.instacart.com/",
        },
      });

      const page = await context.newPage();

      // Set extra headers
      await page.setExtraHTTPHeaders({
        "Accept-Language": "en-US,en;q=0.9",
      });

      try {
        await page.goto(pageConfig.url, {
          waitUntil: "domcontentloaded",
          timeout: 30000,
        });

        // Vary wait time to appear more human
        await page.waitForTimeout(Math.random() * 2000 + 2000);

        // Close modal
        try {
          const closeButtons = await page.$$(
            'button[aria-label*="Close"], button[aria-label*="close"], button[class*="close"]'
          );
          if (closeButtons.length > 0) {
            await closeButtons[0].click();
            await page.waitForTimeout(1000);
          }
        } catch (e) {
          // Modal optional
        }

        // Scroll to load products
        for (let i = 0; i < 2; i++) {
          await page.evaluate(() => {
            window.scrollBy(0, 300);
          });
          await page.waitForTimeout(500);
        }
        await page.evaluate(() => {
          window.scrollTo(0, 0);
        });
        await page.waitForTimeout(800);

        // Extract products
        const products = await page.evaluate((config) => {
          const items = [];
          const cards = document.querySelectorAll(
            '[data-testid="item-card-image"], [data-testid^="item-card"]'
          );

          cards.forEach((card, idx) => {
            try {
              let productContainer = card;
              for (let i = 0; i < 8; i++) {
                if (productContainer.parentElement) {
                  productContainer = productContainer.parentElement;
                }
              }

              const imageEl = productContainer.querySelector("img");
              const imageAlt = imageEl?.alt || "";
              const imageSrc = imageEl?.src || "";

              let name = imageAlt;
              if (!name || name.length < 3) {
                const nameEl = productContainer.querySelector(
                  "h1, h2, h3, span[class*='name'], p[class*='name']"
                );
                name = nameEl?.innerText || imageAlt;
              }

              const containerText = productContainer.innerText || "";
              const priceMatch = containerText.match(/\$[\d.,]+/);
              const price = priceMatch ? priceMatch[0] : "";

              // Extract product ID from image URL (the UUID after "large_")
              const productIdMatch = imageSrc.match(/large_([a-f0-9-]+)/);
              const productId = productIdMatch ? productIdMatch[1] : null;

              if (name && name.trim().length > 2) {
                items.push({
                  name: name.trim(),
                  price: price || "N/A",
                  imageUrl: imageSrc,
                  productId: productId,
                  category: config.category,
                  tags: config.tags,
                });
              }
            } catch (err) {
              // Skip
            }
          });

          return items;
        }, pageConfig);

        console.log(
          `Found ${products.length} products in ${pageConfig.category}`
        );
        allProducts.push(...products);
        categories.add(pageConfig.category);

        requestCount++;
        lastRequestTime = Date.now();
      } catch (error) {
        console.error(`Error scraping ${pageConfig.category}:`, error.message);
      } finally {
        await page.close();
        await context.close();
      }
    }

    // Deduplicate and add IDs (by product name)
    const uniqueMap = new Map();
    allProducts.forEach((product) => {
      uniqueMap.set(product.name, product);
    });

    console.log(`\n📊 After deduplication: ${uniqueMap.size} unique products`);

    const processedProducts = Array.from(uniqueMap.values()).map(
      (product, idx) => ({
        id: product.productId || `prod_${String(idx + 1).padStart(4, "0")}`,
        name: product.name,
        category: product.category,
        price: product.price,
        imageUrl: product.imageUrl,
        source: "Instacart Costco",
        tags: product.tags || [],
        searchText: `${product.name} ${product.category} ${
          product.tags?.join(" ") || ""
        }`
          .toLowerCase()
          .trim(),
        url: product.sourceUrl || "",
        createdAt: new Date().toISOString(),
      })
    );

    // Build final structure
    const catalog = {
      metadata: {
        name: "Office Snacks Catalog",
        description: "Curated product catalog from Instacart Costco",
        lastUpdated: new Date().toISOString(),
        totalProducts: processedProducts.length,
        categories: Array.from(categories).sort(),
        sources: ["Instacart Costco"],
      },
      products: processedProducts,
    };

    // Save
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(catalog, null, 2));

    // Summary
    const newProducts =
      processedProducts.length - (existingCatalog?.products.length || 0);
    console.log(
      `\n✅ Saved ${processedProducts.length} products to ${OUTPUT_FILE}`
    );
    console.log(
      `   ├─ New products added: ${newProducts > 0 ? `+${newProducts}` : "0"}`
    );
    console.log(
      `   ├─ Total from before: ${existingCatalog?.products.length || "0"}`
    );
    console.log(`   └─ Categories: ${Array.from(categories).join(", ")}`);
    console.log(`\n⏱️  Total requests made: ${requestCount}`);
    console.log(`📍 Estimated time: ${(requestCount * 5) / 1000 / 60} minutes`);
  } catch (error) {
    console.error("Error:", error.message);
  } finally {
    await browser.close();
  }
};

scraper();
