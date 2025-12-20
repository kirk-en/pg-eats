import { createContext, useContext, useState, useEffect } from "react";
import type { ReactNode } from "react";
import { jwtDecode } from "jwt-decode";

interface User {
  email: string;
  name: string;
  picture: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isAuthorized: boolean;
  login: (credential: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ALLOWED_DOMAIN = "@tryplayground.com";

interface GoogleJWT {
  email: string;
  name: string;
  picture: string;
  email_verified: boolean;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    // Check if user is already logged in from localStorage
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      const parsedUser = JSON.parse(savedUser);
      setUser(parsedUser);
      setIsAuthorized(parsedUser.email.endsWith(ALLOWED_DOMAIN));
    }
  }, []);

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

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isAuthorized,
        login,
        logout,
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
