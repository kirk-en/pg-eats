import {
  Box,
  Typography,
  InputBase,
  CircularProgress,
  Tooltip,
  Switch,
  ButtonGroup,
  Button,
  IconButton,
  Avatar,
  Menu,
  MenuItem,
  AppBar,
  Toolbar,
  useTheme,
  useMediaQuery,
  Drawer,
  Stack,
  Divider,
  Paper,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import MenuIcon from "@mui/icons-material/Menu";
import CloseIcon from "@mui/icons-material/Close";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import logoEn from "../assets/pgeats-logo-2.png";
import logoEs from "../assets/pgeats-logo-2-es.png";
import { useAuth } from "../contexts/AuthContext";
import { useI18n } from "../contexts/I18nContext";
import { useTranslation } from "react-i18next";
import { useState } from "react";
import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";
import { CzarPanel } from "./CzarPanel";
import { AddProductModal } from "./AddProductModal";
import { PurchaseAdModal } from "./PurchaseAdModal";

export interface Category {
  id: string;
  name: string;
}

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";

function LoginBox() {
  const { login } = useAuth();
  const { t } = useTranslation();

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 1,
          padding: "0.25rem 1rem",
          backgroundColor: "#f8fafb",
          borderRadius: "8px",
          border: "1px solid #e0e4e8",
        }}
      >
        <Typography
          variant="caption"
          sx={{
            fontSize: "0.75rem",
            fontWeight: 600,
            color: "#666666",
            textAlign: "center",
          }}
        >
          {t("auth.loginDescription")}
        </Typography>
        <GoogleLogin
          onSuccess={(credentialResponse) => {
            if (credentialResponse.credential) {
              login(credentialResponse.credential);
            }
          }}
          onError={() => {
            console.error("Login Failed");
            alert("Login failed. Please try again.");
          }}
          size="medium"
          text="signin_with"
          shape="rectangular"
        />
      </Box>
    </GoogleOAuthProvider>
  );
}

interface OfficeSelectorProps {
  office?: "nyc" | "denver";
  onOfficeChange?: (office: "nyc" | "denver") => void;
}

const OfficeSelector = ({ office, onOfficeChange }: OfficeSelectorProps) => {
  const { t } = useTranslation();

  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
      <Typography
        variant="caption"
        sx={{
          fontWeight: 700,
          color: "text.secondary",
          textTransform: "uppercase",
          minWidth: 50,
        }}
      >
        {t("czarPanel.office")}
      </Typography>
      <Stack direction="row" spacing={1} alignItems="center">
        <Typography
          variant="body2"
          sx={{
            color: office === "nyc" ? "#1E90FF" : "text.disabled",
            fontWeight: 600,
          }}
        >
          🗽NYC
        </Typography>
        <Switch
          checked={office === "denver"}
          onChange={(e) =>
            onOfficeChange?.(e.target.checked ? "denver" : "nyc")
          }
          size="small"
          sx={{
            "& .MuiSwitch-switchBase.Mui-checked": { color: "#FB4F14" },
            "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
              backgroundColor: "#FB4F14",
            },
            "& .MuiSwitch-track": {
              backgroundColor: office === "nyc" ? "#1E90FF" : undefined,
            },
          }}
        />
        <Typography
          variant="body2"
          sx={{
            color: office === "denver" ? "#FB4F14" : "text.disabled",
            fontWeight: 600,
          }}
        >
          🏔️DEN
        </Typography>
      </Stack>
    </Box>
  );
};

interface LanguageSelectorProps {
  language?: "en" | "es";
  onLanguageChange?: (language: "en" | "es") => void;
}

