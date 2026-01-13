import { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Alert,
  CircularProgress,
} from "@mui/material";
import { useAuth } from "../contexts/AuthContext";
import { disableBannerAd } from "../services/firestore";

interface ReportAdModalProps {
  open: boolean;
  onClose: () => void;
  adId: string;
}

export const ReportAdModal = ({ open, onClose, adId }: ReportAdModalProps) => {
  const { user, refreshUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const totalBalance = (user?.balance || 0) + (user?.bonusCoins || 0);
  const cost = 75;

  const handleReport = async () => {
    if (!user || !user.id) return;

    setLoading(true);
    setError("");

    try {
      await disableBannerAd(adId, user.id);
      await refreshUser(); // Update balance in UI
      onClose();
    } catch (err: any) {
      console.error("Error reporting ad:", err);
      setError(
        err.message === "Insufficient funds"
          ? "Not enough coins to perform this action."
          : "Failed to report ad. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Report & Hide Ad</DialogTitle>
      <DialogContent>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
          <Typography>
            Is this ad inappropriate or annoying? You can temporarily hide it
            for everyone.
          </Typography>

          <Alert severity="warning">
            This action costs <strong>{cost} PG Coins</strong> and will hide
            this ad for <strong>48 hours</strong>.
          </Alert>

          <Box
            sx={{
              bgcolor: "background.default",
              p: 2,
              borderRadius: 1,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              border: "1px solid",
              borderColor: "divider",
            }}
          >
            <Typography variant="body2" color="text.secondary">
              Available Balance:
            </Typography>
            <Box sx={{ textAlign: "right" }}>
              <Typography
                variant="h6"
                fontWeight="bold"
                color={totalBalance < cost ? "error.main" : "text.primary"}
                lineHeight={1}
              >
                {Math.floor(user?.balance || 0).toLocaleString()} PG
              </Typography>
              {(user?.bonusCoins ?? 0) > 0 && (
                <Typography
                  variant="caption"
                  color="secondary"
                  fontWeight={600}
                  display="block"
                  sx={{ mt: 0.5 }}
                >
                  +{Math.floor(user?.bonusCoins || 0).toLocaleString()} bonus
                </Typography>
              )}
            </Box>
          </Box>

          {error && <Alert severity="error">{error}</Alert>}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={handleReport}
          variant="contained"
          color="error"
          disabled={loading || totalBalance < cost}
          startIcon={
            loading ? <CircularProgress size={20} color="inherit" /> : null
          }
        >
          Pay {cost} PG & Hide
        </Button>
      </DialogActions>
    </Dialog>
  );
};
