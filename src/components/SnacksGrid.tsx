import { Paper, Typography, Box, CircularProgress } from "@mui/material";
import { SnackCard } from "./SnackCard";

interface Snack {
  id: string;
  name: string;
  image: string;
  imageUrl?: string;
  price?: string | number;
  votes?: number;
}

interface SnacksGridProps {
  snacks: Snack[];
  onVote?: (id: string) => void;
  isLoading?: boolean;
}

export function SnacksGrid({ snacks, onVote, isLoading }: SnacksGridProps) {
  if (isLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", padding: "3rem" }}>
        <CircularProgress />
      </Box>
    );
  }

  if (snacks.length === 0) {
    return (
      <Paper
        component="section"
        className="snacks-grid"
        sx={{
          borderRadius: 1,
          padding: "3rem 2rem",
          textAlign: "center",
          color: "#999999",
          fontSize: "1.1rem",
          border: "2px dashed #e0e4e8",
        }}
      >
        <Typography>No snacks found in this category</Typography>
      </Paper>
    );
  }

  return (
    <Box
      component="section"
      className="snacks-grid"
      sx={{
        display: "flex",
        flexWrap: "wrap",
        gap: 2,
        width: "100%",
      }}
    >
      {snacks.map((snack) => (
        <Box
          key={snack.id}
          sx={{
            flex: "0 1 calc(25% - 1.5rem)",
            minWidth: "160px",
            "@media (max-width: 1200px)": {
              flex: "0 1 calc(33.333% - 1.5rem)",
            },
            "@media (max-width: 768px)": {
              flex: "0 1 calc(50% - 1rem)",
            },
            "@media (max-width: 480px)": {
              flex: "0 1 calc(50% - 1rem)",
            },
          }}
        >
          <SnackCard
            {...snack}
            image={snack.imageUrl || snack.image}
            onVote={onVote}
          />
        </Box>
      ))}
    </Box>
  );
}
