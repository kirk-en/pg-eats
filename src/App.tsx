import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { CssBaseline, Box } from "@mui/material";
import "./App.css";
import { Header, Hero, SnacksGrid, Footer, Categories } from "./components";

interface Snack {
  id: string;
  name: string;
  image: string;
  price?: string | number;
  votes?: number;
  categoryId?: string;
  imageUrl?: string;
  category?: string;
  tags?: string[];
}

interface Category {
  id: string;
  name: string;
}

function App() {
  const [snacks, setSnacks] = useState<Snack[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [appliedSearch, setAppliedSearch] = useState<string>("");
  const [snapshotSnacks, setSnapshotSnacks] = useState<Snack[]>([]);
  const debounceTimerRef = useRef<NodeJS.Timeout>();

  // Calculate next voting deadline (Friday of next week)
  const getNextVotingDeadline = () => {
    const today = new Date();
    const daysUntilFriday = (5 - today.getDay() + 7) % 7 || 7;
    const nextFriday = new Date(today);
    nextFriday.setDate(today.getDate() + daysUntilFriday);
    return nextFriday.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  const votingDeadline = getNextVotingDeadline();

  useEffect(() => {
    // Load products catalog
    fetch("/products-catalog.json")
      .then((res) => res.json())
      .then((data) => {
        // Transform products to match our Snack interface
        const transformedProducts: Snack[] = data.products.map(
          (product: any) => ({
            id: product.id,
            name: product.name,
            image: product.imageUrl,
            imageUrl: product.imageUrl,
            price: product.price,
            votes: 0,
            category: product.category,
            tags: product.tags || [],
            categoryId: product.category
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, "-"),
          })
        );

        // Create categories from the catalog
        const categoryList: Category[] = [
          { id: "all", name: "Most Popular" },
          { id: "upcoming", name: "Up and Coming" },
          ...data.metadata.categories.map((cat: string) => ({
            id: cat.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
            name: cat,
          })),
        ];

        setSnacks(transformedProducts);
        setCategories(categoryList);
        setIsLoading(false);
      })
      .catch((error) => {
        console.error("Error loading products:", error);
        setIsLoading(false);
      });
  }, []);

  const handleVote = (snackId: string) => {
    setSnacks(
      snacks.map((snack) =>
        snack.id === snackId
          ? { ...snack, votes: (snack.votes ?? 0) + 1 }
          : snack
      )
    );
  };

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId);
    setAppliedSearch("");
    setSearchQuery("");
    // Capture snapshot for Most Popular when selected
    if (categoryId === "all") {
      // Shuffle the snacks randomly
      const shuffled = [...snacks].sort(() => Math.random() - 0.5);
      setSnapshotSnacks(shuffled);
    }
  };

  const handleSearchInput = useCallback((query: string) => {
    setSearchQuery(query);

    // Clear existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Set new timer for debounced search
    debounceTimerRef.current = setTimeout(() => {
      setAppliedSearch(query);
    }, 200); // 200ms delay for snappy feel
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const filteredSnacks = useMemo(() => {
    if (appliedSearch) {
      return snacks.filter((snack) => {
        const searchLower = appliedSearch.toLowerCase();
        return (
          snack.name.toLowerCase().includes(searchLower) ||
          snack.category?.toLowerCase().includes(searchLower) ||
          snack.tags?.some((tag) => tag.toLowerCase().includes(searchLower))
        );
      });
    } else if (selectedCategory === "all") {
      return [...snapshotSnacks];
    } else {
      return snacks.filter((snack) => snack.categoryId === selectedCategory);
    }
  }, [appliedSearch, selectedCategory, snapshotSnacks, snacks]);

  return (
    <>
      <CssBaseline />
      <Box
        className="app-container"
        sx={{
          display: "flex",
          flexDirection: "column",
          minHeight: "100vh",
          backgroundColor: "#f8fafb",
        }}
      >
        <Header
          votingDeadline={votingDeadline}
          searchQuery={searchQuery}
          onSearchChange={handleSearchInput}
        />
        <Box
          component="main"
          className="app-main"
          sx={{
            flex: 1,
            width: "100%",
            padding: { xs: "1rem 0.5rem", sm: "1rem", md: "1.5rem" },
            display: "flex",
            gap: 1.5,
            flexDirection: { xs: "column", md: "row" },
          }}
        >
          {/* Sidebar - Categories */}
          <Box
            sx={{
              width: { xs: "100%", md: "220px" },
              flexShrink: 0,
              position: { xs: "relative", md: "sticky" },
              top: { xs: 0, md: "5.5rem" },
              height: { xs: "auto", md: "calc(100vh - 5.5rem)" },
              overflow: "auto",
            }}
          >
            <Categories
              categories={categories}
              selectedCategory={selectedCategory}
              onSelectCategory={handleCategorySelect}
            />
          </Box>

          {/* Main Content - Products Grid */}
          <Box sx={{ flex: 1, width: "100%", overflow: "auto" }}>
            <SnacksGrid
              snacks={filteredSnacks}
              onVote={handleVote}
              isLoading={isLoading}
            />
          </Box>
        </Box>
        <Footer />
      </Box>
    </>
  );
}

export default App;
