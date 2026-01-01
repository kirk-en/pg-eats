import { useState } from "react";
import { ThumbUpAlt, ThumbDownAlt, Rocket, Star } from "@mui/icons-material";
import type { BannerAd } from "../types/firestore";
import { voteForProduct } from "../services/firestore";
import { useAuth } from "../contexts/AuthContext";
import "../styles/banner-ads.css";
import "../styles/buttons.css";

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
  onVoteSuccess?: () => void;
}

export const BannerAdCard = ({
  ad,
  office,
  onVoteSuccess,
}: BannerAdCardProps) => {
  const { user } = useAuth();
  const [isVoting, setIsVoting] = useState(false);

  const handleVote = async () => {
    if (!user || isVoting || !user.id) return;

    try {
      setIsVoting(true);
      const direction = ad.voteDirection === "upvote" ? "up" : "down";
      await voteForProduct(user.id, ad.productId, office, direction);
      onVoteSuccess?.();
    } catch (error) {
      console.error("Failed to vote:", error);
    } finally {
      setIsVoting(false);
    }
  };

  const variantClass = `banner-ad-variant-${ad.styleVariant}`;
  const candyStripeVariants = ["cute", "flowers", "balloon"];
  const wrapperClass = candyStripeVariants.includes(ad.styleVariant)
    ? `${ad.styleVariant}-style`
    : "";

  const gifConfig = gifMapping[ad.styleVariant];
  const gifUrl = gifConfig
    ? new URL(`../assets/ads/${gifConfig.file}`, import.meta.url).href
    : null;

  return (
    <div className={`banner-ad-wrapper ${wrapperClass}`}>
      <div className={`banner-ad-container ${variantClass}`}>
        <div className="banner-ad-overlay" />

        {/* Background GIF */}
        {gifUrl && gifConfig.type === "background" && (
          <div
            className="banner-ad-gif-bg"
            style={{ backgroundImage: `url(${gifUrl})` }}
          />
        )}

        <div className="banner-ad-content">
          <img
            src={ad.productImageUrl}
            alt={ad.productName}
            className="banner-ad-product-image"
          />
          <div className="banner-ad-text-section">
            {" "}
            {styleIconMap[ad.styleVariant] && (
              <div className="banner-ad-icon">
                {styleIconMap[ad.styleVariant]}
              </div>
            )}{" "}
            <div className="banner-ad-text">{ad.customText}</div>
            <div className="banner-ad-vote-button-container">
              {ad.voteDirection === "upvote" ? (
                <button
                  className="upvote-btn"
                  onClick={handleVote}
                  disabled={isVoting || !user}
                  title="Vote up"
                >
                  <ThumbUpAlt sx={{ fontSize: "1rem" }} />
                  Up
                </button>
              ) : (
                <button
                  className="downvote-btn"
                  onClick={handleVote}
                  disabled={isVoting || !user}
                  title="Vote down"
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
              className={`banner-ad-gif-sticker banner-ad-gif-sticker-${
                gifConfig.position || "top-right"
              }`}
            />
          )}
        </div>
      </div>
      <div className="banner-ad-attribution">Paid for by {ad.displayName}</div>
    </div>
  );
};
