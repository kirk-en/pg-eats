import { createContext, useContext, useState, useEffect } from "react";
import type { ReactNode } from "react";
import { jwtDecode } from "jwt-decode";
import USER_DATA from "../data/users.json";

interface User {
  email: string;
  name: string;
  picture: string;
  balance?: number;
  username?: string;
  id?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isAuthorized: boolean;
  login: (credential: string) => void;
  logout: () => void;
  isLoadingBalance: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ALLOWED_DOMAIN = "@tryplayground.com";
const SUPABASE_URL = "https://pkxlsscyfjjsxszvgqmh.supabase.co";
const SUPABASE_API_KEY = import.meta.env.VITE_SUPABASE_API_KEY || "";

async function fetchUserBalance(userName: string): Promise<User | null> {
  try {
    console.log("Fetching user profile for username:", userName);

    // Search in hardcoded user data
    const userProfile = USER_DATA.find(
      (profile) => profile.username === userName
    );
    console.log("Found profile:", userProfile);

    if (userProfile) {
      console.log(
        "User profile found - Balance:",
        userProfile.balance,
        "Username:",
        userProfile.username
      );
      return {
        balance: userProfile.balance,
        username: userProfile.username,
      } as Partial<User> as User;
    }
    console.log("No user profile found for username:", userName);
    return null;
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return null;
  }
}

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
      // Fetch balance for saved user
      if (parsedUser.name) {
        fetchBalance(parsedUser.name, parsedUser);
      }
    }
  }, []);

  const fetchBalance = async (userName: string, baseUser: User) => {
    setIsLoadingBalance(true);
    try {
      const balanceData = await fetchUserBalance(userName);
      if (balanceData) {
        const updatedUser = { ...baseUser, ...balanceData };
        setUser(updatedUser);
        localStorage.setItem("user", JSON.stringify(updatedUser));
      }
    } finally {
      setIsLoadingBalance(false);
    }
  };

  const login = (credential: string) => {
    try {
      const decoded = jwtDecode<GoogleJWT>(credential);

      // Check if email is verified and from allowed domain
      if (!decoded.email_verified) {
        throw new Error("Email not verified");
      }

      if (!decoded.email.endsWith(ALLOWED_DOMAIN)) {
        throw new Error(`Only ${ALLOWED_DOMAIN} emails are allowed`);
      }

      const userData: User = {
        email: decoded.email,
        name: decoded.name,
        picture: decoded.picture,
        id: decoded.sub,
      };

      setUser(userData);
      setIsAuthorized(true);
      localStorage.setItem("user", JSON.stringify(userData));

      // Fetch balance from Supabase
      fetchBalance(decoded.name, userData);
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

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isAuthorized,
        login,
        logout,
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
