import { Box, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";

export function Footer() {
  const { t } = useTranslation();

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
      <Typography variant="body2">{t("footer.credits")}</Typography>
    </Box>
  );
}
