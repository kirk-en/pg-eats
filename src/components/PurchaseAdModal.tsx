import { useState, useMemo, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Alert,
  CircularProgress,
  Autocomplete,
  Typography,
  Paper,
  FormControlLabel,
  RadioGroup,
  Radio,
  Tooltip,
} from "@mui/material";
import InfoIcon from "@mui/icons-material/Info";
import ThumbUpIcon from "@mui/icons-material/ThumbUp";
import ThumbDownIcon from "@mui/icons-material/ThumbDown";
import { createBannerAd } from "../services/firestore";
import { useAuth } from "../contexts/AuthContext";
import { BannerAdCard } from "./BannerAdCard";
import type { BannerAd } from "../types/firestore";
import { Timestamp } from "firebase/firestore";

interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  imageUrl: string;
  tags?: string[];
}

interface PurchaseAdModalProps {
  open: boolean;
  onClose: () => void;
  products: Product[];
  onSuccess?: () => void;
}

const STYLE_VARIANTS = [
  "y2k",
  "ibm",
  "alpine",
  "antique",
  "astro",
  "balloon",
  "bamboo",
  "cabana",
  "wood-cabin",
  "cherry-blossom",
  "classic",
  "rainbow",
  "cute",
  "dreamy",
  "elegant",
  "flowers",
  "fruits",
  "harvest",
  "iron",
  "mermaid",
  "nordic",
  "pirate",
  "royal",
  "robot",
  "sleek",
  "irc",
  "throwback",
  "vintage",
];

