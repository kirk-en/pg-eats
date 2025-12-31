import {
  Card,
  CardMedia,
  CardContent,
  Typography,
  Box,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  List,
  ListItem,
  ListItemAvatar,
  Avatar,
  ListItemText,
  CircularProgress,
} from "@mui/material";
import ThumbUpIcon from "@mui/icons-material/ThumbUp";
import ThumbDownIcon from "@mui/icons-material/ThumbDown";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import CloseIcon from "@mui/icons-material/Close";
import { useState, useRef, useEffect } from "react";
import pgCoinImg from "../assets/pg-coin.webp";
import { getTopVoters, getUser } from "../services/firestore";
import type { User } from "../types/firestore";

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
          return new Promise<Blob | null>((res) => {
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
  const [topUpvoterUser, setTopUpvoterUser] = useState<User | null>(null);
  const [topDownvoterUser, setTopDownvoterUser] = useState<User | null>(null);
  const coinIdRef = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const [votersModalOpen, setVotersModalOpen] = useState(false);
  const [votersDetails, setVotersDetails] = useState<
    { user: User; votes: number }[]
  >([]);
  const [loadingVoters, setLoadingVoters] = useState(false);

  useEffect(() => {
    if (votersModalOpen && userVotes) {
      setLoadingVoters(true);
      const fetchVoters = async () => {
        const details: { user: User; votes: number }[] = [];
        const voterIds = Object.keys(userVotes);

        try {
          const userPromises = voterIds.map((id) => getUser(id));
          const users = await Promise.all(userPromises);

          users.forEach((user, index) => {
            if (user) {
              details.push({
                user,
                votes: userVotes[voterIds[index]],
              });
            }
          });

          // Sort by vote count descending
          details.sort((a, b) => b.votes - a.votes);
          setVotersDetails(details);
        } catch (error) {
          console.error("Error fetching voters:", error);
        } finally {
          setLoadingVoters(false);
        }
      };

      fetchVoters();
    }
  }, [votersModalOpen, userVotes]);

  const topVoters = getTopVoters(userVotes);

  // Fetch top voter user data
  useEffect(() => {
    if (topVoters.topVoterId?.id) {
      getUser(topVoters.topVoterId.id).then((user) => {
        setTopUpvoterUser(user);
      });
    } else {
      setTopUpvoterUser(null);
    }
  }, [topVoters.topVoterId?.id]);

  // Fetch top downvoter user data
  useEffect(() => {
    if (topVoters.topDownvoterId?.id) {
      getUser(topVoters.topDownvoterId.id).then((user) => {
        setTopDownvoterUser(user);
      });
    } else {
      setTopDownvoterUser(null);
    }
  }, [topVoters.topDownvoterId?.id]);

  // Start preloading the coin image on mount
  useEffect(() => {
    initImagePreload();
  }, []);

  const handleVoteWithCoin = (
    e: React.MouseEvent<HTMLButtonElement>,
    direction: "up" | "down"
  ) => {
    // Prevent focus which triggers scroll-into-view
    e.currentTarget.blur();

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
        "&:focus": {
          outline: "none",
        },
        "&:focus-visible": {
          outline: "none",
        },
      }}
    >
      <Box sx={{ position: "absolute", top: 8, right: 8, zIndex: 10 }}>
        <IconButton
          size="small"
          onClick={(e) => {
            e.stopPropagation();
            setVotersModalOpen(true);
          }}
          sx={{
            backgroundColor: "rgba(255,255,255,0.8)",
            "&:hover": { backgroundColor: "rgba(255,255,255,0.9)" },
            boxShadow: 1,
          }}
        >
          <InfoOutlinedIcon fontSize="small" />
        </IconButton>
      </Box>
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
      <CardContent
        sx={{
          padding: "0 1rem 1rem",
          minHeight: "6.5rem",
          display: "flex",
          flexDirection: "column",
        }}
      >
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
            flex: 1,
            minHeight: "2.6rem",
          }}
        >
          {name}
        </Typography>
        {price !== undefined && (
          <Typography
            variant="body1"
            sx={{ fontWeight: 300, color: "#1a3a52", marginBottom: "0.5rem" }}
          >
            ${typeof price === "number" ? price.toFixed(2) : price}
          </Typography>
        )}
        {votes !== undefined && (
          <Typography variant="caption" sx={{ color: "#666666" }}>
            {votes} votes
          </Typography>
        )}
      </CardContent>
      <Box sx={{ padding: "0 1rem 2rem", display: "flex", gap: "0.5rem" }}>
        <Box sx={{ flex: 1 }}>
          <button
            className="upvote-btn"
            onClick={(e) => handleVoteWithCoin(e, "up")}
            style={{ cursor: "pointer", width: "100%" }}
          >
            <ThumbUpIcon sx={{ fontSize: "1rem" }} />
            Up
          </button>
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
        </Box>
      </Box>

      {/* Top voters section - always present for consistent card height */}
      <Box sx={{ padding: "0 1rem 1rem", minHeight: "2.5rem" }}>
        {(topUpvoterUser || topDownvoterUser) && (
          <>
            <Typography
              variant="caption"
              sx={{
                display: "block",
                color: "#000000",
                fontSize: "0.7rem",
                marginBottom: "0.5rem",
                textAlign: "center",
                fontWeight: 600,
              }}
            >
              Top backers:
            </Typography>
            {topUpvoterUser && (
              <Typography
                variant="caption"
                sx={{
                  display: "block",
                  color: "#4caf50",
                  fontSize: "0.75rem",
                  marginBottom: "0.5rem",
                  textAlign: "center",
                  fontWeight: 500,
                }}
              >
                🟢 {topUpvoterUser.displayName} (+{topVoters.topVoterId?.votes})
              </Typography>
            )}
            {topDownvoterUser && (
              <Typography
                variant="caption"
                sx={{
                  display: "block",
                  color: "#f44336",
                  fontSize: "0.75rem",
                  textAlign: "center",
                  fontWeight: 500,
                }}
              >
                🔻 {topDownvoterUser.displayName} (
                {topVoters.topDownvoterId?.votes})
              </Typography>
            )}
          </>
        )}
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

      <Dialog
        open={votersModalOpen}
        onClose={(e) => {
          e.stopPropagation();
          setVotersModalOpen(false);
        }}
        onClick={(e) => e.stopPropagation()}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            paddingRight: 1,
          }}
        >
          Voters for {name}
          <IconButton onClick={() => setVotersModalOpen(false)} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {loadingVoters ? (
            <Box sx={{ display: "flex", justifyContent: "center", p: 2 }}>
              <CircularProgress size={24} />
            </Box>
          ) : votersDetails.length === 0 ? (
            <Typography variant="body2" color="text.secondary" align="center">
              No votes yet.
            </Typography>
          ) : (
            <List dense>
              {votersDetails.map(({ user, votes }) => (
                <ListItem key={user.id}>
                  <ListItemAvatar>
                    <Avatar src={user.photoURL} alt={user.displayName}>
                      {user.displayName.charAt(0)}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={user.displayName}
                    secondary={user.email}
                  />
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: "bold",
                      color: votes > 0 ? "success.main" : "error.main",
                    }}
                  >
                    {votes > 0 ? "+" : ""}
                    {votes}
                  </Typography>
                </ListItem>
              ))}
            </List>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}
