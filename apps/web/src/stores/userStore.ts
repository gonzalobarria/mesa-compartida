import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { VendorProfile, BuyerProfile, BeneficiaryProfile, UserRole } from "@/types";

interface UserState {
  address: string | null;
  role: UserRole;
  vendorProfile: VendorProfile | null;
  buyerProfile: BuyerProfile | null;
  beneficiaryProfile: BeneficiaryProfile | null;
  isLoading: boolean;
  error: string | null;

  setAddress: (address: string | null) => void;
  setRole: (role: UserRole) => void;
  setVendorProfile: (profile: VendorProfile | null) => void;
  setBuyerProfile: (profile: BuyerProfile | null) => void;
  setBeneficiaryProfile: (profile: BeneficiaryProfile | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

const initialState = {
  address: null,
  role: "none" as UserRole,
  vendorProfile: null,
  buyerProfile: null,
  beneficiaryProfile: null,
  isLoading: false,
  error: null,
};

export const useUserStore = create<UserState>()(
  persist(
    (set): UserState => ({
      ...initialState,

      setAddress: (address) => set({ address }),
      setRole: (role) => set({ role }),
      setVendorProfile: (vendorProfile) => set({ vendorProfile }),
      setBuyerProfile: (buyerProfile) => set({ buyerProfile }),
      setBeneficiaryProfile: (beneficiaryProfile) => set({ beneficiaryProfile }),
      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),
      reset: () => set(initialState),
    }),
    {
      name: "user-store",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
