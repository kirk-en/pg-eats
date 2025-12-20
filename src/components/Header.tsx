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
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import logo from "../assets/pgeats-logo-2.png";
import { useAuth } from "../contexts/AuthContext";
import { useState } from "react";
import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";

function LoginBox() {
  const { login } = useAuth();

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 1,
          padding: "0.75rem 1rem",
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
          Sign in with your playground email to start voting!
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

interface HeaderProps {
  votingDeadline?: string;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  onSearch?: () => void;
  onLogoClick?: () => void;
  office?: "nyc" | "denver";
  onOfficeChange?: (office: "nyc" | "denver") => void;
  language?: "en" | "es";
  onLanguageChange?: (language: "en" | "es") => void;
  isSearching?: boolean;
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
  onLanguageChange,
  isSearching,
}: HeaderProps) {
  const { user, logout } = useAuth();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

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

  return (
    <Box
      component="header"
      className="app-header"
      sx={{
        backgroundColor: "white",
        padding: "0.75rem 1rem",
        boxShadow: 1,
        borderBottom: "1px solid #e0e4e8",
        width: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 2,
        position: "sticky",
        top: 0,
        zIndex: 100,
      }}
    >
      {/* Logo */}
      <Box
        onClick={onLogoClick}
        sx={{
          display: "flex",
          alignItems: "center",
          cursor: "pointer",
          transition: "opacity 0.2s ease",
          "&:hover": {
            opacity: 0.8,
          },
        }}
      >
        <img
          src={logo}
          alt="Playground Eats"
          style={{
            height: "50px",
            width: "auto",
          }}
        />
      </Box>

      {/* Search Bar */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          backgroundColor: "#f8fafb",
          borderRadius: 1,
          border: "1px solid #e0e4e8",
          flex: 1,
          maxWidth: "400px",
          overflow: "hidden",
          padding: "0 0.8rem",
          gap: 0.5,
        }}
      >
        <SearchIcon sx={{ color: "#999999", fontSize: "1.2rem" }} />
        <InputBase
          placeholder="Search snacks..."
          value={searchQuery || ""}
          onChange={(e) => onSearchChange?.(e.target.value)}
          onKeyPress={handleKeyPress}
          sx={{
            flex: 1,
            fontSize: "0.9rem",
            "& input": {
              padding: "0.4rem 0",
              "&::placeholder": {
                color: "#999999",
                opacity: 1,
              },
            },
          }}
        />
        <button
          onClick={onSearch}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: "0.4rem 0.6rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#3f62f7",
            fontSize: "1.2rem",
            transition: "opacity 0.2s ease",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.7")}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
        >
          {isSearching ? (
            <CircularProgress size={16} sx={{ color: "#3f62f7" }} />
          ) : (
            <SearchIcon sx={{ fontSize: "1.2rem" }} />
          )}
        </button>
      </Box>

      {/* Office and Language Controls */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 4,
        }}
      >
        {/* Office Switch with Team Colors */}
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 1,
          }}
        >
          <Typography
            variant="caption"
            sx={{
              fontSize: "0.75rem",
              fontWeight: 700,
              textTransform: "uppercase",
              color: "#666666",
            }}
          >
            Office
          </Typography>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Typography
              variant="caption"
              sx={{
                fontSize: "0.8rem",
                fontWeight: 600,
                minWidth: "40px",
                textAlign: "right",
              }}
            >
              🗽 NYC
            </Typography>
            <Switch
              checked={office === "denver"}
              onChange={(e) =>
                onOfficeChange?.(e.target.checked ? "denver" : "nyc")
              }
              size="small"
              sx={{
                "& .MuiSwitch-switchBase": {
                  color: "#003366",
                  "&.Mui-checked": {
                    color: "#FB4F14",
                  },
                  "&.Mui-checked + .MuiSwitch-track": {
                    backgroundColor: "#FB4F14",
                  },
                },
                "& .MuiSwitch-track": {
                  backgroundColor: "#003366",
                },
              }}
            />
            <Typography
              variant="caption"
              sx={{ fontSize: "0.8rem", fontWeight: 600, minWidth: "50px" }}
            >
              🏔️ Denver
            </Typography>
          </Box>
        </Box>

        {/* Language Toggle */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Typography
            variant="caption"
            sx={{
              fontSize: "0.75rem",
              fontWeight: 700,
              textTransform: "uppercase",
              color: "#666666",
            }}
          >
            Language
          </Typography>
          <ButtonGroup size="small" variant="outlined" sx={{ height: "32px" }}>
            <Button
              onClick={() => onLanguageChange?.("en")}
              variant={language === "en" ? "contained" : "outlined"}
              sx={{
                fontSize: "0.75rem",
                fontWeight: 600,
                textTransform: "uppercase",
                padding: "4px 12px",
                backgroundColor: language === "en" ? "#3f62f7" : "transparent",
                color: language === "en" ? "white" : "#999999",
                borderColor: "#e0e4e8",
                "&:hover": {
                  backgroundColor: language === "en" ? "#27ae60" : "#f8fafb",
                },
              }}
            >
              En
            </Button>
            <Button
              onClick={() => onLanguageChange?.("es")}
              variant={language === "es" ? "contained" : "outlined"}
              sx={{
                fontSize: "0.75rem",
                fontWeight: 600,
                textTransform: "uppercase",
                padding: "4px 12px",
                backgroundColor: language === "es" ? "#3f62f7" : "transparent",
                color: language === "es" ? "white" : "#999999",
                borderColor: "#e0e4e8",
                "&:hover": {
                  backgroundColor: language === "es" ? "#27ae60" : "#f8fafb",
                },
              }}
            >
              Es
            </Button>
          </ButtonGroup>
        </Box>
      </Box>

      {/* Voting Deadline Info */}
      <Tooltip
        title="Vote for your favorite snacks before this date! Vote counts reset after each snack order."
        arrow
        placement="bottom"
        slotProps={{
          tooltip: {
            sx: {
              fontSize: "0.95rem",
              padding: "0.75rem 1rem",
              backgroundColor: "rgba(0, 0, 0, 0.8)",
            },
          },
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            padding: "0.5rem 1rem",
            backgroundColor: "#3f62f7",
            borderRadius: "8px",
            boxShadow: "0 4px 12px rgba(46, 204, 113, 0.3)",
            cursor: "help",
          }}
        >
          <Box sx={{ fontSize: "1.5rem" }}>🍫</Box>
          <Box>
            <Typography
              variant="caption"
              sx={{
                color: "white",
                fontSize: { xs: "0.7rem", sm: "0.8rem" },
                display: "block",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                fontWeight: 700,
              }}
            >
              Next Snack Drop
            </Typography>
            <Typography
              variant="body2"
              sx={{
                fontWeight: 800,
                color: "white",
                fontSize: { xs: "0.9rem", sm: "1.1rem" },
              }}
            >
              {votingDeadline || "Friday, Dec 27"}
            </Typography>
          </Box>
        </Box>
      </Tooltip>

      {/* User Profile Menu / Login */}
      {user ? (
        <>
          <Tooltip title="Account" arrow>
            <IconButton onClick={handleMenuOpen} sx={{ p: 0 }}>
              <Avatar
                src={user.picture}
                alt={user.name}
                sx={{ width: 36, height: 36 }}
              />
            </IconButton>
          </Tooltip>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
            anchorOrigin={{
              vertical: "bottom",
              horizontal: "right",
            }}
            transformOrigin={{
              vertical: "top",
              horizontal: "right",
            }}
          >
            <MenuItem disabled>
              <Box>
                <Typography variant="body2" fontWeight={600}>
                  {user.name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {user.email}
                </Typography>
              </Box>
            </MenuItem>
            <MenuItem onClick={handleLogout}>Logout</MenuItem>
          </Menu>
        </>
      ) : (
        <LoginBox />
      )}
    </Box>
  );
}
