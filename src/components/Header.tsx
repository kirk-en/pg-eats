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
  const { user, logout, isLoadingBalance } = useAuth();
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
        backgroundColor: "#ffffff",
        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
        width: "100%",
        position: "sticky",
        top: 0,
        zIndex: 100,
      }}
    >
      {/* Top Row: Logo, Search, Actions */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0.75rem 2rem",
          gap: 3,
        }}
      >
        {/* Logo Section */}
        <Box
          onClick={onLogoClick}
          sx={{
            display: "flex",
            alignItems: "center",
            cursor: "pointer",
            transition: "opacity 0.2s ease",
            flex: { xs: 0, sm: 0, md: 0 },
            "&:hover": {
              opacity: 0.8,
            },
          }}
        >
          <img
            src={logo}
            alt="Playground Eats"
            style={{
              height: "32px",
              width: "auto",
            }}
          />
        </Box>

        {/* Search Bar - Center */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            backgroundColor: "#f5f7fa",
            borderRadius: "8px",
            border: "1px solid #e1e8f0",
            flex: 1,
            maxWidth: "500px",
            overflow: "hidden",
            padding: "0 1rem",
            gap: 0.75,
            transition: "all 0.2s ease",
            "&:focus-within": {
              borderColor: "#3f62f7",
              boxShadow: "0 0 0 3px rgba(63, 98, 247, 0.1)",
              backgroundColor: "#ffffff",
            },
          }}
        >
          <SearchIcon sx={{ color: "#9ca3af", fontSize: "1.1rem" }} />
          <InputBase
            placeholder="Search snacks..."
            value={searchQuery || ""}
            onChange={(e) => onSearchChange?.(e.target.value)}
            onKeyPress={handleKeyPress}
            sx={{
              flex: 1,
              fontSize: "0.95rem",
              color: "#1f2937",
              "& input": {
                padding: "0.75rem 0",
                "&::placeholder": {
                  color: "#9ca3af",
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
              padding: "0.4rem 0",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#3f62f7",
              fontSize: "1.1rem",
              transition: "opacity 0.2s ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.7")}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
          >
            {isSearching ? (
              <CircularProgress size={18} sx={{ color: "#3f62f7" }} />
            ) : (
              <SearchIcon sx={{ fontSize: "1.1rem" }} />
            )}
          </button>
        </Box>

        {/* Right Section: Deadline, Settings, User */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 2,
            justifyContent: "flex-end",
          }}
        >
          {/* Voting Deadline */}
          <Tooltip
            title="Vote for your favorite snacks before this date! Vote counts reset after each snack order."
            arrow
            placement="bottom"
            slotProps={{
              tooltip: {
                sx: {
                  fontSize: "0.9rem",
                  padding: "0.75rem 1rem",
                  backgroundColor: "rgba(0, 0, 0, 0.85)",
                  borderRadius: "6px",
                },
              },
            }}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                padding: "0.75rem 1.25rem",
                backgroundColor:
                  "linear-gradient(135deg, #3f62f7 0%, #2d4ce5 100%)",
                borderRadius: "8px",
                boxShadow: "0 4px 12px rgba(63, 98, 247, 0.3)",
                cursor: "help",
                transition: "all 0.2s ease",
                "&:hover": {
                  boxShadow: "0 6px 16px rgba(63, 98, 247, 0.4)",
                  transform: "translateY(-2px)",
                },
              }}
            >
              <Box sx={{ fontSize: "1.3rem" }}>📅</Box>
              <Box>
                <Typography
                  variant="caption"
                  sx={{
                    color: "rgba(255, 255, 255, 0.8)",
                    fontSize: "0.65rem",
                    display: "block",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                    fontWeight: 700,
                  }}
                >
                  Deadline
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 700,
                    color: "white",
                    fontSize: "0.95rem",
                  }}
                >
                  {votingDeadline || "Friday, Dec 27"}
                </Typography>
              </Box>
            </Box>
          </Tooltip>

          {/* Settings Menu */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 2.5,
              paddingLeft: 2,
              borderLeft: "1px solid #e5e7eb",
            }}
          >
            {/* Office Switch */}
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
              }}
            >
              <Typography
                variant="caption"
                sx={{
                  fontSize: "0.7rem",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  color: "#6b7280",
                  letterSpacing: "0.5px",
                }}
              >
                Office
              </Typography>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                <Typography
                  variant="caption"
                  sx={{
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    minWidth: "35px",
                    textAlign: "right",
                    color: office === "nyc" ? "#3f62f7" : "#9ca3af",
                  }}
                >
                  🗽
                </Typography>
                <Switch
                  checked={office === "denver"}
                  onChange={(e) =>
                    onOfficeChange?.(e.target.checked ? "denver" : "nyc")
                  }
                  size="small"
                  sx={{
                    "& .MuiSwitch-switchBase": {
                      color: "#d1d5db",
                      "&.Mui-checked": {
                        color: "#ef6820",
                      },
                      "&.Mui-checked + .MuiSwitch-track": {
                        backgroundColor: "#ef6820",
                      },
                    },
                    "& .MuiSwitch-track": {
                      backgroundColor: "#d1d5db",
                    },
                  }}
                />
                <Typography
                  variant="caption"
                  sx={{
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    minWidth: "35px",
                    color: office === "denver" ? "#ef6820" : "#9ca3af",
                  }}
                >
                  🏔️
                </Typography>
              </Box>
            </Box>

            {/* Language Toggle */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Typography
                variant="caption"
                sx={{
                  fontSize: "0.7rem",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  color: "#6b7280",
                  letterSpacing: "0.5px",
                }}
              >
                Lang
              </Typography>
              <ButtonGroup
                size="small"
                variant="outlined"
                sx={{
                  height: "32px",
                  backgroundColor: "#f5f7fa",
                  border: "1px solid #e5e7eb",
                  borderRadius: "6px",
                  "& .MuiButton-root": {
                    borderRadius: 0,
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    textTransform: "uppercase",
                    padding: "4px 10px",
                    borderRight: "1px solid #e5e7eb",
                    "&:last-child": {
                      borderRight: "none",
                    },
                  },
                }}
              >
                <Button
                  onClick={() => onLanguageChange?.("en")}
                  variant={language === "en" ? "contained" : "text"}
                  sx={{
                    backgroundColor:
                      language === "en" ? "#3f62f7" : "transparent",
                    color: language === "en" ? "white" : "#6b7280",
                    border: "none",
                    "&:hover": {
                      backgroundColor:
                        language === "en" ? "#2d4ce5" : "#f0f0f0",
                    },
                  }}
                >
                  En
                </Button>
                <Button
                  onClick={() => onLanguageChange?.("es")}
                  variant={language === "es" ? "contained" : "text"}
                  sx={{
                    backgroundColor:
                      language === "es" ? "#3f62f7" : "transparent",
                    color: language === "es" ? "white" : "#6b7280",
                    border: "none",
                    "&:hover": {
                      backgroundColor:
                        language === "es" ? "#2d4ce5" : "#f0f0f0",
                    },
                  }}
                >
                  Es
                </Button>
              </ButtonGroup>
            </Box>
          </Box>

          {/* User Profile / Login */}
          {user ? (
            <>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  paddingLeft: 2,
                  borderLeft: "1px solid #e5e7eb",
                }}
              >
                {/* Compact Balance */}
                {user && (
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "flex-end",
                      gap: 0,
                    }}
                  >
                    <Typography
                      variant="caption"
                      sx={{
                        color: "#3f62f7",
                        fontSize: "0.65rem",
                        fontWeight: 700,
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                      }}
                    >
                      Balance
                    </Typography>
                    {isLoadingBalance ? (
                      <CircularProgress size={16} sx={{ color: "#3f62f7" }} />
                    ) : (
                      <Typography
                        sx={{
                          fontWeight: 700,
                          color: "#3f62f7",
                          fontSize: "1.5rem",
                          lineHeight: 1,
                        }}
                      >
                        {user.balance !== undefined
                          ? Math.floor(user.balance).toLocaleString()
                          : "—"}{" "}
                        pg
                      </Typography>
                    )}
                  </Box>
                )}
                <Tooltip title="Account menu" arrow placement="bottom">
                  <IconButton
                    onClick={handleMenuOpen}
                    sx={{
                      p: 0.5,
                      transition: "all 0.2s ease",
                      "&:hover": {
                        backgroundColor: "#f5f7fa",
                        borderRadius: "8px",
                      },
                    }}
                  >
                    <Avatar
                      src={user.picture}
                      alt={user.name}
                      sx={{
                        width: 40,
                        height: 40,
                        border: "2px solid #e5e7eb",
                      }}
                    />
                  </IconButton>
                </Tooltip>
              </Box>
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
                slotProps={{
                  paper: {
                    sx: {
                      borderRadius: "8px",
                      boxShadow: "0 10px 25px rgba(0, 0, 0, 0.1)",
                      backgroundColor: "#ffffff",
                    },
                  },
                }}
              >
                <MenuItem disabled>
                  <Box>
                    <Typography
                      variant="body2"
                      fontWeight={700}
                      sx={{ color: "#1f2937" }}
                    >
                      {user.name}
                    </Typography>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ color: "#9ca3af" }}
                    >
                      {user.email}
                    </Typography>
                  </Box>
                </MenuItem>
                <Box sx={{ borderTop: "1px solid #e5e7eb", my: 1 }} />
                <MenuItem onClick={handleLogout}>
                  <Typography
                    sx={{
                      fontSize: "0.9rem",
                      color: "#1f2937",
                      fontWeight: 500,
                    }}
                  >
                    Logout
                  </Typography>
                </MenuItem>
              </Menu>
            </>
          ) : (
            <Box sx={{ minWidth: "180px" }}>
              <LoginBox />
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
}
