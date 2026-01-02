# 🍕 Playground Eats

A fun and interactive web app for Playground employees to vote on their favorite office snacks before each office snack order.

## 🔐 Authentication

This app requires Google OAuth authentication. **Only users with @tryplayground.com email addresses can log in.**

## Features

- **Browse Snacks**: Browse a curated catalog of 269+ snacks from Costco via Instacart
- **Vote for Favorites**: Click to vote on snacks you want to see in the next office snack order
- **Multiple Views**:
  - **Most Popular**: Static snapshot view showing all snacks in random order (updated when you click on it)
  - **Up and Coming**: Coming soon - for recently voted snacks
  - **Categories**: Browse snacks by category (Chips, Chocolate, Drinks, etc.)
- **Smart Search**: Search across snack names, categories, and tags with debounced input for smooth performance
- **Sticky Navigation**: Header and categories stay visible while scrolling through products
- **Responsive Design**: Works great on mobile, tablet, and desktop
- **Real-time Voting**: Vote counts update immediately when you click the vote button

## Tech Stack

- **React 19.2.0** with TypeScript
- **Vite** for fast development and builds
- **Material-UI (MUI)** for professional UI components
- **Emotion** for CSS-in-JS styling

## How It Works

1. **Vote** for your favorite snacks before the voting deadline
2. **Vote counts reset** with each new snack drop/order
3. **Hover over "Next Snack Drop"** to see the deadline and voting rules
4. **Search** to find specific snacks across all categories
5. **Browse categories** to explore snacks by type

## Project Structure

```
src/
├── components/
│   ├── Header.tsx          # Sticky header with logo, search, and deadline
│   ├── Categories.tsx      # Scrollable category sidebar
│   ├── SnacksGrid.tsx      # Responsive product grid
│   ├── SnackCard.tsx       # Individual snack card with vote button
│   ├── Hero.tsx            # Welcome section
│   ├── Footer.tsx          # Page footer
│   └── index.ts            # Component exports
├── App.tsx                 # Main app component with state management
├── App.css                 # Global styles and CSS variables
├── main.tsx                # React entry point
└── index.css               # Base styles

products-catalog.json      # 269 snacks with images, prices, and metadata
```

## Snack Data

The app loads snack data from `products-catalog.json` which includes:

- 450+ snack products from Costco
- 25 snack categories
- Product images, prices, and tags
- Search-optimized metadata

## Future Features

- Persistent vote storage (localStorage or backend)
- "Up and Coming" view with recently voted items
- Sorting options (by votes, price, date)
- Product detail modals
- User authentication
- Voting analytics and leaderboards
- Backend API integration

## Color Scheme

- **Primary**: Navy Blue (#1a3a52)
- **Accent**: Green (#2ecc71)
- **Background**: Light Gray (#f8fafb)
