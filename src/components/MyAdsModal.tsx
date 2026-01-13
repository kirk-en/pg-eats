import { useEffect, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  CircularProgress,
  IconButton,
  Paper,
  Stack,
  Chip,
  Divider,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import VisibilityIcon from "@mui/icons-material/Visibility";
import ReportIcon from "@mui/icons-material/Report";
import { useAuth } from "../contexts/AuthContext";
import { getUserBannerAds } from "../services/firestore";
import type { BannerAd } from "../types/firestore";
import { BannerAdCard } from "./BannerAdCard";

interface MyAdsModalProps {
  open: boolean;
  onClose: () => void;
}

export const MyAdsModal = ({ open, onClose }: MyAdsModalProps) => {
  const { user } = useAuth();
  const [ads, setAds] = useState<BannerAd[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchAds = async () => {
      if (open && user?.id) {
        setLoading(true);
        try {
          const userAds = await getUserBannerAds(user.id);
          setAds(userAds);
        } catch (error) {
          console.error("Error fetching ads:", error);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchAds();
  }, [open, user?.id]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        My Ads
        <IconButton onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
            <CircularProgress />
          </Box>
        ) : ads.length === 0 ? (
          <Box sx={{ textAlign: "center", p: 4, color: "text.secondary" }}>
            <Typography>No ads found.</Typography>
          </Box>
        ) : (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            {ads.map((ad) => {
              const isDisabled =
                ad.disabledUntil && ad.disabledUntil.toMillis() > Date.now();

              return (
                <Paper
                  key={ad.id}
                  elevation={0}
                  variant="outlined"
                  sx={{
                    borderRadius: 3,
                    borderColor: isDisabled ? "error.main" : "divider",
                    borderWidth: isDisabled ? 2 : 1,
                    overflow: "hidden",
                  }}
                >
                  <Box
                    sx={{
                      bgcolor: "action.hover",
                      p: 3,
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      borderBottom: "1px solid",
                      borderColor: "divider",
                    }}
                  >
                    <BannerAdCard ad={ad} office="nyc" />
                  </Box>

                  {isDisabled && (
                    <Box
                      sx={{
                        bgcolor: "error.light",
                        p: 1.5,
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                        borderBottom: "1px solid",
                        borderColor: "divider",
                      }}
                    >
                      <ReportIcon sx={{ color: "error.dark", fontSize: 20 }} />
                      <Typography
                        variant="body2"
                        fontWeight={600}
                        sx={{
                          animation: "flash 1s infinite",
                          "@keyframes flash": {
                            "0%, 100%": { color: "black" },
                            "50%": { color: "white" },
                          },
                        }}
                      >
                        Disabled by report until{" "}
                        {ad.disabledUntil!.toDate().toLocaleString(undefined, {
                          month: "short",
                          day: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </Typography>
                    </Box>
                  )}

                  <Box
                    sx={{
                      p: 2,
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      flexWrap: "wrap",
                      gap: 2,
                    }}
                  >
                    <Stack
                      direction="row"
                      spacing={3}
                      divider={<Divider orientation="vertical" flexItem />}
                    >
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <AccessTimeIcon color="action" fontSize="small" />
                        <Box>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            display="block"
                            lineHeight={1}
                          >
                            Expires
                          </Typography>
                          <Typography variant="body2" fontWeight={500}>
                            {ad.expiresAt.toDate().toLocaleString(undefined, {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                              hour: "numeric",
                              minute: "2-digit",
                            })}
                          </Typography>
                        </Box>
                      </Box>

                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <VisibilityIcon color="action" fontSize="small" />
                        <Box>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            display="block"
                            lineHeight={1}
                          >
                            Views
                          </Typography>
                          <Typography variant="body2" fontWeight={500}>
                            {ad.viewCount || 0}
                          </Typography>
                        </Box>
                      </Box>
                    </Stack>

                    <Chip
                      label={
                        isDisabled
                          ? "Reported"
                          : ad.isActive
                          ? "Active"
                          : "Inactive"
                      }
                      color={
                        isDisabled
                          ? "error"
                          : ad.isActive
                          ? "success"
                          : "default"
                      }
                      size="small"
                    />
                  </Box>
                </Paper>
              );
            })}
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};