const LanguageSelector = ({
  language,
  onLanguageChange,
}: LanguageSelectorProps) => {
  const { t } = useTranslation();

  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
      <Typography
        variant="caption"
        sx={{
          fontWeight: 700,
          color: "text.secondary",
          textTransform: "uppercase",
          minWidth: 50,
        }}
      >
        {t("header.lang")}
      </Typography>
      <ButtonGroup size="small" variant="outlined">
        <Button
          onClick={() => onLanguageChange?.("en")}
          variant={language === "en" ? "contained" : "outlined"}
          sx={{ px: 2 }}
        >
          En
        </Button>
        <Button
          onClick={() => onLanguageChange?.("es")}
          variant={language === "es" ? "contained" : "outlined"}
          sx={{ px: 2 }}
        >
          Es
        </Button>
      </ButtonGroup>
    </Box>
  );
};

interface DeadlineDisplayProps {
  votingDeadline?: string;
}

const DeadlineDisplay = ({ votingDeadline }: DeadlineDisplayProps) => {
  const { t } = useTranslation();

  return (
    <Tooltip title={t("header.deadlineTooltip")} arrow={true}>
      <Paper
        elevation={0}
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          px: 2,
          py: 0.75,
          bgcolor: "primary.main",
          color: "primary.contrastText",
          borderRadius: 2,
          cursor: "help",
          transition: "transform 0.2s",
          minWidth: 140,
          "&:hover": { transform: "translateY(-2px)" },
        }}
      >
        <CalendarTodayIcon fontSize="small" />
        <Box>
          <Typography
            variant="caption"
            sx={{ display: "block", opacity: 0.9, lineHeight: 1 }}
          >
            {t("header.nextDrop")}
          </Typography>
          <Typography variant="subtitle2" fontWeight={700} lineHeight={1.2}>
            {votingDeadline || t("header.tbd")}
          </Typography>
        </Box>
      </Paper>
    </Tooltip>
  );
};

interface HeaderProps {
  votingDeadline?: string;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  onSearch?: () => void;
  onLogoClick?: () => void;
  office?: "nyc" | "denver";
  onOfficeChange?: (office: "nyc" | "denver") => void;
  language?: "en" | "es";
  isSearching?: boolean;
  categories?: Category[];
  snacks?: Array<{ name: string; category?: string; tags?: string[] }>;
  products?: Array<{
    id: string;
    name: string;
    category: string;
    price: number;
    imageUrl: string;
    tags?: string[];
  }>;
  onOpenTutorial?: () => void;
}

