import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import "./styles/buttons.css";
import App from "./App.tsx";
import { AuthProvider } from "./contexts/AuthContext";
import {
  seedFirestore,
  clearFirestore,
  resetUsers,
} from "./utils/seedFirestore";

// Expose seed functions to window for manual execution
(window as any).seedFirestore = seedFirestore;
(window as any).clearFirestore = clearFirestore;
(window as any).resetUsers = resetUsers;

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>
);
