// Vendor Profile
export interface VendorProfile {
  address: string;
  name: string;
  ipfsHash: string;
  rating: number;
  totalSales: number;
  verified: boolean;
  ensSubdomain?: string;
  createdAt: number;
}

// Buyer Profile
export interface BuyerProfile {
  address: string;
  name: string;
  ipfsHash: string;
  rating: number;
  totalPurchases: number;
  createdAt: number;
}

// Beneficiary Profile
export interface BeneficiaryProfile {
  address: string;
  name: string;
  rating: number;
  totalRedemptions: number;
  createdAt: number;
}

// User Role
export type UserRole = "vendor" | "donor" | "beneficiary" | "none";
