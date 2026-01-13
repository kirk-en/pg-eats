import { useState, useRef, useEffect } from "react";
import { ThumbUpAlt, ThumbDownAlt, Rocket, Star } from "@mui/icons-material";
import type { BannerAd } from "../types/firestore";
import { useAuth } from "../contexts/AuthContext";
import { ReportAdModal } from "./ReportAdModal";
import pgCoinImg from "../assets/pg-coin.webp";
import "../styles/banner-ads.css";
import "../styles/buttons.css";

interface FloatingCoin {
  id: number;
  x: number;
  y: number;
}

const styleIconMap: Record<string, React.ReactNode> = {
  astro: <Rocket sx={{ fontSize: "2rem", opacity: 0.8 }} />,
  y2k: <Star sx={{ fontSize: "2rem", opacity: 0.8 }} />,
  robot: <Rocket sx={{ fontSize: "2rem", opacity: 0.8 }} />,
  royal: <Star sx={{ fontSize: "2rem", opacity: 0.8 }} />,
};

// GIF mapping: variants that have corresponding GIFs
const gifMapping: Record<
  string,
  {
    file: string;
    type: "background" | "sticker";
    position?: string;
  }
> = {
  y2k: { file: "y2k.gif", type: "background" },
  alpine: { file: "alpine.gif", type: "background" },
  antique: { file: "antique.gif", type: "background" },
  astro: { file: "astro.gif", type: "background" },
  balloon: { file: "baloon.gif", type: "background" },
  bamboo: { file: "bamboo.gif", type: "background" },
  cabana: { file: "cabana.gif", type: "background" },
  "cherry-blossom": { file: "cherry blossom.gif", type: "background" },
  classic: { file: "cgstars.gif", type: "background" },
  cute: { file: "cute.gif", type: "background" },
  dreamy: { file: "dreamy.gif", type: "background" },
  elegant: { file: "elegant.gif", type: "background" },
  flowers: { file: "flowers.gif", type: "background" },
  fruits: { file: "fruits.gif", type: "background" },
  harvest: { file: "fountain.gif", type: "background" },
  ibm: { file: "ibm.gif", type: "background" },
  irc: { file: "irc.gif", type: "background" },
  iron: { file: "iron.gif", type: "background" },
  mermaid: { file: "mermaid.gif", type: "background" },
  nordic: { file: "nordic.gif", type: "background" },
  rainbow: { file: "rainbow.gif", type: "background" },
  robot: { file: "robot.gif", type: "background" },
  royal: { file: "royal.gif", type: "background" },
  sleek: { file: "sleek.gif", type: "background" },
  throwback: { file: "throwback.gif", type: "background" },
  vintage: { file: "vintage.gif", type: "background" },
  "wood-cabin": { file: "clouds.gif", type: "background" },
  pirate: { file: "world.gif", type: "background" },
};

interface BannerAdCardProps {
  ad: BannerAd;
  office: "nyc" | "denver";
  onVote?: (productId: string, direction: "up" | "down") => void;
  onVoteSuccess?: () => void;
}

