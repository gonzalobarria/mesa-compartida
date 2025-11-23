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

// Plate/Voucher
export interface Plate {
  name: string;
  description: string;
  ipfsHash: string;
  vendor: string;
  createdAt: number;
  expiresAt: number;
  maxSupply: number;
  availableVouchers: number;
}

// User Role
export type UserRole = "vendor" | "donor" | "beneficiary" | "none";
