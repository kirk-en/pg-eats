import { createContext, useContext, useState, useEffect } from "react";
import type { ReactNode } from "react";
import { jwtDecode } from "jwt-decode";

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

const USER_DATA = [
  {
    id: "d4a07479-6064-46c5-bfa9-b25b62039283",
    username: "Andrew Konrad",
    balance: 11000,
  },
  {
    id: "0ab6eea9-8441-43a1-8ff9-3b9c3f4db05c",
    username: "Robert Waters",
    balance: 11000,
  },
  {
    id: "c1e564c4-d180-41ab-a9db-a843e89b7c0d",
    username: "Paulina Lancaster",
    balance: 1000.8722747752099,
  },
  {
    id: "30f75d89-ac04-4050-a058-6d04877a7572",
    username: "Oscar Rolf",
    balance: 1154.3798354222772,
  },
  {
    id: "fe499f71-24bf-4e48-a899-803b4c3c4191",
    username: "Sajni Patel",
    balance: 3711.397230134349,
  },
  {
    id: "293460ab-62dc-4bad-a878-d2cea08f62bf",
    username: "Aileen Gray",
    balance: 8584.403088191113,
  },
  {
    id: "2a1336ae-d36b-478c-82bd-a8fb5ab1a447",
    username: "Emma Chaves",
    balance: 2042.90466665002,
  },
  {
    id: "c5f685fb-b513-4332-8bb2-27f595b1ab0c",
    username: "CRM Tester",
    balance: 10000.0,
  },
  {
    id: "a908d761-6175-4d3d-9619-58e52c684636",
    username: "Camren Bruno",
    balance: 10978.409284630985,
  },
  {
    id: "08dc1697-37e6-4b7d-bd51-1cbbd5031cf4",
    username: "Joseph Grosso",
    balance: 11000.182638328912,
  },
  {
    id: "ec0b10e4-0f1d-47d5-a460-2616ad5d9f56",
    username: "Aaron Wagner",
    balance: 8458.656196419646,
  },
  {
    id: "54a729d9-6af8-45ce-90fe-b83367ef8fef",
    username: "Tristan Jaramillo",
    balance: 3444.0949426427414,
  },
  {
    id: "c448cdc4-b35e-4a72-b46e-3a671e7b6417",
    username: "Jason Kim",
    balance: 9610.801707835088,
  },
  {
    id: "42ea256f-afd2-4dd4-aa3e-b32d0f2d6531",
    username: "Jess Fleming",
    balance: 10000.0,
  },
  {
    id: "f1b197ba-f637-4b93-8a20-1ff5cf4766b5",
    username: "Nolan Borden",
    balance: 0.0003263249539031676,
  },
  {
    id: "01798f4f-ed45-4516-9d9c-23591f38a8e0",
    username: "Josh Andrews",
    balance: 858.8302484569032,
  },
  {
    id: "eb5cd07d-ccc5-4924-a279-ff50eb806cc9",
    username: "Henry Selden",
    balance: 9000,
  },
  {
    id: "76994ad5-a2a9-4a5a-b20e-bd920fbd7ee3",
    username: "Molly Farber",
    balance: 11001,
  },
  {
    id: "32469e4a-1b91-4667-950f-54bcf091f7c5",
    username: "Tom Antosik",
    balance: 821.6013333078392,
  },
  {
    id: "aa317bb2-caff-4cdb-8f0a-8f97c3f12e64",
    username: "Tayshaun Cayce",
    balance: 9000,
  },
  {
    id: "f7ea60af-ddd3-4cf3-9ed2-922de7895bef",
    username: "Amanda Galluzzo",
    balance: 3735.8951020316154,
  },
  {
    id: "1ea57c0b-38c1-4649-a786-ba03bceb6e24",
    username: "Averi Passmore",
    balance: 9069,
  },
  {
    id: "b73c61fc-073c-435d-8b63-c78498e68e08",
    username: "Talia Kirshenbaum",
    balance: 9990.0,
  },
  {
    id: "97820e94-a87a-45ad-a8c0-fb9c717422a9",
    username: "Om Gandhi",
    balance: 0.0004395536117,
  },
  {
    id: "93beab1b-0ad7-4d1a-a4fe-f5a47564795e",
    username: "Felicity Franklin",
    balance: 11000,
  },
  {
    id: "8b2ad1a9-0865-437b-95be-aac0726228ac",
    username: "Matthew Ritchie",
    balance: 3297.400137040011,
  },
  {
    id: "80a15c6d-01ab-4c1b-952b-46614a4848af",
    username: "Kevin Ferro",
    balance: 2167.175581968646,
  },
  {
    id: "6e77b153-1ca5-4174-86bb-1db50ff184d8",
    username: "Michael Murray",
    balance: 605.4614131409951,
  },
  {
    id: "660a1ac4-41ff-4e43-9bcf-f3aeec1697f0",
    username: "Kirk Enbysk",
    balance: 1155.2335298490373,
  },
  {
    id: "6287a104-a362-4224-a87e-312da4ea30c3",
    username: "Sasha Reiss",
    balance: 0.00015967634442404233,
  },
  {
    id: "a48bc44a-2c67-4d5a-833a-5f1807d6c8a0",
    username: "Daniel Andrews",
    balance: 3054.0544076463757,
  },
  {
    id: "d50c81a5-e6bc-4cf4-a10b-1a4cc3bfad9d",
    username: "Ryan Murdock",
    balance: 6000,
  },
  {
    id: "5a87650e-8540-4475-82e7-9539e0963d10",
    username: "Tim Wernke",
    balance: 3135.4587700101233,
  },
  {
    id: "69bc8e2b-807f-442f-a10a-ca45730bb302",
    username: "Jordon Bowles",
    balance: 2897.9213392809856,
  },
  {
    id: "ad5f00d8-4410-4b24-bbfe-551bba1e0351",
    username: "Isabel Lindmae",
    balance: 8000,
  },
  {
    id: "9d075981-85bd-4ede-b7aa-9e4c2ff5df06",
    username: "Cam Wilson",
    balance: 1319.5504375561904,
  },
  {
    id: "ce136c73-32ad-4bd1-894f-7efff0c1a6a6",
    username: "Kevin Smith",
    balance: 6815.174364758068,
  },
  {
    id: "9b0878b1-ac48-4c07-a6a0-ceceb7362fa6",
    username: "Jade Granger",
    balance: 9000,
  },
];

interface GoogleJWT {
  email: string;
  name: string;
  picture: string;
  email_verified: boolean;
  sub: string;
}

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
