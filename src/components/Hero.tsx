import { Typography, Paper } from "@mui/material";

export function Hero() {
  return (
    <Paper
      component="section"
      className="hero"
      sx={{
        borderRadius: 1,
        padding: "3rem 2rem",
        marginBottom: "3rem",
        textAlign: "center",
        boxShadow: 2,
        borderLeft: "4px solid #3f62f7",
      }}
    >
      <Typography variant="h4" sx={{ fontWeight: 700, color: "#1a3a52" }}>
        What should we snack on?
      </Typography>
      <Typography
        variant="body1"
        sx={{ marginTop: "1rem", color: "#666666", lineHeight: 1.6 }}
      >
        Help us choose the best snacks for the office. Vote for your favorites
        and see what wins!
      </Typography>
    </Paper>
  );
}
