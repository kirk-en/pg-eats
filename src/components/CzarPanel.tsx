import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  TextField,
  Tab,
  Tabs,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  IconButton,
  CircularProgress,
  Alert,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Autocomplete,
  Tooltip,
  Switch,
  FormControlLabel,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import SearchIcon from "@mui/icons-material/Search";
import InfoIcon from "@mui/icons-material/Info";
import { useState, useEffect } from "react";
import {
  getProducts,
  getAllProducts,
  getAllUsers,
  getOffice,
  deleteProduct,
  undeleteProduct,
  updateOffice,
  updateUser,
  resetOfficeVotes,
} from "../services/firestore";
import { Timestamp } from "firebase/firestore";

interface Snack {
  id: string;
  name: string;
  image: string;
  imageUrl?: string;
  price?: string | number;
  votes?: number;
  category?: string;
  isActive?: boolean;
}

interface User {
  id: string;
  displayName: string;
  email: string;
  photoURL?: string;
  balance?: number;
  isAdmin?: boolean;
}

interface CzarPanelProps {
  open: boolean;
  onClose: () => void;
  office?: "nyc" | "denver";
  onOfficeChange?: (office: "nyc" | "denver") => void;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

// Monthly CAPTCHA trivia questions (one per month)
const monthlyTrivia = [
  {
    question: "What is a group of flamingos called?",
    options: ["A blaze", "A flamboyance", "A spectacle", "A parade"],
    correctAnswer: 1,
  },
  {
    question: "How many hearts does an octopus have?",
    options: ["1", "2", "3", "5"],
    correctAnswer: 2,
  },
  {
    question:
      "What is the only mammal with a true disc-shaped joint in its spine?",
    options: ["Elephant", "Giraffe", "Penguin", "Kangaroo"],
    correctAnswer: 2,
  },
  {
    question: "How long can a sloth hold its breath underwater?",
    options: ["5 minutes", "20 minutes", "40 minutes", "60 minutes"],
    correctAnswer: 2,
  },
  {
    question: "What is Scotland's national animal?",
    options: ["Lion", "Eagle", "Unicorn", "Stag"],
    correctAnswer: 2,
  },
  {
    question: "How many minutes did the shortest war in history last?",
    options: ["38-45 minutes", "2 hours", "1 day", "3 days"],
    correctAnswer: 0,
  },
  {
    question: "A cockroach can survive for how long without its head?",
    options: ["1 day", "3 days", "1 week", "2 weeks"],
    correctAnswer: 2,
  },
  {
    question: "What is a group of crows called?",
    options: ["A flock", "A murder", "A gathering", "A parliament"],
    correctAnswer: 1,
  },
  {
    question: "Which of these is a true berry?",
    options: ["Strawberry", "Blueberry", "Banana", "Blackberry"],
    correctAnswer: 2,
  },
  {
    question:
      "Is the Great Wall of China visible from space with the naked eye?",
    options: [
      "Yes, easily",
      "No, it is not",
      "Only at dawn",
      "Only on cloudy days",
    ],
    correctAnswer: 1,
  },
  {
    question: "What is a group of pandas called?",
    options: ["A cuddle", "An embarrassment", "A bamboo", "A crush"],
    correctAnswer: 1,
  },
  {
    question: "Cleopatra lived closer to which event?",
    options: [
      "The construction of the Great Pyramid",
      "The invention of the iPhone",
      "The Roman Empire",
      "Ancient Egypt's founding",
    ],
    correctAnswer: 1,
  },
];

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`czar-tabpanel-${index}`}
      aria-labelledby={`czar-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 2 }}>{children}</Box>}
    </div>
  );
}

export function CzarPanel({
  open,
  onClose,
  office = "nyc",
  onOfficeChange,
}: CzarPanelProps) {
  const [tabValue, setTabValue] = useState(0);
  const [currentOffice, setCurrentOffice] = useState<"nyc" | "denver">(office);
  const [snacks, setSnacks] = useState<Snack[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Set Czar Tab
  const [selectedCzar, setSelectedCzar] = useState<User | null>(null);
  const [currentCzar, setCurrentCzar] = useState<User | null>(null);
  const [currentCzarLoading, setCurrentCzarLoading] = useState(false);
  const [czarLoading, setCzarLoading] = useState(false);

  // Drop Date Tab
  const [newDropDate, setNewDropDate] = useState<string>("");
  const [dateLoading, setDateLoading] = useState(false);
  const [currentDropDate, setCurrentDropDate] = useState<string>("");

  // Tipping Tab
  const [tippingEnabled, setTippingEnabled] = useState(false);
  const [tippingLoading, setTippingLoading] = useState(false);

  // Lookup & Delete Tab
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [searchResults, setSearchResults] = useState<Snack[]>([]);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);

  // Reset Votes Tab
  const [captchaVerified, setCaptchaVerified] = useState(false);
  const [selectedTrivia, setSelectedTrivia] = useState<
    (typeof monthlyTrivia)[0] | null
  >(null);
  const [snacksOrderedConfirmed, setSnacksOrderedConfirmed] = useState(false);
  const [snacksMatchedConfirmed, setSnacksMatchedConfirmed] = useState(false);
  const [officeReadyConfirmed, setOfficeReadyConfirmed] = useState(false);
  const [nextDropDateReset, setNextDropDateReset] = useState<string>("");
  const [resetLoading, setResetLoading] = useState(false);

  useEffect(() => {
    setCurrentOffice(office);
  }, [office]);

  useEffect(() => {
    if (open) {
      loadSnacks();
      loadUsers();
      loadOfficeData();
      // Initialize random CAPTCHA question
      const randomIndex = Math.floor(Math.random() * monthlyTrivia.length);
      setSelectedTrivia(monthlyTrivia[randomIndex]);
    }
  }, [open, currentOffice]);

  useEffect(() => {
    // Reload current czar when users are updated
    if (users.length > 0 && open) {
      loadCurrentCzar();
    }
  }, [users, currentOffice, open]);

  const loadSnacks = async () => {
    setLoading(true);
    setError(null);
    try {
      const products = await getAllProducts();
      setSnacks(products);
    } catch (err) {
      setError("Failed to load snacks");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const allUsers = await getAllUsers();
      setUsers(allUsers);
    } catch (err) {
      console.error("Failed to load users:", err);
    }
  };

  const loadOfficeData = async () => {
    try {
      const officeData = await getOffice(currentOffice);
      if (officeData?.currentVotingPeriod?.endDate) {
        const endDate = officeData.currentVotingPeriod.endDate;
        // Convert Firestore Timestamp to datetime-local format
        const date =
          endDate instanceof Timestamp ? endDate.toDate() : new Date(endDate);
        const isoString = date.toISOString().slice(0, 16);
        setCurrentDropDate(isoString);
        setNewDropDate(isoString);
      }

      // Load tipping setting
      setTippingEnabled(officeData?.tippingEnabled ?? true);
    } catch (err) {
      console.error("Failed to load office data:", err);
    }
  };

  const loadCurrentCzar = async () => {
    setCurrentCzarLoading(true);
    try {
      const officeData = await getOffice(currentOffice);
      // Load current czar
      if (officeData?.czar) {
        const czarUser = users.find((u) => u.id === officeData.czar);
        setCurrentCzar(czarUser || null);
      } else {
        setCurrentCzar(null);
      }
    } catch (err) {
      console.error("Failed to load current czar:", err);
    } finally {
      setCurrentCzarLoading(false);
    }
  };

  const handleToggleTipping = async () => {
    setTippingLoading(true);
    try {
      await updateOffice(currentOffice, {
        tippingEnabled: !tippingEnabled,
      });
      setTippingEnabled(!tippingEnabled);
      setError(null);
      alert(
        `Tipping ${
          !tippingEnabled ? "enabled" : "disabled"
        } for ${currentOffice?.toUpperCase()}`
      );
    } catch (err) {
      setError("Failed to update tipping setting");
      console.error(err);
    } finally {
      setTippingLoading(false);
    }
  };

  const handleSetCzar = async () => {
    if (!selectedCzar) {
      setError("Please select a user as czar");
      return;
    }

    setCzarLoading(true);
    try {
      await updateOffice(currentOffice, { czar: selectedCzar.id });
      await updateUser(selectedCzar.id, { isAdmin: true });
      setError(null);
      alert(
        `Czar updated to: ${selectedCzar.displayName || selectedCzar.email}`
      );
      setSelectedCzar(null);
    } catch (err) {
      setError("Failed to update czar");
      console.error(err);
    } finally {
      setCzarLoading(false);
    }
  };

  const handleSetDropDate = async () => {
    if (!newDropDate) {
      setError("Please select a date");
      return;
    }

    setDateLoading(true);
    try {
      const dateObj = new Date(newDropDate);
      await updateOffice(currentOffice, {
        currentVotingPeriod: {
          startDate: Timestamp.now(),
          endDate: Timestamp.fromDate(dateObj),
          status: "active",
        },
      });
      setCurrentDropDate(newDropDate);
      setError(null);
      alert(`Drop date updated to: ${newDropDate}`);
    } catch (err) {
      setError("Failed to update drop date");
      console.error(err);
    } finally {
      setDateLoading(false);
    }
  };

  const handleSearch = () => {
    if (!searchTerm.trim()) {
      setSearchResults([]);
      return;
    }

    const results = snacks.filter((snack) =>
      snack.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setSearchResults(results);
  };

  const handleDeleteSnack = async (snackId: string) => {
    if (!window.confirm("Are you sure you want to delete this snack?")) {
      return;
    }

    setDeleteLoading(snackId);
    try {
      await deleteProduct(snackId);
      setSnacks(snacks.filter((s) => s.id !== snackId));
      setSearchResults(searchResults.filter((s) => s.id !== snackId));
      setError(null);
    } catch (err) {
      setError("Failed to delete snack");
      console.error(err);
    } finally {
      setDeleteLoading(null);
    }
  };

  const handleUndeleteSnack = async (snackId: string) => {
    if (!window.confirm("Are you sure you want to restore this snack?")) {
      return;
    }

    setDeleteLoading(snackId);
    try {
      await undeleteProduct(snackId);
      setSnacks(
        snacks.map((s) => (s.id === snackId ? { ...s, isActive: true } : s))
      );
      setSearchResults(
        searchResults.map((s) =>
          s.id === snackId ? { ...s, isActive: true } : s
        )
      );
      setError(null);
    } catch (err) {
      setError("Failed to restore snack");
      console.error(err);
    } finally {
      setDeleteLoading(null);
    }
  };

  const handleResetVotes = async () => {
    if (
      !captchaVerified ||
      !snacksOrderedConfirmed ||
      !snacksMatchedConfirmed ||
      !officeReadyConfirmed ||
      !nextDropDateReset
    ) {
      setError("Please complete all requirements before resetting votes");
      return;
    }

    setResetLoading(true);
    try {
      // Reset all snack votes for this office in Firestore
      await resetOfficeVotes(currentOffice, nextDropDateReset);

      setError(null);
      alert(
        `🎉 All vote counts have been reset! Next drop date set to ${nextDropDateReset}. New voting period begins!`
      );
      setCaptchaVerified(false);
      setSnacksOrderedConfirmed(false);
      setSnacksMatchedConfirmed(false);
      setOfficeReadyConfirmed(false);
      setNextDropDateReset("");
      setSearchResults([]);
      setSearchTerm("");
    } catch (err) {
      setError("Failed to reset votes");
      console.error(err);
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle
        sx={{
          fontWeight: 700,
          fontSize: "1.5rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span>Snack Czar Panel</span>
        <FormControl sx={{ minWidth: 150 }}>
          <InputLabel>Office</InputLabel>
          <Select
            value={currentOffice}
            label="Office"
            onChange={(e) => {
              const newOffice = e.target.value as "nyc" | "denver";
              setCurrentOffice(newOffice);
              onOfficeChange?.(newOffice);
            }}
          >
            <MenuItem value="nyc">NYC</MenuItem>
            <MenuItem value="denver">Denver</MenuItem>
          </Select>
        </FormControl>
      </DialogTitle>

      {error && (
        <Box sx={{ px: 3, pt: 2 }}>
          <Alert severity="error" onClose={() => setError(null)}>
            {error}
          </Alert>
        </Box>
      )}

      <DialogContent sx={{ pt: 1 }}>
        <Tabs
          value={tabValue}
          onChange={(e, newValue) => setTabValue(newValue)}
          aria-label="czar panel tabs"
          sx={{ borderBottom: 1, borderColor: "divider", mb: 2 }}
        >
          <Tab
            label="Set Czar"
            id="czar-tab-0"
            aria-controls="czar-tabpanel-0"
          />
          <Tab
            label="Drop Date"
            id="czar-tab-1"
            aria-controls="czar-tabpanel-1"
          />
          <Tab
            label="Tipping"
            id="czar-tab-2"
            aria-controls="czar-tabpanel-2"
          />
          <Tab
            label="Manage Items"
            id="czar-tab-3"
            aria-controls="czar-tabpanel-3"
          />
          <Tab
            label="Reset Votes"
            id="czar-tab-4"
            aria-controls="czar-tabpanel-4"
          />
        </Tabs>

        {/* Set Czar Tab */}
        <TabPanel value={tabValue} index={0}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Set the current snack czar for the{" "}
                {currentOffice?.toUpperCase()} office
              </Typography>
              <Tooltip
                title={
                  <Box sx={{ whiteSpace: "pre-line" }}>
                    <strong>Snack Czar Responsibilities:</strong>
                    {
                      "\n• Ordering snacks on the drop date\n• Dealing with disputes over office snacks\n• Keeping snacks stocked\n• Receives PG coin from snack voting as compensation (if enabled)"
                    }
                  </Box>
                }
              >
                <InfoIcon
                  sx={{ fontSize: 20, color: "text.secondary", cursor: "help" }}
                />
              </Tooltip>
            </Box>

            {currentCzarLoading ? (
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, p: 2 }}>
                <CircularProgress size={24} />
                <Typography variant="body2" color="text.secondary">
                  Loading current czar...
                </Typography>
              </Box>
            ) : currentCzar ? (
              <Paper
                sx={{
                  p: 2,
                  bgcolor: "primary.light",
                  borderLeft: "4px solid",
                  borderColor: "primary.main",
                }}
              >
                <Typography variant="caption" color="text.secondary">
                  Current Czar
                </Typography>
                <Typography variant="subtitle1" fontWeight={600} color="white">
                  {currentCzar.displayName}
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  color="white"
                >
                  {currentCzar.email}
                </Typography>
              </Paper>
            ) : null}

            <Autocomplete
              options={users.sort((a, b) =>
                a.displayName.localeCompare(b.displayName)
              )}
              getOptionLabel={(option) =>
                `${option.displayName} (${option.email})`
              }
              value={selectedCzar}
              onChange={(event, newValue) => {
                setSelectedCzar(newValue);
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Search users..."
                  placeholder="Type name or email"
                />
              )}
              isOptionEqualToValue={(option, value) => option.id === value?.id}
              noOptionsText="No users found"
            />
            <Button
              variant="contained"
              onClick={handleSetCzar}
              disabled={czarLoading || !selectedCzar}
              sx={{ alignSelf: "flex-start" }}
            >
              {czarLoading ? <CircularProgress size={24} /> : "Set New Czar"}
            </Button>
          </Box>
        </TabPanel>

        {/* Drop Date Tab */}
        <TabPanel value={tabValue} index={1}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <Typography variant="subtitle2" color="text.secondary">
              Update the snack drop deadline date for{" "}
              {currentOffice?.toUpperCase()}
            </Typography>
            {currentDropDate && (
              <Typography variant="body2">
                Current drop date: <strong>{currentDropDate}</strong>
              </Typography>
            )}
            <TextField
              label="New Drop Date"
              type="datetime-local"
              value={newDropDate}
              onChange={(e) => setNewDropDate(e.target.value)}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
            <Button
              variant="contained"
              onClick={handleSetDropDate}
              disabled={dateLoading || !newDropDate}
              sx={{ alignSelf: "flex-start" }}
            >
              {dateLoading ? <CircularProgress size={24} /> : "Update Date"}
            </Button>
          </Box>
        </TabPanel>

        {/* Tipping Settings Tab */}
        <TabPanel value={tabValue} index={2}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <Typography variant="subtitle2" color="text.secondary">
              Configure tipping settings for {currentOffice?.toUpperCase()}
            </Typography>

            <Paper
              sx={{
                p: 2,
                bgcolor: "grey.50",
                border: "1px solid",
                borderColor: "divider",
              }}
            >
              <FormControlLabel
                control={
                  <Switch
                    checked={tippingEnabled}
                    onChange={handleToggleTipping}
                    disabled={tippingLoading}
                  />
                }
                label={
                  <Box>
                    <Typography variant="body1" fontWeight={600}>
                      Snack Czar Tipping
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      When enabled, users' spent coins are automatically tipped
                      to the current snack czar
                    </Typography>
                  </Box>
                }
              />
            </Paper>

            {tippingEnabled && (
              <Alert severity="info">
                Users will automatically tip {currentOffice?.toUpperCase()} czar
                for each vote cast.
              </Alert>
            )}
            {!tippingEnabled && (
              <Alert severity="warning">
                Tipping is currently disabled for {currentOffice?.toUpperCase()}
                . Czar will not receive tips from votes.
              </Alert>
            )}
          </Box>
        </TabPanel>

        {/* Lookup & Delete Tab */}
        <TabPanel value={tabValue} index={3}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <Typography variant="subtitle2" color="text.secondary">
              Search for and delete snacks from the catalog.
            </Typography>

            <Box sx={{ display: "flex", gap: 1 }}>
              <TextField
                label="Search snacks"
                placeholder="Type snack name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                fullWidth
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    handleSearch();
                  }
                }}
              />
              <Button
                variant="contained"
                onClick={handleSearch}
                sx={{ minWidth: 100 }}
              >
                <SearchIcon />
              </Button>
            </Box>

            {loading ? (
              <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
                <CircularProgress />
              </Box>
            ) : searchResults.length === 0 && searchTerm ? (
              <Typography color="text.secondary" sx={{ py: 2 }}>
                No snacks found matching "{searchTerm}"
              </Typography>
            ) : (
              <Paper elevation={0} sx={{ bgcolor: "grey.50" }}>
                <List
                  sx={{
                    maxHeight: 400,
                    overflow: "auto",
                    border: "1px solid",
                    borderColor: "divider",
                    borderRadius: 1,
                  }}
                >
                  {searchResults.map((snack) => (
                    <ListItem
                      key={snack.id}
                      secondaryAction={
                        snack.isActive ? (
                          <IconButton
                            edge="end"
                            aria-label="delete"
                            onClick={() => handleDeleteSnack(snack.id)}
                            disabled={deleteLoading === snack.id}
                            color="error"
                          >
                            {deleteLoading === snack.id ? (
                              <CircularProgress size={24} />
                            ) : (
                              <DeleteIcon />
                            )}
                          </IconButton>
                        ) : (
                          <IconButton
                            edge="end"
                            aria-label="restore"
                            onClick={() => handleUndeleteSnack(snack.id)}
                            disabled={deleteLoading === snack.id}
                            color="primary"
                          >
                            {deleteLoading === snack.id ? (
                              <CircularProgress size={24} />
                            ) : (
                              <Typography
                                variant="body2"
                                sx={{ fontWeight: 600 }}
                              >
                                Restore
                              </Typography>
                            )}
                          </IconButton>
                        )
                      }
                    >
                      <ListItemText
                        primary={
                          <Typography
                            sx={{
                              textDecoration: snack.isActive
                                ? "none"
                                : "line-through",
                              color: snack.isActive
                                ? "inherit"
                                : "text.disabled",
                            }}
                          >
                            {snack.name}
                          </Typography>
                        }
                        secondary={
                          snack.category && (
                            <Typography
                              component="span"
                              variant="body2"
                              color="text.secondary"
                              sx={{
                                textDecoration: snack.isActive
                                  ? "none"
                                  : "line-through",
                              }}
                            >
                              Category: {snack.category} | Price: $
                              {snack.price || "N/A"}
                              {!snack.isActive && " (Deleted)"}
                            </Typography>
                          )
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              </Paper>
            )}
          </Box>
        </TabPanel>

        {/* Reset Votes Tab */}
        <TabPanel value={tabValue} index={4}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            <Paper
              sx={{
                p: 3,
                bgcolor: "#ffe8e8",
                border: "2px solid #ff6b6b",
                borderRadius: 2,
              }}
            >
              <Typography
                variant="h6"
                sx={{ fontWeight: 700, mb: 2, color: "#c92a2a" }}
              >
                ⚠️ FINAL VOTE COUNT RESET ⚠️
              </Typography>
              <Typography variant="body2" sx={{ mb: 2, fontStyle: "italic" }}>
                This action will reset all vote counts to zero and mark the end
                of the current voting period.
              </Typography>
            </Paper>

            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <Typography variant="subtitle2" fontWeight={600}>
                Step 1: Prove you're not a robot
              </Typography>
              <Paper
                sx={{
                  p: 2,
                  border: "1px solid",
                  borderColor: "divider",
                  bgcolor: "grey.50",
                }}
              >
                {selectedTrivia && (
                  <>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      {selectedTrivia.question}
                    </Typography>
                    <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                      {selectedTrivia.options.map((option, idx) => (
                        <Button
                          key={idx}
                          variant={
                            captchaVerified &&
                            idx === selectedTrivia.correctAnswer
                              ? "contained"
                              : "outlined"
                          }
                          onClick={() => {
                            if (idx === selectedTrivia.correctAnswer) {
                              setCaptchaVerified(true);
                            } else {
                              setCaptchaVerified(false);
                              setError("Wrong answer! Try again.");
                              setTimeout(() => setError(null), 2000);
                            }
                          }}
                          sx={{ maxWidth: 200 }}
                        >
                          {option}
                        </Button>
                      ))}
                    </Box>
                  </>
                )}
              </Paper>
            </Box>

            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <Typography variant="subtitle2" fontWeight={600}>
                Step 2: Confirm requirements
              </Typography>
              <Paper
                sx={{
                  p: 2,
                  border: "2px solid",
                  borderColor: captchaVerified ? "primary.main" : "divider",
                  bgcolor: "background.paper",
                  opacity: captchaVerified ? 1 : 0.6,
                  pointerEvents: captchaVerified ? "auto" : "none",
                }}
              >
                <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <input
                      type="checkbox"
                      id="snacks-ordered"
                      checked={snacksOrderedConfirmed}
                      onChange={(e) =>
                        setSnacksOrderedConfirmed(e.target.checked)
                      }
                      disabled={!captchaVerified}
                      style={{
                        cursor: captchaVerified ? "pointer" : "not-allowed",
                      }}
                    />
                    <label
                      htmlFor="snacks-ordered"
                      style={{ cursor: "pointer" }}
                    >
                      <Typography variant="body2" fontWeight={500}>
                        ✓ Snacks have been ordered and delivery confirmed
                      </Typography>
                    </label>
                  </Box>

                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <input
                      type="checkbox"
                      id="snacks-matched"
                      checked={snacksMatchedConfirmed}
                      onChange={(e) =>
                        setSnacksMatchedConfirmed(e.target.checked)
                      }
                      disabled={!captchaVerified || !snacksOrderedConfirmed}
                      style={{
                        cursor:
                          captchaVerified && snacksOrderedConfirmed
                            ? "pointer"
                            : "not-allowed",
                      }}
                    />
                    <label
                      htmlFor="snacks-matched"
                      style={{ cursor: "pointer" }}
                    >
                      <Typography variant="body2" fontWeight={500}>
                        ✓ Have matched snacks to the top voted items to the best
                        of ability
                      </Typography>
                    </label>
                  </Box>

                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <input
                      type="checkbox"
                      id="office-ready"
                      checked={officeReadyConfirmed}
                      onChange={(e) =>
                        setOfficeReadyConfirmed(e.target.checked)
                      }
                      disabled={!captchaVerified || !snacksMatchedConfirmed}
                      style={{
                        cursor:
                          captchaVerified && snacksMatchedConfirmed
                            ? "pointer"
                            : "not-allowed",
                      }}
                    />
                    <label htmlFor="office-ready" style={{ cursor: "pointer" }}>
                      <Typography variant="body2" fontWeight={500}>
                        ✓ The office is prepared for snack delivery
                      </Typography>
                    </label>
                  </Box>

                  <Typography
                    variant="caption"
                    sx={{
                      color: "#c92a2a",
                      fontWeight: 600,
                      mt: 1,
                      display: "block",
                    }}
                  >
                    🔥 I take full responsibility for the snacks!
                  </Typography>
                </Box>
              </Paper>
            </Box>

            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <Typography variant="subtitle2" fontWeight={600}>
                Step 3: Set next drop date
              </Typography>
              <TextField
                label="Next Snack Drop Date"
                type="datetime-local"
                value={nextDropDateReset}
                onChange={(e) => setNextDropDateReset(e.target.value)}
                fullWidth
                disabled={!captchaVerified}
                InputLabelProps={{ shrink: true }}
                sx={{
                  opacity: captchaVerified ? 1 : 0.6,
                }}
              />
            </Box>

            <Button
              variant="contained"
              size="large"
              onClick={handleResetVotes}
              disabled={
                !captchaVerified ||
                !snacksOrderedConfirmed ||
                !snacksMatchedConfirmed ||
                !officeReadyConfirmed ||
                !nextDropDateReset ||
                resetLoading
              }
              sx={{
                bgcolor:
                  snacksOrderedConfirmed &&
                  snacksMatchedConfirmed &&
                  officeReadyConfirmed &&
                  nextDropDateReset
                    ? "success.main"
                    : "action.disabled",
                "&:hover": {
                  bgcolor:
                    snacksOrderedConfirmed &&
                    snacksMatchedConfirmed &&
                    officeReadyConfirmed &&
                    nextDropDateReset
                      ? "success.dark"
                      : "action.disabled",
                },
              }}
            >
              {resetLoading ? (
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <CircularProgress size={20} color="inherit" />
                  Resetting votes...
                </Box>
              ) : (
                `🚀 RESET ALL ${currentOffice} OFFICE VOTES & START NEW PERIOD`
              )}
            </Button>

            {captchaVerified &&
              snacksOrderedConfirmed &&
              snacksMatchedConfirmed &&
              officeReadyConfirmed &&
              nextDropDateReset && (
                <Typography
                  variant="caption"
                  sx={{
                    color: "success.main",
                    fontWeight: 600,
                    textAlign: "center",
                  }}
                >
                  ✓ All requirements met - Ready to reset!
                </Typography>
              )}
          </Box>
        </TabPanel>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}
