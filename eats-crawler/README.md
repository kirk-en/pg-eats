# Eats Crawler

Simple Playwright-based web scraper for product data.

## Setup

```bash
npm install
```

## Usage

1. Edit `scraper.js` and update:

   - `TARGET_URL`: Change to your target website
   - CSS selectors: Adjust `[data-product]`, `.product-name`, etc. to match your target site's HTML structure

2. Run:

```bash
npm start
```

This will output a `products.json` file with the scraped data.

## How to find the right selectors

1. Open your target website in a browser
2. Right-click on a product name → "Inspect"
3. Look for the class or data attribute wrapping the product
4. Update the selectors in `scraper.js`

## Example output

```json
[
  {
    "name": "Margherita Pizza",
    "category": "Pizza",
    "imageUrl": "https://example.com/image.jpg"
  }
]
```
