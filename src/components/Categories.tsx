import { useState, useMemo } from "react";
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItemButton,
  ListItemText,
  Paper,
  Typography,
  Box,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
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

// Map of broad categories to specific categories
const categoryGroups: Record<string, string[]> = {
  "Breakfast & Bakery": [
    "bagels-english-muffins",
    "bread",
    "breakfast",
    "breakfast-pastries",
    "cakes-pies",
    "cookies-brownies",
    "cookies-sweet-treats",
  ],
  Beverages: [
    "beer-cider",
    "coffee",
    "drink-mixes",
    "energy-drinks",
    "juice",
    "kombucha",
    "milk",
    "soda-soft-drinks",
    "sports-drinks",
    "tea",
    "water-sparkling-water",
  ],
  "Fresh Produce": [
    "dried-fruit-fruit-snacks",
    "fresh-fruits",
    "fresh-vegetables",
    "fruit-cups-applesauce",
  ],
  "Pantry Essentials": [
    "canned-goods-soups",
    "dips-spreads",
    "eggs",
    "hot-dogs-sausages",
    "nut-butters-spreads",
    "sauces-condiments",
  ],
  "Snacks & Treats": [
    "chips",
    "chocolate-candy",
    "gum-mints",
    "jerky",
    "more-snacks",
    "nuts-trail-mix",
    "popcorn",
    "snack-bars",
  ],
  "Specialty Items": [
    "holiday",
    "produce",
    "pudding-gelatin",
    "protein-shakes",
  ],
};

export function Categories({
  categories,
  selectedCategory,
  onSelectCategory,
}: CategoriesProps) {
  const [expandedGroup, setExpandedGroup] = useState<string | false>(false);

  // Find which group a category belongs to
  const getCategoryGroup = (categoryId: string): string | null => {
    for (const [group, ids] of Object.entries(categoryGroups)) {
      if (ids.includes(categoryId)) {
        return group;
      }
    }
    return null;
  };

  // Organize categories into groups
  const groupedCategories = useMemo(() => {
    const special = categories.filter(
      (cat) => cat.id === "most-popular" || cat.id === "most-recently-voted"
    );
    const grouped = Object.entries(categoryGroups).map(([group, ids]) => ({
      group,
      categories: categories
        .filter((cat) => ids.includes(cat.id))
        .sort((a, b) => ids.indexOf(a.id) - ids.indexOf(b.id)),
    }));
    return { special, grouped };
  }, [categories]);

  const handleGroupChange = (group: string) => {
    setExpandedGroup(expandedGroup === group ? false : group);
  };

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

      <Box
        sx={{
          flex: 1,
          overflowY: "auto",
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
        {/* Special categories (Most Popular, Latest Votes) */}
        {groupedCategories.special.map((category) => (
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
              padding: "0.75rem 1rem",
              fontWeight: 600,
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

        {/* Grouped categories with accordions */}
        {groupedCategories.grouped.map(({ group, categories: cats }) => (
          <Accordion
            key={group}
            expanded={expandedGroup === group}
            onChange={() => handleGroupChange(group)}
            disableGutters
            sx={{
              boxShadow: "none",
              borderBottom: "1px solid #e0e4e8",
              "&:before": {
                display: "none",
              },
              "&.Mui-expanded": {
                margin: 0,
              },
            }}
          >
            <AccordionSummary
              expandIcon={<ExpandMoreIcon sx={{ fontSize: "1.2rem" }} />}
              sx={{
                padding: "0.5rem 1rem",
                minHeight: "auto",
                "&.Mui-expanded": {
                  minHeight: "auto",
                  backgroundColor: "#f8fafb",
                },
                "& .MuiAccordionSummary-content": {
                  margin: 0,
                  padding: 0,
                  fontWeight: 600,
                  fontSize: "0.9rem",
                  color: "#333333",
                },
              }}
            >
              {group}
            </AccordionSummary>
            <AccordionDetails
              sx={{
                padding: 0,
              }}
            >
              <List sx={{ padding: 0 }}>
                {cats.map((category) => (
                  <ListItemButton
                    key={category.id}
                    selected={selectedCategory === category.id}
                    onClick={() => onSelectCategory?.(category.id)}
                    sx={{
                      borderLeft:
                        selectedCategory === category.id
                          ? "4px solid #3f62f7"
                          : "none",
                      paddingLeft:
                        selectedCategory === category.id ? "1.65rem" : "2rem",
                      fontSize: "0.85rem",
                      padding: "0.5rem 1rem",
                      paddingLeft:
                        selectedCategory === category.id ? "1.65rem" : "2rem",
                      backgroundColor: "#fafbfc",
                      "&.Mui-selected": {
                        backgroundColor: "#f0f2f5",
                        "&:hover": {
                          backgroundColor: "#e8eaee",
                        },
                      },
                      "&:hover": {
                        backgroundColor: "#f5f7fa",
                      },
                    }}
                  >
                    <ListItemText primary={category.name} />
                  </ListItemButton>
                ))}
              </List>
            </AccordionDetails>
          </Accordion>
        ))}
      </Box>
    </Paper>
  );
}