export function PurchaseAdModal({
  open,
  onClose,
  products,
  onSuccess,
}: PurchaseAdModalProps) {
  const { user, spendCoins, refreshUser } = useAuth();
  const { t } = useTranslation();
  const [customText, setCustomText] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedStyle, setSelectedStyle] = useState(STYLE_VARIANTS[0]);
  const [voteDirection, setVoteDirection] = useState<"upvote" | "downvote">(
    "upvote"
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Preload all GIFs when modal opens
  useEffect(() => {
    if (!open) return;

    const gifFiles = [
      "alpine.gif",
      "antique.gif",
      "astro.gif",
      "baloon.gif",
      "bamboo.gif",
      "cabana.gif",
      "cgstars.gif",
      "cherry blossom.gif",
      "clouds.gif",
      "cute.gif",
      "dreamy.gif",
      "elegant.gif",
      "flowers.gif",
      "fountain.gif",
      "fruits.gif",
      "ibm.gif",
      "irc.gif",
      "iron.gif",
      "mermaid.gif",
      "nordic.gif",
      "rainbow.gif",
      "robot.gif",
      "royal.gif",
      "sleek.gif",
      "stars.gif",
      "throwback.gif",
      "vintage.gif",
      "world.gif",
    ];

    // Preload images
    gifFiles.forEach((file) => {
      const img = new Image();
      img.src = `/ads/${file}`;
    });
  }, [open]);

  // Filter products based on search query
  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return products;

    const query = searchQuery.toLowerCase();
    return products.filter(
      (product) =>
        product.name.toLowerCase().includes(query) ||
        product.category.toLowerCase().includes(query) ||
        product.tags?.some((tag) => tag.toLowerCase().includes(query))
    );
  }, [products, searchQuery]);

  const textCharCount = customText.length;
  const textCharLimit = 30;
  const isTextValid =
    customText.trim().length > 0 && textCharCount <= textCharLimit;
  const canSubmit =
    isTextValid &&
    selectedProduct &&
    user &&
    !loading &&
    (user.balance ?? 0) >= 50;

  // Create a preview ad object for the style selector
  const previewAd: BannerAd | null =
    selectedProduct && user
      ? {
          id: "preview",
          createdBy: user.id || "",
          productId: selectedProduct.id,
          productName: selectedProduct.name,
          productImageUrl: selectedProduct.imageUrl,
          displayName: user.name || "You",
          styleVariant: selectedStyle,
          customText: customText || "Your ad text here",
          voteDirection: voteDirection,
          createdAt: Timestamp.now(),
          expiresAt: Timestamp.now(),
          isActive: true,
        }
      : null;

  const handlePurchase = async () => {
    if (!user || !selectedProduct || !isTextValid || !user.id) return;

    setLoading(true);
    setError("");

    // Optimistic update
    spendCoins(50);

    try {
      await createBannerAd({
        createdBy: user.id,
        productId: selectedProduct.id,
        productName: selectedProduct.name,
        productImageUrl: selectedProduct.imageUrl,
        displayName: user.name || "Anonymous",
        styleVariant: selectedStyle,
        customText: customText.trim(),
        voteDirection: voteDirection,
        office: "nyc",
      });

      // Reset form
      setCustomText("");
      setSelectedProduct(null);
      setSelectedStyle(STYLE_VARIANTS[0]);
      setVoteDirection("upvote");
      setSearchQuery("");
      onSuccess?.();
      onClose();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to purchase ad";
      setError(errorMessage);

      // Refresh user data to revert optimistic update correctly
      // (Restores correct bonus/regular coin balance)
      await refreshUser();

      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setCustomText("");
      setSelectedProduct(null);
      setSelectedStyle(STYLE_VARIANTS[0]);
      setVoteDirection("upvote");
      setSearchQuery("");
      setError("");
      onClose();
    }
  };

  const balance = user?.balance ?? 0;
  const displayBalance = Math.floor(balance);
  const canAfford = balance >= 50;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>{t("purchaseAdModal.title")}</DialogTitle>
      <DialogContent
        dividers
        sx={{ display: "flex", flexDirection: "column", gap: 2 }}
      >
        {/* Balance and cost info */}
        <Box
          sx={{
            p: 1.5,
            bgcolor: canAfford ? "success.light" : "error.light",
            borderRadius: 1,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
              {t("purchaseAdModal.yourBalance")}: {displayBalance}{" "}
              {t("purchaseAdModal.pgCoins")}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t("purchaseAdModal.cost")}: 50 {t("purchaseAdModal.pgCoins")} (
              {t("purchaseAdModal.costDescription")})
            </Typography>
          </Box>
          {!canAfford && (
            <Typography
              variant="body2"
              color="error.dark"
              sx={{ fontWeight: 600 }}
            >
              {t("purchaseAdModal.insufficientBalance")}
            </Typography>
          )}
        </Box>

        {error && (
          <Alert severity="error" onClose={() => setError("")}>
            {error}
          </Alert>
        )}

        {/* Product Selection */}
        <Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
            {t("purchaseAdModal.selectProduct")}
          </Typography>
          <Autocomplete
            options={filteredProducts}
            getOptionLabel={(option) => `${option.name} - ${option.category}`}
            value={selectedProduct}
            onChange={(_, newValue) => setSelectedProduct(newValue)}
            inputValue={searchQuery}
            onInputChange={(_, newInputValue) => setSearchQuery(newInputValue)}
            renderInput={(params) => (
              <TextField
                {...params}
                placeholder={t("purchaseAdModal.searchPlaceholder")}
                variant="outlined"
              />
            )}
            isOptionEqualToValue={(option, value) => option.id === value.id}
            noOptionsText={t("purchaseAdModal.noProductsFound")}
          />
        </Box>

        {/* Custom Text Input */}
        <Box>
          <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              {t("purchaseAdModal.adText")}
            </Typography>
            <Typography
              variant="body2"
              color={textCharCount > textCharLimit ? "error" : "text.secondary"}
            >
              {textCharCount} / {textCharLimit}
            </Typography>
          </Box>
          <TextField
            fullWidth
            multiline
            rows={2}
            value={customText}
            onChange={(e) =>
              setCustomText(e.target.value.slice(0, textCharLimit))
            }
            placeholder={t("purchaseAdModal.adTextPlaceholder")}
            error={textCharCount > textCharLimit}
            helperText={
              textCharCount > textCharLimit
                ? t("purchaseAdModal.textExceedsLimit")
                : t("purchaseAdModal.adTextHelper")
            }
            variant="outlined"
          />
        </Box>

        {/* Vote Direction */}
        <Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
            {t("purchaseAdModal.voteDirection")}
          </Typography>
          <RadioGroup
            row
            value={voteDirection}
            onChange={(e) =>
              setVoteDirection(e.target.value as "upvote" | "downvote")
            }
          >
            <FormControlLabel
              value="upvote"
              control={<Radio />}
              label={
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                  <ThumbUpIcon fontSize="small" color="success" />
                  {t("purchaseAdModal.upvote")}
                </Box>
              }
            />
            <FormControlLabel
              value="downvote"
              control={<Radio />}
              label={
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                  <ThumbDownIcon fontSize="small" color="error" />
                  {t("purchaseAdModal.downvote")}
                </Box>
              }
            />
          </RadioGroup>
        </Box>

        {/* Style Selection Grid */}
        <Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              {t("purchaseAdModal.chooseStyle")}
            </Typography>
            <Tooltip title={t("purchaseAdModal.styleTooltip")}>
              <InfoIcon fontSize="small" />
            </Tooltip>
          </Box>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "repeat(2, 1fr)",
                sm: "repeat(3, 1fr)",
                md: "repeat(4, 1fr)",
              },
              gap: 1,
            }}
          >
            {STYLE_VARIANTS.map((style) => (
              <Paper
                key={style}
                onClick={() => setSelectedStyle(style)}
                sx={{
                  p: 1,
                  textAlign: "center",
                  cursor: "pointer",
                  border:
                    selectedStyle === style
                      ? "3px solid #FB4F14"
                      : "1px solid #e0e0e0",
                  borderRadius: 1,
                  transition: "all 0.2s",
                  "&:hover": {
                    boxShadow: 2,
                    borderColor: "#FB4F14",
                  },
                  bgcolor:
                    selectedStyle === style
                      ? "action.selected"
                      : "background.paper",
                }}
              >
                <Typography
                  variant="caption"
                  sx={{
                    fontWeight: selectedStyle === style ? 600 : 400,
                    textTransform: "capitalize",
                  }}
                >
                  {style.replace(/-/g, " ")}
                </Typography>
              </Paper>
            ))}
          </Box>
        </Box>

        {/* Preview */}
        {previewAd && (
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
              {t("purchaseAdModal.preview")}
            </Typography>
            <BannerAdCard ad={previewAd} office="nyc" />
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Button onClick={handleClose} disabled={loading}>
          {t("purchaseAdModal.cancel")}
        </Button>
        <Button
          onClick={handlePurchase}
          variant="contained"
          disabled={!canSubmit}
          sx={{
            bgcolor: "#FB4F14",
            "&:hover": { bgcolor: "#DA4412" },
          }}
        >
          {loading ? (
            <>
              <CircularProgress size={24} sx={{ mr: 1 }} />
              {t("purchaseAdModal.purchasing")}
            </>
          ) : (
            t("purchaseAdModal.purchaseButton")
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
