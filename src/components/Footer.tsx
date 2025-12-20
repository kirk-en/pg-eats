import { Box, Typography } from "@mui/material";

export function Footer() {
  return (
    <Box
      component="footer"
      className="app-footer"
      sx={{
        backgroundColor: "#1a3a52",
        padding: "2rem",
        textAlign: "center",
        color: "rgba(255, 255, 255, 0.8)",
      }}
    >
      <Typography variant="body2">
        &copy; 2025 Playground Eats. Let's vote!
      </Typography>
    </Box>
  );
}