export const BannerAdCard = ({ ad, onVote }: BannerAdCardProps) => {
  const { user } = useAuth();
  const [floatingCoins, setFloatingCoins] = useState<FloatingCoin[]>([]);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const coinIdRef = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Preload coin image on mount
  useEffect(() => {
    const img = new Image();
    img.src = pgCoinImg;
  }, []);

  const handleVoteWithCoin = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!user || !user.id) return;

    const button = e.currentTarget;
    button.blur();

    // No need to manually update balance here as onVote prop (handleVote in App.tsx)
    // now handles the optimistic update correctly with bonus coin priority

    const direction = ad.voteDirection === "upvote" ? "up" : "down";

    // Call the onVote callback if provided (for debounced voting)
    if (onVote) {
      onVote(ad.productId, direction);
    }

    // Capture button rect for coin animation
    const containerRect = containerRef.current?.getBoundingClientRect();
    const buttonRect = button.getBoundingClientRect();

    if (containerRect && buttonRect) {
      const variance = (Math.random() - 0.5) * buttonRect.width * 0.6;
      const coinId = coinIdRef.current++;
      const newCoin: FloatingCoin = {
        id: coinId,
        x:
          buttonRect.left -
          containerRect.left +
          buttonRect.width / 2 +
          variance,
        y: buttonRect.top - containerRect.top + buttonRect.height / 2,
      };

      setFloatingCoins((prev) => [...prev, newCoin]);

      // Remove coin after animation completes
      setTimeout(() => {
        setFloatingCoins((prev) => prev.filter((coin) => coin.id !== coinId));
      }, 1000);
    }
  };

  const variantClass = `featured-variant-${ad.styleVariant}`;
  const candyStripeVariants = ["cute", "flowers", "balloon"];
  const wrapperClass = candyStripeVariants.includes(ad.styleVariant)
    ? `${ad.styleVariant}-style`
    : "";

  const gifConfig = gifMapping[ad.styleVariant];
  const gifUrl = gifConfig ? `/ads/${gifConfig.file}` : null;

  return (
    <div
      ref={containerRef}
      className={`featured-wrapper ${wrapperClass}`}
      style={{ position: "relative" }}
    >
      <div className={`featured-container ${variantClass}`}>
        <div className="featured-overlay" />

        {/* Background GIF */}
        {gifUrl && gifConfig.type === "background" && (
          <div
            className="featured-gif-bg"
            style={{ backgroundImage: `url(${gifUrl})` }}
          />
        )}

        <div className="featured-content">
          <img
            src={ad.productImageUrl}
            alt={ad.productName}
            className="featured-product-image"
          />
          <div className="featured-text-section">
            {" "}
            {styleIconMap[ad.styleVariant] && (
              <div className="featured-icon">
                {styleIconMap[ad.styleVariant]}
              </div>
            )}{" "}
            <div className="featured-text">{ad.customText}</div>
            <div className="featured-vote-button-container">
              <div className="featured-product-name">
                {ad.productName.slice(0, 32)}
              </div>
              {ad.voteDirection === "upvote" ? (
                <button
                  className="upvote-btn"
                  onClick={handleVoteWithCoin}
                  title="Vote up"
                  style={{ cursor: "pointer", width: "100%" }}
                >
                  <ThumbUpAlt sx={{ fontSize: "1rem" }} />
                  Up
                </button>
              ) : (
                <button
                  className="downvote-btn"
                  onClick={handleVoteWithCoin}
                  title="Vote down"
                  style={{ cursor: "pointer", width: "100%" }}
                >
                  <ThumbDownAlt sx={{ fontSize: "1rem" }} />
                  Down
                </button>
              )}
            </div>
          </div>

          {/* Sticker GIF */}
          {gifUrl && gifConfig.type === "sticker" && (
            <img
              src={gifUrl}
              alt=""
              className={`featured-gif-sticker featured-gif-sticker-${
                gifConfig.position || "top-right"
              }`}
            />
          )}
        </div>
      </div>
      <div
        className="featured-attribution"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span>Paid for by {ad.displayName}</span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setReportModalOpen(true);
          }}
          style={{
            background: "none",
            border: "none",
            padding: 0,
            font: "inherit",
            cursor: "pointer",
            textDecoration: "underline",
            color: "inherit",
          }}
        >
          Report
        </button>
      </div>

      <ReportAdModal
        open={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        adId={ad.id}
      />

      {/* Floating coins */}
      {floatingCoins.map((coin) => (
        <div
          key={coin.id}
          style={{
            position: "absolute",
            left: `${coin.x}px`,
            top: `${coin.y}px`,
            pointerEvents: "none",
            animation: "float-up 1s ease-out forwards",
            zIndex: 999,
          }}
        >
          <img
            src={pgCoinImg}
            alt="coin"
            style={{
              width: "24px",
              height: "24px",
              transform: "translate(-50%, -50%)",
            }}
          />
        </div>
      ))}
    </div>
  );
};
