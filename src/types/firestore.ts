import { Timestamp } from "firebase/firestore";

export interface Office {
  id: string;
  name: string;
  timezone: string;
  czar: string | null;
  tippingEnabled: boolean;
  currentVotingPeriod: {
    startDate: Timestamp;
    endDate: Timestamp;
    status: "active" | "completed" | "pending";
  };
  nextDropDate?: string;
  lastResetAt?: Timestamp;
}

export interface User {
  id: string; // Firebase Auth UID
  email: string;
  displayName: string;
  photoURL: string;
  balance: number;
  isAdmin: boolean;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  imageUrl: string;
  votes_nyc?: number;
  votes_denver?: number;
  userVotes_nyc?: Record<string, number>;
  userVotes_denver?: Record<string, number>;
  userVotes?: Record<string, number>; // Deprecated, keeping for backward compatibility during migration
  lastVotedAt?: Timestamp | null;
  tags?: string[];
  isActive?: boolean;
}
