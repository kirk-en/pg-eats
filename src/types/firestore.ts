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
  userVotes?: Record<string, number>;
  lastVotedAt?: Timestamp | null;
  tags?: string[];
  isActive?: boolean;
}
