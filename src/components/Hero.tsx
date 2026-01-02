import { Typography, Paper } from "@mui/material";
import { useTranslation } from "react-i18next";

export function Hero() {
  const { t } = useTranslation();

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
        {t("hero.title")}
      </Typography>
      <Typography
        variant="body1"
        sx={{ marginTop: "1rem", color: "#666666", lineHeight: 1.6 }}
      >
        {t("hero.subtitle")}
      </Typography>
    </Paper>
  );
}
