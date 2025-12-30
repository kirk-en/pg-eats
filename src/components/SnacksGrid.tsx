import { Paper, Typography, Box, CircularProgress } from "@mui/material";
import { SnackCard } from "./SnackCard";
import { useState, useLayoutEffect, useRef, useEffect } from "react";

interface Snack {
  id: string;
  name: string;
  image: string;
  imageUrl?: string;
  price?: number;
  votes?: number;
  userVotes?: Record<string, number>;
}

interface SnacksGridProps {
  snacks: Snack[];
  onVote?: (id: string, direction: "up" | "down") => void;
  isLoading?: boolean;
  selectedCategory?: string;
}

export function SnacksGrid({
  snacks,
  onVote,
  isLoading,
  selectedCategory,
}: SnacksGridProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const positionsRef = useRef<Record<string, DOMRect>>({});
  const animatingRef = useRef<Set<string>>(new Set());
  const [debouncedSnacks, setDebouncedSnacks] = useState<Snack[]>(snacks);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevCategoryRef = useRef<string | undefined>(selectedCategory);

  // Debounce snack updates by 2.25 seconds, but only for reordering (same snacks, different order)
  // Category/filter changes should be immediate
  useEffect(() => {
    // Clear existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Check if category has changed
    const categoryChanged = prevCategoryRef.current !== selectedCategory;
    prevCategoryRef.current = selectedCategory;

    if (categoryChanged) {
      // Immediate update for category changes, skip animations

      setDebouncedSnacks(snacks);
      // Reset positions on category change (no previous positions to animate from)
      positionsRef.current = {};
    } else {
      // Debounce vote-based reordering (same snacks, different order)
      debounceTimerRef.current = setTimeout(() => {
        setDebouncedSnacks(snacks);
      }, 1750);
    }

    // Cleanup
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [snacks, selectedCategory]);

  useLayoutEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const elements = container.querySelectorAll("[data-snack-id]");

    // Get current positions (LAST in FLIP)
    const currentPositions: Record<string, DOMRect> = {};
    elements.forEach((el) => {
      const snackId = (el as HTMLElement).getAttribute("data-snack-id");
      if (snackId) {
        currentPositions[snackId] = el.getBoundingClientRect();
      }
    });

    // Calculate delta between previous and current positions
    const deltas: Record<string, { x: number; y: number }> = {};

    Object.keys(currentPositions).forEach((snackId) => {
      const prev = positionsRef.current[snackId];
      const current = currentPositions[snackId];

      if (prev) {
        const deltaX = prev.left - current.left;
        const deltaY = prev.top - current.top;

        // Only animate if there's meaningful movement
        if (Math.abs(deltaX) > 1 || Math.abs(deltaY) > 1) {
          deltas[snackId] = { x: deltaX, y: deltaY };
        }
      }
    });

    // Disable scroll anchoring during animation to prevent jitter
    const html = document.documentElement;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const originalOverflowAnchor = (html.style as any).overflowAnchor;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (html.style as any).overflowAnchor = "none";

    // Apply inverted transforms and setup animations
    elements.forEach((el) => {
      const snackId = (el as HTMLElement).getAttribute("data-snack-id");
      if (snackId && deltas[snackId]) {
        const delta = deltas[snackId];
        const htmlEl = el as HTMLElement;

        // Add will-change hint for animation performance
        htmlEl.style.willChange = "translate";

        // INVERT: Apply translate to show old position
        htmlEl.style.translate = `${delta.x}px ${delta.y}px`;
        htmlEl.style.transition = "none";

        // Force layout recalculation
        void htmlEl.offsetHeight;

        // PLAY: Remove translate with transition
        htmlEl.style.transition = "translate 0.5s ease-in-out";
        htmlEl.style.translate = "0px 0px";

        animatingRef.current.add(snackId);
      }
    });

    // Restore scroll anchoring after debounce period + animation completes
    // Wait 1800ms to ensure layout is fully settled before re-enabling
    setTimeout(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (html.style as any).overflowAnchor = originalOverflowAnchor;
      // Clear will-change hints
      elements.forEach((el) => {
        const snackId = (el as HTMLElement).getAttribute("data-snack-id");
        if (snackId && animatingRef.current.has(snackId)) {
          (el as HTMLElement).style.willChange = "auto";
        }
      });
    }, 1800);

    // Store positions for next animation (but only if not a category change)
    positionsRef.current = currentPositions;

    // Cleanup animation state after transition completes
    const handleTransitionEnd = (e: Event) => {
      const el = e.target as HTMLElement;
      const snackId = el.getAttribute("data-snack-id");
      if (snackId) {
        animatingRef.current.delete(snackId);
      }
    };

    elements.forEach((el) => {
      el.addEventListener("transitionend", handleTransitionEnd);
    });

    return () => {
      elements.forEach((el) => {
        el.removeEventListener("transitionend", handleTransitionEnd);
      });
      // Ensure overflow-anchor is restored on cleanup
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (html.style as any).overflowAnchor = originalOverflowAnchor;
    };
  }, [debouncedSnacks, selectedCategory]); // Run whenever debounced snacks array changes

  if (isLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", padding: "3rem" }}>
        <CircularProgress />
      </Box>
    );
  }

  if (snacks.length === 0) {
    return (
      <Paper
        component="section"
        className="snacks-grid"
        sx={{
          borderRadius: 1,
          padding: "3rem 2rem",
          textAlign: "center",
          color: "#999999",
          fontSize: "1.1rem",
          border: "2px dashed #e0e4e8",
        }}
      >
        <Typography>No snacks found in this category</Typography>
      </Paper>
    );
  }

  return (
    <Box
      ref={containerRef}
      component="section"
      className="snacks-grid"
      sx={{
        width: "100%",
      }}
    >
      {debouncedSnacks.map((snack) => {
        // Find the current snack data with updated vote counts
        const currentSnack = snacks.find((s) => s.id === snack.id) || snack;
        return (
          <Box
            key={snack.id}
            data-snack-id={snack.id}
            sx={{
              "@media (max-width: 480px)": {},
            }}
          >
            <SnackCard
              {...currentSnack}
              image={currentSnack.imageUrl || currentSnack.image}
              onVote={onVote}
            />
          </Box>
        );
      })}
    </Box>
  );
}
