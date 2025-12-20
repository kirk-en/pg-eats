import {
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Paper,
  Typography,
} from "@mui/material";

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
          color: "#1a3a52",
          padding: "0.75rem",
          borderBottom: "1px solid #e0e4e8",
          flexShrink: 0,
        }}
      >
        Categories
      </Typography>
      <List
        sx={{
          padding: 0,
          overflowY: "auto",
          flex: 1,
          "&::-webkit-scrollbar": {
            width: "6px",
          },
          "&::-webkit-scrollbar-track": {
            background: "#f1f1f1",
          },
          "&::-webkit-scrollbar-thumb": {
            background: "#888",
            borderRadius: "3px",
            "&:hover": {
              background: "#555",
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
                selectedCategory === category.id ? "4px solid #2ecc71" : "none",
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
