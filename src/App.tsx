import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { CssBaseline, Box, ThemeProvider, createTheme } from "@mui/material";
import "./App.css";
import { Header, SnacksGrid, Footer, Categories } from "./components";
import {
  getProducts,
  getOffice,
  voteForProductBatch,
} from "./services/firestore";
import { useAuth } from "./contexts/AuthContext";
import { tipSnackCzar } from "./utils/supabaseApi";
import { Timestamp } from "firebase/firestore";

const theme = createTheme({
  typography: {
    fontFamily: '"Inter", system-ui, sans-serif',
  },
});

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
  const { user, addToBalance } = useAuth();
  const [snacks, setSnacks] = useState<Snack[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] =
    useState<string>("most-popular");
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [appliedSearch, setAppliedSearch] = useState<string>("");
  const [randomizedSnacks, setRandomizedSnacks] = useState<Snack[]>([]);
  const [office, setOffice] = useState<"nyc" | "denver">("nyc");
  const [language, setLanguage] = useState<"en" | "es">("en");
  const [votingDeadline, setVotingDeadline] = useState<string>("");
  const [isVotingActive, setIsVotingActive] = useState(false);
  const debounceTimerRef = useRef<NodeJS.Timeout>();
  const pendingVotesRef = useRef<{
    [key: string]: { voteChange: number; cost: number; timer: NodeJS.Timeout };
  }>({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 1. Fetch Products
        const products = await getProducts();

        // 2. Fetch Office Data
        const officeData = await getOffice(office);
        console.log("Fetched office data:", officeData);

        if (officeData && officeData.currentVotingPeriod) {
          const endDate = officeData.currentVotingPeriod.endDate.toDate();
          setVotingDeadline(
            endDate.toLocaleDateString("en-US", {
              weekday: "short",
              month: "short",
              day: "numeric",
            })
          );
          const isActive = officeData.currentVotingPeriod.status === "active";
          console.log(
            "Voting status:",
            officeData.currentVotingPeriod.status,
            "Is Active:",
            isActive
          );
          setIsVotingActive(isActive);
        } else {
          console.warn("No voting period found for office:", office);
          setIsVotingActive(false);
        }

        // Transform products to match our Snack interface
        const transformedProducts: Snack[] = products.map((product) => ({
          id: product.id,
          name: product.name,
          image: product.imageUrl,
          imageUrl: product.imageUrl,
          price: product.price,
          votes: office === "nyc" ? product.votes_nyc : product.votes_denver,
          category: product.category,
          tags: product.tags || [],
          categoryId: product.category
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-"),
        }));

        // Extract unique categories
        const uniqueCategories = Array.from(
          new Set(products.map((p) => p.category))
        );

        // Create categories list
        const categoryList: Category[] = [
          { id: "most-popular", name: "Most Popular" },
          ...uniqueCategories.map((cat) => ({
            id: cat.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
            name: cat,
          })),
        ];

        setSnacks(transformedProducts);
        setRandomizedSnacks(
          [...transformedProducts].sort(() => Math.random() - 0.5).slice(0, 30)
        );
        setCategories(categoryList);
        setIsLoading(false);
      } catch (error) {
        console.error("Error loading data:", error);
        setIsLoading(false);
      }
    };

    fetchData();
  }, [office]); // Re-run only when office changes

  const handleVote = async (snackId: string, direction: "up" | "down") => {
    if (!user) {
      alert("Please login to vote");
      return;
    }

    if (!user.id) {
      console.error("User ID missing");
      return;
    }

    if (!isVotingActive) {
      alert("No active voting period");
      return;
    }

    // Prevent negative votes
    const currentSnack = snacks.find((s) => s.id === snackId);
    if (direction === "down" && (currentSnack?.votes ?? 0) <= 0) {
      return;
    }

    // Optimistic Update
    addToBalance(-1);

    setSnacks((prevSnacks) =>
      prevSnacks.map((snack) =>
        snack.id === snackId
          ? {
              ...snack,
              votes: (snack.votes ?? 0) + (direction === "up" ? 1 : -1),
            }
          : snack
      )
    );

    // Update randomized snacks too
    setRandomizedSnacks((prev) =>
      prev.map((snack) =>
        snack.id === snackId
          ? {
              ...snack,
              votes: (snack.votes ?? 0) + (direction === "up" ? 1 : -1),
            }
          : snack
      )
    );

    // Debounce Logic
    const currentPending = pendingVotesRef.current[snackId] || {
      voteChange: 0,
      cost: 0,
      timer: setTimeout(() => {}, 0), // Dummy timer
    };

    // Clear existing timer
    clearTimeout(currentPending.timer);

    // Update pending values
    const newVoteChange =
      currentPending.voteChange + (direction === "up" ? 1 : -1);
    const newCost = currentPending.cost + 1;

    // Set new timer
    const newTimer = setTimeout(async () => {
      try {
        // Remove from pending immediately to avoid race conditions
        delete pendingVotesRef.current[snackId];

        await voteForProductBatch(
          user.id!,
          snackId,
          office,
          newVoteChange,
          newCost
        );

        // After successful vote, tip the snack czar if tipping is enabled
        const officeData = await getOffice(office);
        if (officeData?.czar && officeData?.tippingEnabled && newCost > 0) {
          await tipSnackCzar(user.id!, officeData.czar, newCost);
        }
      } catch (error: any) {
        console.error("Error casting batch vote:", error);

        // Revert optimistic update if batch fails
        // Note: This is a simplified revert. Ideally we'd track the exact state before the batch started.
        // But since user might have continued clicking, we just revert the *amount* of this batch.

        setSnacks((prevSnacks) =>
          prevSnacks.map((s) =>
            s.id === snackId
              ? { ...s, votes: (s.votes ?? 0) - newVoteChange }
              : s
          )
        );
        setRandomizedSnacks((prevSnacks) =>
          prevSnacks.map((s) =>
            s.id === snackId
              ? { ...s, votes: (s.votes ?? 0) - newVoteChange }
              : s
          )
        );

        // Revert balance
        addToBalance(newCost);

        alert(
          `Failed to save votes. Please refresh. Error: ${
            error.message || "Unknown"
          }`
        );
      }
    }, 1200); // 2 seconds debounce

    pendingVotesRef.current[snackId] = {
      voteChange: newVoteChange,
      cost: newCost,
      timer: newTimer,
    };
  };

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId);
    setAppliedSearch("");
    setSearchQuery("");
  };

  const handleLogoClick = () => {
    setSelectedCategory("most-popular");
    setAppliedSearch("");
    setSearchQuery("");
  };

  const handleSearchInput = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  const handleSearch = useCallback(() => {
    setAppliedSearch(searchQuery);
  }, [searchQuery]);

  // Scroll page to top when search or category changes
  useEffect(() => {
    // Use setTimeout to ensure DOM has updated before scrolling
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }, 0);
  }, [appliedSearch, selectedCategory]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const randomizedSnacksForFilter = useMemo(() => {
    return randomizedSnacks;
  }, [randomizedSnacks]);

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
    } else if (selectedCategory === "most-popular") {
      return randomizedSnacksForFilter;
    } else {
      return snacks.filter((snack) => snack.categoryId === selectedCategory);
    }
  }, [appliedSearch, selectedCategory, randomizedSnacksForFilter, snacks]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box
        className="app-container"
        sx={{
          display: "flex",
          flexDirection: "column",
          minHeight: "100vh",
          backgroundColor: "#fef5e4",
        }}
      >
        <Header
          votingDeadline={votingDeadline}
          searchQuery={searchQuery}
          onSearchChange={handleSearchInput}
          onSearch={handleSearch}
          onLogoClick={handleLogoClick}
          office={office}
          onOfficeChange={setOffice}
          language={language}
          onLanguageChange={setLanguage}
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
              "&::-webkit-scrollbar": {
                width: "5px",
              },
              "&::-webkit-scrollbar-track": {
                background: "transparent",
              },
              "&::-webkit-scrollbar-thumb": {
                background: "rgba(0, 0, 0, 0.2)",
                borderRadius: "3px",
                "&:hover": {
                  background: "rgba(0, 0, 0, 0.4)",
                },
              },
            }}
          >
            <Categories
              categories={categories}
              selectedCategory={selectedCategory}
              onSelectCategory={handleCategorySelect}
            />
          </Box>

          {/* Main Content - Products Grid */}
          <Box
            sx={{
              flex: 1,
              width: "100%",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <Box sx={{ flex: 1, overflow: "auto" }}>
              <SnacksGrid
                snacks={filteredSnacks}
                onVote={handleVote}
                isLoading={isLoading}
              />
            </Box>
            <Footer />
          </Box>
        </Box>
      </Box>
    </ThemeProvider>
  );
}

export default App;
