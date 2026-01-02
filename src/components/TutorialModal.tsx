import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  IconButton,
  useTheme,
  useMediaQuery,
  Link,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import CloseIcon from "@mui/icons-material/Close";
import BusinessIcon from "@mui/icons-material/Business";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import CheckIcon from "@mui/icons-material/Check";
import pgCoin from "../assets/pg-coin.png";
import pgeatsLogo from "../assets/pgeats-logo-2.png";
import addSnack from "../assets/add-snack.png";
import adExample from "../assets/ad-example.jpg";

interface TutorialModalProps {
  open: boolean;
  onClose: () => void;
}

const TutorialModal: React.FC<TutorialModalProps> = ({ open, onClose }) => {
  const { t } = useTranslation();
  const [activeStep, setActiveStep] = useState(0);
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));

  const steps = [
    {
      key: "step1",
      icon: (
        <Box
          component="img"
          src={pgeatsLogo}
          alt="Playground Eats"
          sx={{ height: 40 }}
        />
      ),
    },
    {
      key: "step2",
      icon: (
        <Box
          component="img"
          src={pgCoin}
          alt="PG Coin"
          sx={{ width: 60, height: 60, objectFit: "contain" }}
        />
      ),
    },
    {
      key: "step3",
      icon: (
        <Box
          component="img"
          src={addSnack}
          alt="Add Snack"
          sx={{ height: 60 }}
        />
      ),
    },
    {
      key: "step4",
      icon: (
        <Box
          component="img"
          src={adExample}
          alt="Banner Ad Example"
          sx={{ height: 100 }}
        />
      ),
    },
    {
      key: "step5",
      icon: <BusinessIcon sx={{ fontSize: 60, color: "info.main" }} />,
    },
  ];

  const handleNext = () => {
    if (activeStep === steps.length - 1) {
      onClose();
      // Optional: Reset step after closing so it starts from beginning next time
      setTimeout(() => setActiveStep(0), 200);
    } else {
      setActiveStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  const currentStep = steps[activeStep];

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullScreen={fullScreen}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          p: 1,
        },
      }}
    >
      <DialogTitle
        sx={{
          m: 0,
          p: 2,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Typography variant="h6" component="div" sx={{ fontWeight: "bold" }}>
          {t("tutorial.title", "Welcome to PG Eats")}
        </Typography>
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{
            color: (theme) => theme.palette.grey[500],
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ textAlign: "center", py: 4 }}>
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minHeight: 200,
            gap: 3,
          }}
        >
          {currentStep.icon}

          <Box>
            <Typography variant="h5" gutterBottom sx={{ fontWeight: "bold" }}>
              {t(`tutorial.${currentStep.key}.title`)}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {t(`tutorial.${currentStep.key}.description`)}
            </Typography>
            {currentStep.key === "step2" && (
              <>
                <Typography
                  variant="body1"
                  color="text.secondary"
                  sx={{ pt: 2 }}
                >
                  Each vote costs <b>1 PG coin</b>.
                </Typography>
                <Typography variant="body2" sx={{ mt: 1 }}>
                  (the <b>same coins</b> as used on{" "}
                  <Link
                    href="https://playgroundbets.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    color="primary"
                    underline="hover"
                  >
                    playgroundbets.com
                  </Link>
                  )
                </Typography>
              </>
            )}
          </Box>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2, justifyContent: "space-between" }}>
        <Button
          onClick={handleBack}
          disabled={activeStep === 0}
          startIcon={<ArrowBackIcon />}
          sx={{ visibility: activeStep === 0 ? "hidden" : "visible" }}
        >
          {t("common.back", "Back")}
        </Button>

        <Box sx={{ display: "flex", gap: 0.5 }}>
          {steps.map((_, index) => (
            <Box
              key={index}
              sx={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                bgcolor: index === activeStep ? "primary.main" : "grey.300",
                transition: "background-color 0.3s",
              }}
            />
          ))}
        </Box>

        <Button
          variant="contained"
          onClick={handleNext}
          endIcon={
            activeStep === steps.length - 1 ? (
              <CheckIcon />
            ) : (
              <ArrowForwardIcon />
            )
          }
        >
          {activeStep === steps.length - 1
            ? t("common.finish", "Finish")
            : t("common.next", "Next")}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TutorialModal;