export function Header({
  votingDeadline,
  searchQuery,
  onSearchChange,
  onSearch,
  onLogoClick,
  office,
  onOfficeChange,
  language,
  isSearching,
  categories = [],
  snacks = [],
  products = [],
  onOpenTutorial,
}: HeaderProps) {
  const { user, logout, isLoadingBalance } = useAuth();
  const { setLanguage } = useI18n();
  const { t } = useTranslation();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [czarPanelOpen, setCzarPanelOpen] = useState(false);
  const [addProductModalOpen, setAddProductModalOpen] = useState(false);
  const [purchaseAdModalOpen, setPurchaseAdModalOpen] = useState(false);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      onSearch?.();
    }
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    handleMenuClose();
  };

  const handleLanguageChange = (lang: "en" | "es") => {
    setLanguage(lang);
  };

  const toggleMobileDrawer = (newOpen: boolean) => () => {
    setMobileOpen(newOpen);
  };

  // Select logo based on language
  const currentLogo = language === "es" ? logoEs : logoEn;

  return (
    <AppBar
      position="sticky"
      color="inherit"
      elevation={1}
      sx={{ bgcolor: "#ffffff", zIndex: 1100 }}
    >
      <Toolbar sx={{ gap: 2, py: 1, justifyContent: "space-between" }}>
        {/* Logo */}
        <Box
          onClick={onLogoClick}
          sx={{
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            flexShrink: 0,
            transition: "opacity 0.2s",
            "&:hover": { opacity: 0.8 },
          }}
        >
          <img
            src={currentLogo}
            alt="Playground Eats"
            style={{ height: "28px", width: "auto" }}
          />
        </Box>

        {/* Search Bar */}
        <Paper
          component="form"
          elevation={0}
          sx={{
            p: "2px 4px",
            display: "flex",
            alignItems: "center",
            width: "100%",
            maxWidth: 600,
            bgcolor: "#f5f7fa",
            border: "1px solid #e1e8f0",
            borderRadius: 2,
            transition: "all 0.2s",
            "&:focus-within": {
              bgcolor: "#fff",
              borderColor: "primary.main",
              boxShadow: "0 0 0 3px rgba(63, 98, 247, 0.1)",
            },
          }}
        >
          <IconButton sx={{ p: "10px" }} aria-label="search" onClick={onSearch}>
            <SearchIcon />
          </IconButton>
          <InputBase
            sx={{ ml: 1, flex: 1 }}
            placeholder={t("header.searchPlaceholder")}
            value={searchQuery || ""}
            onChange={(e) => onSearchChange?.(e.target.value)}
            onKeyPress={handleKeyPress}
          />
          {isSearching && <CircularProgress size={20} sx={{ mr: 1.5 }} />}
        </Paper>

        {/* Desktop Actions */}
        {!isMobile && (
          <Stack direction="row" spacing={3} alignItems="center">
            <DeadlineDisplay votingDeadline={votingDeadline} />
            <Divider
              orientation="vertical"
              flexItem
              sx={{ my: "auto", height: 24 }}
            />
            <Stack spacing={1}>
              <OfficeSelector office={office} onOfficeChange={onOfficeChange} />
              <LanguageSelector
                language={language}
                onLanguageChange={handleLanguageChange}
              />
            </Stack>

            {user ? (
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <Box sx={{ textAlign: "right" }}>
                  <Typography
                    variant="caption"
                    color="primary"
                    fontWeight={700}
                    display="block"
                  >
                    {t("header.balance").toUpperCase()}
                  </Typography>
                  {isLoadingBalance ? (
                    <CircularProgress size={16} />
                  ) : (
                    <>
                      <Tooltip
                        title="Your PG coin balance. Use coins to vote on which snacks get ordered for the office. Same coins as playgroundbets.com!"
                        arrow={true}
                      >
                        <Typography
                          variant="h6"
                          color="primary"
                          fontWeight={700}
                          lineHeight={1}
                          sx={{ whiteSpace: "nowrap", cursor: "help" }}
                        >
                          {user.balance !== undefined
                            ? Math.floor(user.balance).toLocaleString()
                            : "—"}{" "}
                          pg
                        </Typography>
                      </Tooltip>
                      {(user.bonusCoins ?? 0) > 0 && (
                        <Tooltip
                          title="Bonus coins exclusive to PG Eats. Spent before regular coins."
                          arrow={true}
                        >
                          <Typography
                            variant="caption"
                            color="secondary"
                            fontWeight={600}
                            lineHeight={1}
                            sx={{
                              whiteSpace: "nowrap",
                              cursor: "help",
                              display: "block",
                              marginTop: "4px",
                            }}
                          >
                            +{Math.floor(user.bonusCoins || 0).toLocaleString()}{" "}
                            bonus
                          </Typography>
                        </Tooltip>
                      )}
                    </>
                  )}
                </Box>
                <IconButton onClick={handleMenuOpen} sx={{ p: 0 }}>
                  <Avatar
                    src={user.picture || ""}
                    alt={user.name}
                    sx={{
                      border: "2px solid #e5e7eb",
                      backgroundColor: "#1E90FF",
                      width: 40,
                      height: 40,
                    }}
                  >
                    {!user.picture && user.name?.charAt(0).toUpperCase()}
                  </Avatar>
                </IconButton>
              </Box>
            ) : (
              <LoginBox />
            )}
          </Stack>
        )}

        {/* Mobile Menu Button */}
        {isMobile && (
          <IconButton onClick={toggleMobileDrawer(true)}>
            <MenuIcon />
          </IconButton>
        )}
      </Toolbar>

      {/* Mobile Drawer */}
      <Drawer
        anchor="right"
        open={mobileOpen}
        onClose={toggleMobileDrawer(false)}
      >
        <Box sx={{ width: 280, p: 2 }} role="presentation">
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 3,
            }}
          >
            <Typography variant="h6" fontWeight={700}>
              {t("common.close")}
            </Typography>
            <IconButton onClick={toggleMobileDrawer(false)}>
              <CloseIcon />
            </IconButton>
          </Box>

          <Stack spacing={3}>
            {user ? (
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 2,
                  p: 2,
                  bgcolor: "grey.50",
                  borderRadius: 2,
                }}
              >
                <Avatar
                  src={user.picture || ""}
                  alt={user.name}
                  sx={{
                    width: 48,
                    height: 48,
                    backgroundColor: "#1E90FF",
                  }}
                >
                  {!user.picture && user.name?.charAt(0).toUpperCase()}
                </Avatar>
                <Box>
                  <Typography variant="subtitle1" fontWeight={600}>
                    {user.name}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 0.5 }}
                  >
                    {t("header.balance")}:{" "}
                    {user.balance !== undefined
                      ? Math.floor(user.balance).toLocaleString()
                      : "—"}{" "}
                    pg
                  </Typography>
                  <Button size="small" color="error" onClick={handleLogout}>
                    {t("header.logout")}
                  </Button>
                </Box>
              </Box>
            ) : (
              <Box sx={{ display: "flex", justifyContent: "center" }}>
                <LoginBox />
              </Box>
            )}

            <Divider />

            <Box>
              <Typography variant="overline" color="text.secondary">
                {t("header.settings")}
              </Typography>
              <Stack spacing={2} sx={{ mt: 1 }}>
                <OfficeSelector
                  office={office}
                  onOfficeChange={onOfficeChange}
                />
                <LanguageSelector
                  language={language}
                  onLanguageChange={handleLanguageChange}
                />
              </Stack>
            </Box>

            <Divider />

            <Box>
              <Typography variant="overline" color="text.secondary">
                {t("header.information")}
              </Typography>
              <Box sx={{ mt: 1 }}>
                <DeadlineDisplay votingDeadline={votingDeadline} />
              </Box>
            </Box>
          </Stack>
        </Box>
      </Drawer>

      {/* User Menu (Desktop) */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        transformOrigin={{ horizontal: "right", vertical: "top" }}
        anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
        PaperProps={{
          elevation: 3,
          sx: { mt: 1.5, borderRadius: 2, minWidth: 180 },
        }}
      >
        <MenuItem disabled>
          <Box>
            <Typography variant="subtitle2" fontWeight={600}>
              {user?.name}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {user?.email}
            </Typography>
          </Box>
        </MenuItem>
        <Divider />
        <MenuItem
          onClick={() => {
            setAddProductModalOpen(true);
            handleMenuClose();
          }}
        >
          ➕ {t("header.addNewSnack")}
        </MenuItem>
        <MenuItem
          onClick={() => {
            setPurchaseAdModalOpen(true);
            handleMenuClose();
          }}
        >
          📢 {t("header.purchaseAd")}
        </MenuItem>
        <MenuItem
          onClick={() => {
            onOpenTutorial?.();
            handleMenuClose();
          }}
        >
          ❓ {"Help"}
        </MenuItem>
        {user?.isAdmin && (
          <MenuItem
            onClick={() => {
              setCzarPanelOpen(true);
              handleMenuClose();
            }}
          >
            👑 {t("header.czarPanel")}
          </MenuItem>
        )}
        {user?.isAdmin && <Divider />}
        <MenuItem onClick={handleLogout}>{t("header.logout")}</MenuItem>
      </Menu>

      <AddProductModal
        open={addProductModalOpen}
        onClose={() => setAddProductModalOpen(false)}
        categories={categories}
        userId={user?.id || ""}
        existingProducts={snacks.map((s) => ({
          name: s.name,
          category: s.category || "",
          tags: s.tags || [],
        }))}
      />

      <PurchaseAdModal
        open={purchaseAdModalOpen}
        onClose={() => setPurchaseAdModalOpen(false)}
        products={products}
      />

      <CzarPanel
        open={czarPanelOpen}
        onClose={() => setCzarPanelOpen(false)}
        office={office}
      />
    </AppBar>
  );
}
