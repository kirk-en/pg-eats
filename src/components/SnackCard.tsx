import {
  Card,
  CardMedia,
  CardContent,
  Button,
  Typography,
  Box,
} from "@mui/material";
import ThumbUpIcon from "@mui/icons-material/ThumbUp";

interface SnackCardProps {
  id: string;
  name: string;
  image: string;
  price?: number;
  votes?: number;
  onVote?: (id: string) => void;
}

export function SnackCard({
  id,
  name,
  image,
  price,
  votes,
  onVote,
}: SnackCardProps) {
  return (
    <Card
      className="snack-card"
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        transition: "all 0.2s ease",
        "&:hover": {
          boxShadow: 3,
          transform: "translateY(-2px)",
        },
      }}
    >
      <CardMedia
        component="img"
        image={image}
        alt={name}
        sx={{
          height: 140,
          objectFit: "contain",
          borderRadius: "6px",
          margin: "1rem",
          marginBottom: "0.75rem",
          backgroundColor: "white",
        }}
      />
      <CardContent sx={{ flex: 1, padding: "0 1rem 1rem" }}>
        <Typography
          variant="subtitle2"
          sx={{
            fontWeight: 600,
            color: "#333333",
            lineHeight: 1.3,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            marginBottom: "0.5rem",
          }}
        >
          {name}
        </Typography>
        {price !== undefined && (
          <Typography
            variant="body1"
            sx={{ fontWeight: 700, color: "#1a3a52", marginBottom: "0.5rem" }}
          >
            {price}
          </Typography>
        )}
        {votes !== undefined && (
          <Typography
            variant="caption"
            sx={{ color: "#666666", marginBottom: "0.75rem" }}
          >
            {votes} votes
          </Typography>
        )}
      </CardContent>
      <Box sx={{ padding: "0 1rem 1rem" }}>
        <Button
          fullWidth
          variant="contained"
          startIcon={<ThumbUpIcon />}
          onClick={() => onVote?.(id)}
          sx={{
            backgroundColor: "#2ecc71",
            "&:hover": {
              backgroundColor: "#27ae60",
            },
          }}
        >
          Vote
        </Button>
      </Box>
    </Card>
  );
}
