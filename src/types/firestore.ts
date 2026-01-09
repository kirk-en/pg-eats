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
  bonusCoins?: number; // Exclusive to PG Eats, spent before regular coins
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
  lastVotedAt_nyc?: Timestamp | null;
  lastVotedAt_denver?: Timestamp | null;
  tags?: string[];
  searchText?: string;
  isActive?: boolean;
  addedBy?: string; // UID of user who added the product
}

export interface BannerAd {
  id: string;
  createdBy: string; // UID of user who created the ad
  productId: string;
  productName: string;
  productImageUrl: string;
  displayName: string;
  styleVariant: string; // CSS style variant name
  customText: string; // User-entered text, max 80 chars
  voteDirection: "upvote" | "downvote";
  createdAt: Timestamp;
  expiresAt: Timestamp;
  isActive: boolean;
}
