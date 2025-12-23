import {
  Card,
  CardMedia,
  CardContent,
  Typography,
  Box,
  CircularProgress,
} from "@mui/material";
import ThumbUpIcon from "@mui/icons-material/ThumbUp";
import ThumbDownIcon from "@mui/icons-material/ThumbDown";
import { useState, useRef, useEffect } from "react";
import pgCoinImg from "../assets/pg-coin.webp";
import { getTopVoters } from "../services/firestore";

// Aggressive image preloading with multiple strategies
const preloadImage = (src: string): Promise<void> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = () => resolve(); // Resolve even on error to not block
    img.src = src;
  });
};

// Fetch with retries for aggressive loading
const fetchImageWithRetries = (
  src: string,
  maxRetries = 3
): Promise<Blob | null> => {
  const attempt = (retriesLeft: number): Promise<Blob | null> => {
    return fetch(src)
      .then((response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.blob();
      })
      .catch((error) => {
        if (retriesLeft > 0) {
          console.warn(
            `Coin image fetch failed, retrying... (${retriesLeft} left)`,
            error
          );
          return new Promise((res) => {
            setTimeout(() => {
              attempt(retriesLeft - 1).then(res);
            }, 300);
          });
        }
        console.warn("Failed to preload coin image after retries", error);
        return null;
      });
  };
  return attempt(maxRetries);
};

// Cache blob in IndexedDB for persistence across sessions
const cacheImageBlob = (blobData: Blob): Promise<void> => {
  return new Promise((resolve) => {
    const request = indexedDB.open("pgEatsCache", 1);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains("images")) {
        db.createObjectStore("images");
      }
    };

    request.onsuccess = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      const transaction = db.transaction(["images"], "readwrite");
      const store = transaction.objectStore("images");
      store.put(blobData, "pg-coin");
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => resolve();
      db.close();
    };

    request.onerror = () => resolve();
  });
};

// Retrieve cached image from IndexedDB
const getCachedImageBlob = (): Promise<Blob | null> => {
  return new Promise((resolve) => {
    const request = indexedDB.open("pgEatsCache", 1);

    request.onsuccess = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      const transaction = db.transaction(["images"], "readonly");
      const store = transaction.objectStore("images");
      const getRequest = store.get("pg-coin");

      getRequest.onsuccess = () => {
        resolve(getRequest.result || null);
      };
      getRequest.onerror = () => resolve(null);

      transaction.oncomplete = () => db.close();
    };

    request.onerror = () => resolve(null);
  });
};

// Multi-strategy preload: try cache first, then fetch with retries, then regular preload
let pgCoinLoadPromise: Promise<void> | null = null;
const initImagePreload = async () => {
  if (pgCoinLoadPromise) return pgCoinLoadPromise;

  pgCoinLoadPromise = (async () => {
    try {
      // Try to get from IndexedDB cache first
      const cachedBlob = await getCachedImageBlob();
      if (cachedBlob) {
        const blobUrl = URL.createObjectURL(cachedBlob);
        // Pre-create an image to verify it loads
        await preloadImage(blobUrl);
        return;
      }
    } catch (error) {
      console.warn("IndexedDB cache retrieval failed", error);
    }

    try {
      // Fetch with retries and cache the result
      const blob = await fetchImageWithRetries(pgCoinImg);
      if (blob) {
        await cacheImageBlob(blob);
        const blobUrl = URL.createObjectURL(blob);
        await preloadImage(blobUrl);
        return;
      }
    } catch (error) {
      console.warn("Fetch-based preload failed", error);
    }

    // Fallback: regular preload
    await preloadImage(pgCoinImg);
  })();

  return pgCoinLoadPromise;
};

interface SnackCardProps {
  id: string;
  name: string;
  image: string;
  price?: number;
  votes?: number;
  onVote?: (id: string, direction: "up" | "down") => void;
  userVotes?: Record<string, number>;
}

interface FloatingCoin {
  id: number;
  x: number;
  y: number;
}

