import {
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Paper,
  Typography,
} from "@mui/material";
import RestaurantMenuIcon from "@mui/icons-material/RestaurantMenu";

interface Category {
  id: string;
  name: string;
}

interface CategoriesProps {
  categories: Category[];
  selectedCategory?: string;
  onSelectCategory?: (categoryId: string) => void;
}

export function Categories({
  categories,
  selectedCategory,
  onSelectCategory,
}: CategoriesProps) {
  return (
    <Paper
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <Typography
        variant="subtitle1"
        sx={{
          fontWeight: 700,
          color: "#3f62f7",
          padding: "0.75rem",
          borderBottom: "1px solid #e0e4e8",
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
        }}
      >
        <RestaurantMenuIcon sx={{ fontSize: "1.25rem" }} />
        Categories
      </Typography>
      <List
        sx={{
          padding: 0,
          overflowY: "auto",
          flex: 1,
          "&::-webkit-scrollbar": {
            width: "5px",
          },
          "&::-webkit-scrollbar-track": {
            background: "transparent",
          },
          "&::-webkit-scrollbar-thumb": {
            background: "rgba(0, 0, 0, 0.2)",
            borderRadius: "3px",
            "&:hover": {
              background: "rgba(0, 0, 0, 0.4)",
            },
          },
        }}
      >
        {categories.map((category) => (
          <ListItemButton
            key={category.id}
            selected={selectedCategory === category.id}
            onClick={() => onSelectCategory?.(category.id)}
            sx={{
              borderLeft:
                selectedCategory === category.id ? "4px solid #3f62f7" : "none",
              paddingLeft:
                selectedCategory === category.id ? "0.65rem" : "1rem",
              fontSize: "0.9rem",
              padding: "0.5rem 1rem",
              "&.Mui-selected": {
                backgroundColor: "#f8fafb",
                "&:hover": {
                  backgroundColor: "#f0f2f5",
                },
              },
            }}
          >
            <ListItemText primary={category.name} />
          </ListItemButton>
        ))}
      </List>
    </Paper>
  );
}
