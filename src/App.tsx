import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { CssBaseline, Box, ThemeProvider, createTheme } from "@mui/material";
import "./App.css";
import { Header, SnacksGrid, Footer, Categories } from "./components";
import {
  subscribeToProducts,
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
  price?: number;
  votes?: number;
  categoryId?: string;
  imageUrl?: string;
  category?: string;
  tags?: string[];
  searchText?: string;
  userVotes?: Record<string, number>;
  lastVotedAt?: Timestamp | null;
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
  const [mostPopularSnacks, setMostPopularSnacks] = useState<Snack[]>([]);
  const [mostRecentlyVotedSnacks, setMostRecentlyVotedSnacks] = useState<
    Snack[]
  >([]);
  const [office, setOfficeState] = useState<"nyc" | "denver">(() => {
    const saved = localStorage.getItem("selectedOffice");
    return (saved as "nyc" | "denver") || "nyc";
  });
  const [language, setLanguage] = useState<"en" | "es">("en");
  const [votingDeadline, setVotingDeadline] = useState<string>("");
  const [isVotingActive, setIsVotingActive] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingVotesRef = useRef<{
    [key: string]: {
      voteChange: number;
      cost: number;
      timer: ReturnType<typeof setTimeout>;
    };
  }>({});

  // Wrapper function to update office and persist to local storage
  const setOffice = (newOffice: "nyc" | "denver") => {
    setOfficeState(newOffice);
    localStorage.setItem("selectedOffice", newOffice);
  };

  useEffect(() => {
    let unsubscribe: (() => void) | null = null;

    const setupListener = async () => {
      try {
        // 1. Subscribe to Products with real-time listener
        unsubscribe = subscribeToProducts(
          (products) => {
            // Disable scroll anchoring during Firestore updates to prevent auto-scroll
            const html = document.documentElement;
            const originalOverflowAnchor = html.style.overflowAnchor;
            html.style.overflowAnchor = "none";

            // Transform products to match our Snack interface
            const transformedProducts: Snack[] = products.map((product) => ({
              id: product.id,
              name: product.name,
              image: product.imageUrl,
              imageUrl: product.imageUrl,
              price: product.price,
              votes:
                office === "nyc" ? product.votes_nyc : product.votes_denver,
              category: product.category,
              tags: product.tags || [],
              searchText: product.searchText,
              categoryId: product.category
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, "-"),
              userVotes:
                office === "nyc"
                  ? product.userVotes_nyc
                  : product.userVotes_denver,
              lastVotedAt:
                (office === "nyc"
                  ? product.lastVotedAt_nyc
                  : product.lastVotedAt_denver) || null,
            }));

            // Extract unique categories
            const uniqueCategories = Array.from(
              new Set(products.map((p) => p.category))
            );

            // Create categories list
            const categoryList: Category[] = [
              { id: "most-popular", name: "🥇 Most Popular" },
              { id: "most-recently-voted", name: "⚡ Latest Votes" },
              ...uniqueCategories.map((cat) => ({
                id: cat.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
                name: cat,
              })),
            ];

            setSnacks(transformedProducts);
            // Update most popular snacks: either initialize or update votes only
            setMostPopularSnacks((prev) => {
              if (prev.length === 0) {
                // Initial load: sort and pick top 24
                return [...transformedProducts]
                  .sort((a, b) => (b.votes ?? 0) - (a.votes ?? 0))
                  .slice(0, 24);
              } else {
                // Update: merge new vote data into existing array without reordering
                return prev.map((existingSnack) => {
                  const updated = transformedProducts.find(
                    (p) => p.id === existingSnack.id
                  );
                  return updated
                    ? {
                        ...existingSnack,
                        votes: updated.votes,
                        userVotes: updated.userVotes,
                        lastVotedAt: updated.lastVotedAt,
                      }
                    : existingSnack;
                });
              }
            });
            // Derive most recently voted snacks from transformed products
            const recentlyVotedSnacks = [...transformedProducts]
              .filter((p) => p.lastVotedAt)
              .sort((a, b) => {
                const aTime = a.lastVotedAt?.toMillis() ?? 0;
                const bTime = b.lastVotedAt?.toMillis() ?? 0;
                return bTime - aTime;
              })
              .slice(0, 24);
            setMostRecentlyVotedSnacks(recentlyVotedSnacks);
            setCategories(categoryList);
            setIsLoading(false);

            // Restore scroll anchoring after a short delay to allow layout to settle
            setTimeout(() => {
              html.style.overflowAnchor = originalOverflowAnchor;
            }, 100);
          },
          (error) => {
            console.error("Error with real-time listener:", error);
            setIsLoading(false);
          }
        );

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
      } catch (error) {
        console.error("Error loading data:", error);
        setIsLoading(false);
      }
    };

    setupListener();

    // Cleanup listener on unmount or when office changes
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [office]);

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

    // Update most popular snacks too
    setMostPopularSnacks((prev) =>
      prev.map((snack) =>
        snack.id === snackId
          ? {
              ...snack,
              votes: (snack.votes ?? 0) + (direction === "up" ? 1 : -1),
            }
          : snack
      )
    );

    // Update most recently voted snacks too
    setMostRecentlyVotedSnacks((prev) =>
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
        setMostPopularSnacks((prevSnacks) =>
          prevSnacks.map((s) =>
            s.id === snackId
              ? { ...s, votes: (s.votes ?? 0) - newVoteChange }
              : s
          )
        );
        setMostRecentlyVotedSnacks((prevSnacks) =>
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
    setIsSearching(false);
  };

  const handleSearchInput = useCallback((query: string) => {
    setSearchQuery(query);

    if (!query.trim()) {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
      setAppliedSearch("");
      setSelectedCategory("most-popular");
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }

    searchDebounceRef.current = setTimeout(() => {
      setAppliedSearch(query);
      setSelectedCategory("");
      setIsSearching(false);
    }, 500);
  }, []);

  const handleSearch = useCallback(() => {
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }
    setAppliedSearch(searchQuery);
    if (searchQuery.trim()) {
      setSelectedCategory("");
    } else {
      setSelectedCategory("most-popular");
    }
    setIsSearching(false);
  }, [searchQuery]);

  // TODO: Re-enable scroll to top after fixing animation conflicts
  // useEffect(() => {
  //   // Use setTimeout to ensure DOM has updated before scrolling
  //   setTimeout(() => {
  //     window.scrollTo({ top: 0, behavior: "smooth" });
  //   }, 0);
  // }, [appliedSearch, selectedCategory]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const mostPopularSnacksForFilter = useMemo(() => {
    // Re-sort most popular snacks by votes whenever the snacks array changes
    return [...mostPopularSnacks].sort(
      (a, b) => (b.votes ?? 0) - (a.votes ?? 0)
    );
  }, [mostPopularSnacks]);

  const mostRecentlyVotedSnacksForFilter = useMemo(() => {
    // Sort by most recent vote timestamp (descending)
    return [...mostRecentlyVotedSnacks].sort((a, b) => {
      const aTime = a.lastVotedAt?.toMillis() ?? 0;
      const bTime = b.lastVotedAt?.toMillis() ?? 0;
      return bTime - aTime;
    });
  }, [mostRecentlyVotedSnacks]);

  const filteredSnacks = useMemo(() => {
    let result;
    if (appliedSearch) {
      const searchTerms = appliedSearch
        .toLowerCase()
        .split(/\s+/)
        .filter(Boolean);

      result = snacks.filter((snack) => {
        const searchText = (snack.searchText || "").toLowerCase();
        // If searchText is missing, construct it on the fly
        const effectiveSearchText =
          searchText ||
          [snack.name, snack.category, ...(snack.tags || [])]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();

        return searchTerms.every((term) => effectiveSearchText.includes(term));
      });

      // Sort by relevance then votes
      return result.sort((a, b) => {
        const nameA = a.name.toLowerCase();
        const nameB = b.name.toLowerCase();
        const searchLower = appliedSearch.toLowerCase();

        // 1. Exact name match
        if (nameA === searchLower) return -1;
        if (nameB === searchLower) return 1;

        // 2. Starts with name match
        if (nameA.startsWith(searchLower) && !nameB.startsWith(searchLower))
          return -1;
        if (nameB.startsWith(searchLower) && !nameA.startsWith(searchLower))
          return 1;

        // 3. Contains in name vs not in name
        const aInName = nameA.includes(searchLower);
        const bInName = nameB.includes(searchLower);
        if (aInName && !bInName) return -1;
        if (bInName && !aInName) return 1;

        // 4. Fallback to votes
        const voteDiff = (b.votes ?? 0) - (a.votes ?? 0);
        if (voteDiff !== 0) return voteDiff;

        // 5. Fallback to most recent vote
        if (!a.lastVotedAt && !b.lastVotedAt) return 0;
        if (!a.lastVotedAt) return 1;
        if (!b.lastVotedAt) return -1;
        return b.lastVotedAt.toMillis() - a.lastVotedAt.toMillis();
      });
    } else if (selectedCategory === "most-popular") {
      result = mostPopularSnacksForFilter;
    } else if (selectedCategory === "most-recently-voted") {
      result = mostRecentlyVotedSnacksForFilter;
    } else {
      result = snacks.filter((snack) => snack.categoryId === selectedCategory);
    }

    // For most-recently-voted, keep the recency order without re-sorting
    if (selectedCategory === "most-recently-voted") {
      return result;
    }

    // Sort by votes (descending) then by most recent vote (descending)
    return [...result].sort((a, b) => {
      const voteDiff = (b.votes ?? 0) - (a.votes ?? 0);
      if (voteDiff !== 0) {
        return voteDiff;
      }
      // If votes are equal, sort by most recent vote
      if (!a.lastVotedAt && !b.lastVotedAt) return 0;
      if (!a.lastVotedAt) return 1;
      if (!b.lastVotedAt) return -1;
      return b.lastVotedAt.toMillis() - a.lastVotedAt.toMillis();
    });
  }, [
    appliedSearch,
    selectedCategory,
    mostPopularSnacksForFilter,
    mostRecentlyVotedSnacksForFilter,
    snacks,
  ]);

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
          scrollbarGutter: "stable",
        }}
      >
        <Header
          votingDeadline={votingDeadline}
          searchQuery={searchQuery}
          onSearchChange={handleSearchInput}
          onSearch={handleSearch}
          isSearching={isSearching}
          onLogoClick={handleLogoClick}
          office={office}
          onOfficeChange={setOffice}
          language={language}
          onLanguageChange={setLanguage}
          categories={categories}
          snacks={snacks}
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
            <Box sx={{ flex: 1 }}>
              <SnacksGrid
                snacks={filteredSnacks}
                onVote={handleVote}
                isLoading={isLoading}
                selectedCategory={selectedCategory}
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
