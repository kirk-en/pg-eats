import { Card, CardMedia, CardContent, Typography, Box } from "@mui/material";
import ThumbUpIcon from "@mui/icons-material/ThumbUp";
import ThumbDownIcon from "@mui/icons-material/ThumbDown";
import { useState, useRef, useEffect } from "react";
import pgCoinImg from "../assets/pg-coin.webp";

// Preload the pg-coin image on module load
const preloadImage = (src: string): Promise<void> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = () => resolve(); // Resolve even on error to not block
    img.src = src;
  });
};

// Start preloading immediately
const pgCoinLoadPromise = preloadImage(pgCoinImg);

interface SnackCardProps {
  id: string;
  name: string;
  image: string;
  price?: number;
  votes?: number;
  onVote?: (id: string, direction: "up" | "down") => void;
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
}: SnackCardProps) {
  const [floatingCoins, setFloatingCoins] = useState<FloatingCoin[]>([]);
  const [coinImageReady, setCoinImageReady] = useState(false);
  const coinIdRef = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Ensure pg-coin image is loaded before allowing animations
  useEffect(() => {
    pgCoinLoadPromise.then(() => {
      setCoinImageReady(true);
    });
  }, []);

  const handleVoteWithCoin = (
    e: React.MouseEvent<HTMLButtonElement>,
    direction: "up" | "down"
  ) => {
    // Don't show animation if downvoting at 0 votes
    const shouldShowAnimation = !(direction === "down" && (votes ?? 0) === 0);

    onVote?.(id, direction);

    // Create floating coin animation only if the coin image is ready
    if (shouldShowAnimation && coinImageReady && containerRef.current) {
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
        <button
          className="upvote-btn"
          onClick={(e) => handleVoteWithCoin(e, "up")}
        >
          <ThumbUpIcon sx={{ fontSize: "1rem" }} />
          Up
        </button>
        <button
          className="downvote-btn"
          onClick={(e) => handleVoteWithCoin(e, "down")}
        >
          <ThumbDownIcon sx={{ fontSize: "1rem" }} />
          Down
        </button>
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