export function SnackCard({
  id,
  name,
  image,
  price,
  votes,
  onVote,
  userVotes = {},
}: SnackCardProps) {
  const [floatingCoins, setFloatingCoins] = useState<FloatingCoin[]>([]);
  const coinIdRef = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const topVoters = getTopVoters(userVotes);

  // Start preloading the coin image on mount
  useEffect(() => {
    initImagePreload();
  }, []);

  const handleVoteWithCoin = (
    e: React.MouseEvent<HTMLButtonElement>,
    direction: "up" | "down"
  ) => {
    // Don't show animation if downvoting at 0 votes
    const shouldShowAnimation = !(direction === "down" && (votes ?? 0) === 0);

    onVote?.(id, direction);

    // Create floating coin animation
    if (shouldShowAnimation && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const buttonRect = e.currentTarget.getBoundingClientRect();

      // Add variance to the x position along the button width
      const variance = (Math.random() - 0.5) * buttonRect.width * 0.6;
      const coinId = coinIdRef.current++;
      const newCoin: FloatingCoin = {
        id: coinId,
        x: buttonRect.left - rect.left + buttonRect.width / 2 + variance,
        y: buttonRect.top - rect.top + buttonRect.height / 2,
      };

      setFloatingCoins((prev) => [...prev, newCoin]);

      // Remove coin after animation completes
      setTimeout(() => {
        setFloatingCoins((prev) => prev.filter((coin) => coin.id !== coinId));
      }, 1000);
    }
  };

  return (
    <Card
      ref={containerRef}
      className="snack-card"
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        position: "relative",
        overflow: "visible",
        cursor: "default",
      }}
    >
      <CardMedia
        component="img"
        image={image}
        alt={name}
        sx={{
          height: 140,
          objectFit: "contain",
          borderRadius: "6px",
          margin: "1rem",
          marginBottom: "0.75rem",
          backgroundColor: "white",
        }}
      />
      <CardContent sx={{ flex: 1, padding: "0 1rem 1rem" }}>
        <Typography
          variant="subtitle2"
          sx={{
            fontWeight: 600,
            color: "#333333",
            lineHeight: 1.3,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            marginBottom: "0.5rem",
          }}
        >
          {name}
        </Typography>
        {price !== undefined && (
          <Typography
            variant="body1"
            sx={{ fontWeight: 700, color: "#1a3a52", marginBottom: "0.5rem" }}
          >
            {price}
          </Typography>
        )}
        {votes !== undefined && (
          <Typography
            variant="caption"
            sx={{ color: "#666666", marginBottom: "0.75rem" }}
          >
            {votes} votes
          </Typography>
        )}
      </CardContent>
      <Box sx={{ padding: "0 1rem 1rem", display: "flex", gap: "0.5rem" }}>
        <Box sx={{ flex: 1 }}>
          <button
            className="upvote-btn"
            onClick={(e) => handleVoteWithCoin(e, "up")}
            style={{ cursor: "pointer", width: "100%" }}
          >
            <ThumbUpIcon sx={{ fontSize: "1rem" }} />
            Up
          </button>
          {topVoters.topVoterId && (
            <Typography
              variant="caption"
              sx={{
                display: "block",
                color: "#4caf50",
                fontSize: "0.65rem",
                marginTop: "0.25rem",
                textAlign: "center",
              }}
            >
              Top: +{topVoters.topVoterId.votes}
            </Typography>
          )}
        </Box>
        <Box sx={{ flex: 1 }}>
          <button
            className="downvote-btn"
            onClick={(e) => handleVoteWithCoin(e, "down")}
            style={{ cursor: "pointer", width: "100%" }}
          >
            <ThumbDownIcon sx={{ fontSize: "1rem" }} />
            Down
          </button>
          {topVoters.topDownvoterId && (
            <Typography
              variant="caption"
              sx={{
                display: "block",
                color: "#f44336",
                fontSize: "0.65rem",
                marginTop: "0.25rem",
                textAlign: "center",
              }}
            >
              Top: {topVoters.topDownvoterId.votes}
            </Typography>
          )}
        </Box>
      </Box>

      {/* Floating coins */}
      {floatingCoins.map((coin) => (
        <Box
          key={coin.id}
          sx={{
            position: "absolute",
            left: `${coin.x}px`,
            top: `${coin.y}px`,
            pointerEvents: "none",
            animation: "float-up 1s ease-out forwards",
            "@keyframes float-up": {
              "0%": {
                opacity: 1,
                transform: "translate(-50%, -50%) scale(1)",
              },
              "100%": {
                opacity: 0,
                transform: "translate(-50%, -150px) scale(0.8)",
              },
            },
          }}
        >
          <img
            src={pgCoinImg}
            alt="pg-coin"
            style={{
              width: "24px",
              height: "24px",
              display: "block",
            }}
          />
        </Box>
      ))}
    </Card>
  );
}
