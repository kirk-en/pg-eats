import { createContext, useContext, useState, useEffect } from "react";
import type { ReactNode } from "react";
import { jwtDecode } from "jwt-decode";
import { updateDoc, doc } from "firebase/firestore";
import { db } from "../lib/firebase";
import {
  getUser,
  createUser,
  getUserByEmail,
  deleteUser,
} from "../services/firestore";

interface GoogleJWT {
  email: string;
  email_verified: boolean;
  name: string;
  picture: string;
  sub: string;
}

interface User {
  email: string;
  name: string;
  picture: string;
  balance?: number;
  username?: string;
  id?: string;
  isAdmin?: boolean;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isAuthorized: boolean;
  login: (credential: string) => void;
  logout: () => void;
  updateBalance: (newBalance: number) => void;
  addToBalance: (amount: number) => void;
  isLoadingBalance: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ALLOWED_DOMAIN = "@tryplayground.com";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);

  useEffect(() => {
    // Check if user is already logged in from localStorage
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      const parsedUser = JSON.parse(savedUser);
      setUser(parsedUser);
      setIsAuthorized(parsedUser.email.endsWith(ALLOWED_DOMAIN));
      // Refresh user data from Firestore
      if (parsedUser.id) {
        refreshUserData(parsedUser.id);
      }
    }
  }, []);

  const refreshUserData = async (uid: string) => {
    setIsLoadingBalance(true);
    try {
      const firestoreUser = await getUser(uid);
      if (firestoreUser) {
        setUser((prev) => {
          if (!prev) return null;
          const updatedUser = {
            ...prev,
            balance: firestoreUser.balance,
            isAdmin: firestoreUser.isAdmin,
            picture: firestoreUser.photoURL,
            name: firestoreUser.displayName,
          };
          localStorage.setItem("user", JSON.stringify(updatedUser));
          return updatedUser;
        });
      }
    } catch (error) {
      console.error("Error refreshing user data:", error);
    } finally {
      setIsLoadingBalance(false);
    }
  };

  const login = async (credential: string) => {
    try {
      const decoded = jwtDecode<GoogleJWT>(credential);

      // Check if email is verified and from allowed domain
      if (!decoded.email_verified) {
        throw new Error("Email not verified");
      }

      if (!decoded.email.endsWith(ALLOWED_DOMAIN)) {
        throw new Error(`Only ${ALLOWED_DOMAIN} emails are allowed`);
      }

      // Check if user exists by email (from seeded JSON data)
      let firestoreUser = await getUserByEmail(decoded.email);

      if (!firestoreUser) {
        // Create new user with Google ID if they don't exist
        const newUser = {
          id: decoded.sub,
          email: decoded.email,
          displayName: decoded.name,
          photoURL: decoded.picture,
          balance: 0, // Default balance
          isAdmin: false,
        };
        await createUser(newUser);
        firestoreUser = newUser;
      } else {
        // User exists in seeded data, update their profile from Google
        // but keep their original UUID as the document ID
        await updateDoc(doc(db, "users", firestoreUser.id), {
          displayName: decoded.name,
          photoURL: decoded.picture,
        });
      }

      const userData: User = {
        email: firestoreUser.email,
        name: firestoreUser.displayName,
        picture: firestoreUser.photoURL,
        id: firestoreUser.id,
        balance: firestoreUser.balance,
        isAdmin: firestoreUser.isAdmin,
      };

      setUser(userData);
      setIsAuthorized(true);
      localStorage.setItem("user", JSON.stringify(userData));
    } catch (error) {
      console.error("Login failed:", error);
      alert(error instanceof Error ? error.message : "Login failed");
      logout();
    }
  };

  const logout = () => {
    setUser(null);
    setIsAuthorized(false);
    localStorage.removeItem("user");
  };

  const updateBalance = (newBalance: number) => {
    setUser((prevUser) => {
      if (!prevUser) return null;
      const updatedUser = { ...prevUser, balance: newBalance };
      localStorage.setItem("user", JSON.stringify(updatedUser));
      return updatedUser;
    });
  };

  const addToBalance = (amount: number) => {
    setUser((prevUser) => {
      if (!prevUser) return null;
      const newBalance = (prevUser.balance || 0) + amount;
      const updatedUser = { ...prevUser, balance: newBalance };
      localStorage.setItem("user", JSON.stringify(updatedUser));
      return updatedUser;
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isAuthorized,
        login,
        logout,
        updateBalance,
        addToBalance,
        isLoadingBalance,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
