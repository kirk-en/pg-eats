import {
  Box,
  Typography,
  InputBase,
  CircularProgress,
  Tooltip,
} from "@mui/material";
import EventIcon from "@mui/icons-material/Event";
import SearchIcon from "@mui/icons-material/Search";
import logo from "../assets/pgeats-logo.png";

interface HeaderProps {
  votingDeadline?: string;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  isSearching?: boolean;
}

export function Header({
  votingDeadline,
  searchQuery,
  onSearchChange,
  isSearching,
}: HeaderProps) {
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
    }
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
      <Box sx={{ display: "flex", alignItems: "center" }}>
        <img
          src={logo}
          alt="Playground Eats"
          style={{
            height: "150px",
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
        {isSearching && (
          <CircularProgress
            size={16}
            sx={{ color: "#2ecc71", flexShrink: 0 }}
          />
        )}
      </Box>

      {/* Voting Deadline Info */}
      <Tooltip
        title="Vote for your favorite snacks before this date! Vote counts reset with each new snack drop/order."
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
            backgroundColor: "#2ecc71",
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
    </Box>
  );
}
