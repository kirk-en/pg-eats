import { useState, useMemo } from "react";
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
  Chip,
  Typography,
  Card,
  CardMedia,
  CardContent,
  Tooltip,
  IconButton,
} from "@mui/material";
import InfoIcon from "@mui/icons-material/Info";
import ThumbUpIcon from "@mui/icons-material/ThumbUp";
import ThumbDownIcon from "@mui/icons-material/ThumbDown";
import { addProduct } from "../services/firestore";
import "../styles/buttons.css";

interface Category {
  id: string;
  name: string;
}

interface AddProductModalProps {
  open: boolean;
  onClose: () => void;
  categories: Category[];
  userId: string;
  existingProducts: Array<{ name: string; category: string; tags: string[] }>;
}

interface FormData {
  name: string;
  category: Category | null;
  price: string;
  imageUrl: string;
  tags: string[];
}

interface ValidationErrors {
  name?: string;
  category?: string;
  price?: string;
  imageUrl?: string;
}

export function AddProductModal({
  open,
  onClose,
  categories,
  userId,
  existingProducts,
}: AddProductModalProps) {
  const [formData, setFormData] = useState<FormData>({
    name: "",
    category: null,
    price: "",
    imageUrl: "",
    tags: [],
  });

  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageLoadError, setImageLoadError] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>(
    {}
  );
  const [submitError, setSubmitError] = useState("");
  const [loading, setLoading] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const [confirmDuplicates, setConfirmDuplicates] = useState(false);
  const [similarProducts, setSimilarProducts] = useState<
    typeof existingProducts
  >([]);

  // Detect similar products
  const detectSimilarProducts = useMemo(() => {
    if (!formData.name.trim()) return [];

    const searchName = formData.name.toLowerCase();
    return existingProducts.filter((product) => {
      const productName = product.name.toLowerCase();
      // Check for substring match in either direction or tag overlap
      const nameMatch =
        productName.includes(searchName) || searchName.includes(productName);
      const tagOverlap = formData.tags.some((tag) =>
        product.tags.some((t) => t.toLowerCase() === tag.toLowerCase())
      );
      return nameMatch || tagOverlap;
    });
  }, [formData.name, formData.tags, existingProducts]);

  const handleImageUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    setFormData((prev) => ({ ...prev, imageUrl: url }));
    setImageLoaded(false);
    setImageLoadError(false);
    setValidationErrors((prev) => ({ ...prev, imageUrl: undefined }));
  };

  const handleImageLoad = () => {
    setImageLoaded(true);
    setImageLoadError(false);
  };

  const handleImageError = () => {
    setImageLoaded(false);
    setImageLoadError(true);
    setValidationErrors((prev) => ({
      ...prev,
      imageUrl: "Image could not be loaded. Check the URL.",
    }));
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()],
      }));
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag !== tagToRemove),
    }));
  };

  const validateForm = (): boolean => {
    const errors: ValidationErrors = {};

    if (!formData.name.trim()) {
      errors.name = "Product name is required";
    }

    if (!formData.category) {
      errors.category = "Category is required";
    }

    if (!formData.price.trim()) {
      errors.price = "Price is required";
    } else if (isNaN(parseFloat(formData.price))) {
      errors.price = "Price must be a valid number";
    }

    if (!formData.imageUrl.trim()) {
      errors.imageUrl = "Image URL is required";
    } else if (!imageLoaded) {
      errors.imageUrl = "Please wait for image to load or provide a valid URL";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    // Check for duplicates
    if (detectSimilarProducts.length > 0 && !confirmDuplicates) {
      setSimilarProducts(detectSimilarProducts);
      setConfirmDuplicates(true);
      return;
    }

    setLoading(true);
    setSubmitError("");

    try {
      const price = parseFloat(formData.price);
      // Remove emoji prefix from category name
      let categoryName = formData.category?.name || "";
      categoryName =
        categoryName.startsWith("🥇") || categoryName.startsWith("⚡")
          ? categoryName.substring(3).trim()
          : categoryName.trim();

      await addProduct({
        name: formData.name.trim(),
        category: categoryName,
        price,
        imageUrl: formData.imageUrl.trim(),
        tags: formData.tags,
        addedBy: userId,
      });

      // Success - reset and close
      setFormData({
        name: "",
        category: null,
        price: "",
        imageUrl: "",
        tags: [],
      });
      setConfirmDuplicates(false);
      setSimilarProducts([]);
      onClose();
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to add product. Please try again.";
      setSubmitError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (confirmDuplicates) {
      setConfirmDuplicates(false);
      setSimilarProducts([]);
    } else {
      setFormData({
        name: "",
        category: null,
        price: "",
        imageUrl: "",
        tags: [],
      });
      setValidationErrors({});
      setSubmitError("");
      setImageLoaded(false);
      setImageLoadError(false);
      onClose();
    }
  };

  // Filter out special categories
  const selectableCategories = categories.filter(
    (cat) => !["most-popular", "most-recently-voted"].includes(cat.id)
  );

  if (confirmDuplicates) {
    return (
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>Similar Products Found</DialogTitle>
        <DialogContent dividers>
          <Alert severity="warning" sx={{ mb: 2 }}>
            We found similar products already in the catalog. Are you sure this
            is a unique item?
          </Alert>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            {similarProducts.map((product, idx) => (
              <Box
                key={idx}
                sx={{
                  p: 1.5,
                  bgcolor: "grey.100",
                  borderRadius: 1,
                  borderLeft: "4px solid #FB4F14",
                }}
              >
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                  {product.name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Category: {product.category}
                </Typography>
                {product.tags.length > 0 && (
                  <Box sx={{ mt: 0.5 }}>
                    {product.tags.map((tag, i) => (
                      <Chip
                        key={i}
                        label={tag}
                        size="small"
                        variant="outlined"
                        sx={{ mr: 0.5, mb: 0.5 }}
                      />
                    ))}
                  </Box>
                )}
              </Box>
            ))}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" disabled={loading}>
            {loading ? <CircularProgress size={24} /> : "Yes, Add Anyway"}
          </Button>
        </DialogActions>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>Add New Product</DialogTitle>
      <DialogContent dividers sx={{ display: "flex", gap: 3 }}>
        {/* Form Section */}
        <Box sx={{ flex: 1, display: "flex", flexDirection: "column", gap: 2 }}>
          {submitError && (
            <Alert severity="error" onClose={() => setSubmitError("")}>
              {submitError}
            </Alert>
          )}

          <Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                Product Name
              </Typography>
              <Tooltip title="Be as specific as possible! Include brand name, flavor, size, or variety (e.g., 'Califia Farms Almond Milk - Original 48oz' or 'Lay's Classic Potato Chips')">
                <InfoIcon fontSize="small" sx={{ color: "text.secondary" }} />
              </Tooltip>
            </Box>
            <TextField
              fullWidth
              value={formData.name}
              onChange={(e) => {
                setFormData((prev) => ({ ...prev, name: e.target.value }));
                setValidationErrors((prev) => ({ ...prev, name: undefined }));
              }}
              error={!!validationErrors.name}
              helperText={validationErrors.name}
              placeholder="e.g., Califia Farms Almond Milk - Original 48oz"
            />
          </Box>

          <Autocomplete
            options={selectableCategories}
            getOptionLabel={(option) => {
              const name = option.name;
              return name.startsWith("🥇") || name.startsWith("⚡")
                ? name.substring(3).trim()
                : name.trim();
            }}
            value={formData.category}
            onChange={(_, value) => {
              setFormData((prev) => ({ ...prev, category: value }));
              setValidationErrors((prev) => ({
                ...prev,
                category: undefined,
              }));
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Category"
                error={!!validationErrors.category}
                helperText={validationErrors.category}
              />
            )}
          />

          <Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <TextField
                label="Price"
                type="number"
                inputProps={{ step: "0.01", min: "0" }}
                value={formData.price}
                onChange={(e) => {
                  setFormData((prev) => ({ ...prev, price: e.target.value }));
                  setValidationErrors((prev) => ({ ...prev, price: undefined }));
                }}
                error={!!validationErrors.price}
                helperText={validationErrors.price}
                placeholder="0.00"
                sx={{ flex: 1 }}
                InputProps={{
                  startAdornment: (
                    <Typography sx={{ mr: 1, fontWeight: 600 }}>$</Typography>
                  ),
                }}
              />
            </Box>
          </Box>

          <Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
              <TextField
                label="Image URL"
                fullWidth
                value={formData.imageUrl}
                onChange={handleImageUrlChange}
                error={!!validationErrors.imageUrl}
                helperText={validationErrors.imageUrl}
                placeholder="https://example.com/image.jpg"
              />
              <Tooltip title="Right-click any image on the web and select 'Copy image link' to get the URL">
                <IconButton size="small">
                  <InfoIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
            {formData.imageUrl && (
              <Typography variant="caption" color="text.secondary">
                {imageLoadError
                  ? "Failed to load image"
                  : imageLoaded
                  ? "✓ Image loaded"
                  : "Loading image..."}
              </Typography>
            )}
          </Box>

          <Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
              <Typography variant="subtitle2">Tags (Optional)</Typography>
              <Tooltip title="Add descriptive keywords like 'organic', 'gluten-free', 'seasonal', etc. These help with searching and categorizing products.">
                <InfoIcon fontSize="small" sx={{ color: "text.secondary" }} />
              </Tooltip>
            </Box>
            <Box sx={{ display: "flex", gap: 1 }}>
              <TextField
                placeholder="Add a tag..."
                size="small"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
                sx={{ flex: 1 }}
              />
              <Button
                onClick={handleAddTag}
                variant="outlined"
                size="small"
                disabled={!tagInput.trim()}
              >
                Add
              </Button>
            </Box>
            {formData.tags.length > 0 && (
              <Box sx={{ display: "flex", gap: 0.5, mt: 1, flexWrap: "wrap" }}>
                {formData.tags.map((tag) => (
                  <Chip
                    key={tag}
                    label={tag}
                    onDelete={() => handleRemoveTag(tag)}
                    size="small"
                  />
                ))}
              </Box>
            )}
          </Box>
        </Box>

        {/* Preview Section */}
        <Box
          sx={{
            flex: 0.5,
            display: "flex",
            flexDirection: "column",
            gap: 2,
            minWidth: 220,
          }}
        >
          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
            Preview
          </Typography>
          <Card
            sx={{
              width: "100%",
              display: "flex",
              flexDirection: "column",
              height: "100%",
              position: "relative",
            }}
          >
            {imageLoaded && !imageLoadError ? (
              <>
                <CardMedia
                  component="img"
                  image={formData.imageUrl}
                  alt={formData.name}
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
                    {formData.name || "Product Name"}
                  </Typography>
                  <Typography
                    variant="body1"
                    sx={{
                      fontWeight: 300,
                      color: "#1a3a52",
                      marginBottom: "0.5rem",
                    }}
                  >
                    ${parseFloat(formData.price || "0").toFixed(2)}
                  </Typography>
                  <Typography variant="caption" sx={{ color: "#666666" }}>
                    {(() => {
                      const name = formData.category?.name || "Category";
                      return name.startsWith("🥇") || name.startsWith("⚡")
                        ? name.substring(3).trim()
                        : name.trim();
                    })()}
                  </Typography>
                </CardContent>
                <Box sx={{ padding: "0 1rem 2rem", display: "flex", gap: "0.5rem", opacity: 0.65 }}>
                  <Box sx={{ flex: 1 }}>
                    <button
                      className="upvote-btn"
                      style={{
                        width: "100%",
                        pointerEvents: "none",
                      }}
                    >
                      <ThumbUpIcon sx={{ fontSize: "1rem" }} />
                      Up
                    </button>
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <button
                      className="downvote-btn"
                      style={{
                        width: "100%",
                        pointerEvents: "none",
                      }}
                    >
                      <ThumbDownIcon sx={{ fontSize: "1rem" }} />
                      Down
                    </button>
                  </Box>
                </Box>
              </>
            ) : (
              <Box
                sx={{
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  minHeight: "400px",
                  bgcolor: "#f5f5f5",
                  borderRadius: 1,
                }}
              >
                <Box sx={{ textAlign: "center" }}>
                  {imageLoadError ? (
                    <>
                      <Typography color="error" variant="body2" sx={{ mb: 1 }}>
                        ❌ Image failed to load
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Check your URL and try again
                      </Typography>
                    </>
                  ) : formData.imageUrl ? (
                    <>
                      <CircularProgress size={40} sx={{ mb: 1 }} />
                      <Typography variant="caption" color="text.secondary">
                        Loading image...
                      </Typography>
                    </>
                  ) : (
                    <Typography variant="caption" color="text.secondary">
                      Enter an image URL to see preview
                    </Typography>
                  )}
                </Box>
              </Box>
            )}
          </Card>
        </Box>

        {/* Hidden image for loading */}
        <img
          src={formData.imageUrl}
          onLoad={handleImageLoad}
          onError={handleImageError}
          style={{ display: "none" }}
          alt="preview"
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading}
          sx={{ minWidth: 120 }}
        >
          {loading ? <CircularProgress size={24} /> : "Add Product"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
