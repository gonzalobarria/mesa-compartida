import { create } from "zustand";
import { useAccount, useChainId, useWriteContract, usePublicClient } from "wagmi";
import { useTranslations } from "next-intl";
import { getContractAddress, getContractABI } from "@/config/contracts";
import type { VendorProfile } from "@/types";

interface VendorState {
  // Estado
  currentVendor: VendorProfile | null;
  isLoading: boolean;
  error: string | null;

  // Setters básicos
  setCurrentVendor: (vendor: VendorProfile | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  // Acciones con blockchain
  createVendorProfile: (name: string, ipfsHash: string) => Promise<void>;
  updateVendorProfile: (name: string, ipfsHash: string) => Promise<void>;
  registerENS: (subdomain: string) => Promise<void>;
  fetchVendorProfile: (address: string) => Promise<void>;

  // Computed
  getVendorStats: () => {
    totalSales: number;
    rating: number;
  };
}

const createVendorStore = () => {
  return create<VendorState>((set, get) => {
    return {
      // Estado inicial
      currentVendor: null,
      isLoading: false,
      error: null,

      // Setters básicos
      setCurrentVendor: (vendor) => set({ currentVendor: vendor }),
      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),

      // Acciones con blockchain (stubs - usar a través de useVendorStoreActions)
      createVendorProfile: async () => {
        throw new Error(
          "createVendorProfile debe ser llamada desde un componente que use useVendorStoreActions()"
        );
      },

      updateVendorProfile: async () => {
        throw new Error(
          "updateVendorProfile debe ser llamada desde un componente que use useVendorStoreActions()"
        );
      },

      registerENS: async () => {
        throw new Error(
          "registerENS debe ser llamada desde un componente que use useVendorStoreActions()"
        );
      },

      fetchVendorProfile: async () => {
        throw new Error(
          "fetchVendorProfile debe ser llamada desde un componente que use useVendorStoreActions()"
        );
      },

      // Computed
      getVendorStats: () => {
        const vendor = get().currentVendor;
        return {
          totalSales: vendor?.totalSales || 0,
          rating: vendor?.rating || 0,
        };
      },
    };
  });
};

export const useVendorStore = createVendorStore();

// Hook helper para acceso a acciones que requieren wagmi hooks
export function useVendorStoreActions() {
  const t = useTranslations();
  const { address } = useAccount();
  const chainId = useChainId();
  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient();

  const vendorStore = useVendorStore();

  return {
    async createVendorProfile(name: string, ipfsHash: string) {
      if (!address) throw new Error(t('errors.walletNotConnected'));
      return await createVendorProfileHandler(
        writeContractAsync,
        chainId,
        name,
        ipfsHash,
        vendorStore
      );
    },

    async updateVendorProfile(name: string, ipfsHash: string) {
      if (!address) throw new Error(t('errors.walletNotConnected'));
      return await updateVendorProfileHandler(
        writeContractAsync,
        chainId,
        name,
        ipfsHash,
        vendorStore
      );
    },

    async fetchVendorProfile(vendorAddress: string) {
      return await fetchVendorProfileHandler(
        publicClient,
        chainId,
        vendorAddress,
        vendorStore,
        t
      );
    },
  };
}

// HANDLERS

const createVendorProfileHandler = async (
  writeContractAsync: any,
  chainId: number,
  name: string,
  ipfsHash: string,
  vendorStore: any
) => {
  vendorStore.setLoading(true);
  vendorStore.setError(null);

  try {
    const contractAddress = getContractAddress(chainId, "MesaCompartida");
    const abi = getContractABI("MesaCompartida");

    if (!contractAddress) {
      throw new Error("MesaCompartida contract not configured");
    }

    await writeContractAsync({
      address: contractAddress as `0x${string}`,
      abi: abi as any,
      functionName: "createVendorProfile",
      args: [name, ipfsHash],
    });

    vendorStore.setLoading(false);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to create vendor profile";
    vendorStore.setError(message);
    vendorStore.setLoading(false);
    throw error;
  }
};

const updateVendorProfileHandler = async (
  writeContractAsync: any,
  chainId: number,
  name: string,
  ipfsHash: string,
  vendorStore: any
) => {
  vendorStore.setLoading(true);
  vendorStore.setError(null);

  try {
    const contractAddress = getContractAddress(chainId, "MesaCompartida");
    const abi = getContractABI("MesaCompartida");

    if (!contractAddress) {
      throw new Error("MesaCompartida contract not configured");
    }

    await writeContractAsync({
      address: contractAddress as `0x${string}`,
      abi: abi as any,
      functionName: "updateVendorProfile",
      args: [name, ipfsHash],
    });

    vendorStore.setLoading(false);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to update vendor profile";
    vendorStore.setError(message);
    vendorStore.setLoading(false);
    throw error;
  }
};

const fetchVendorProfileHandler = async (
  publicClient: any,
  chainId: number,
  vendorAddress: string,
  vendorStore: any,
  t: any
) => {
  vendorStore.setLoading(true);
  vendorStore.setError(null);

  try {
    if (!publicClient) {
      throw new Error(t('errors.publicClientNotAvailable'));
    }

    const contractAddress = getContractAddress(chainId, "MesaCompartida");
    const abi = getContractABI("MesaCompartida");

    if (!contractAddress) {
      throw new Error("MesaCompartida contract not configured");
    }

    const profileData = await publicClient.readContract({
      address: contractAddress as `0x${string}`,
      abi: abi as any,
      functionName: "getVendorProfile",
      args: [vendorAddress],
    });

    // Map contract data to VendorProfile type
    const vendorProfile: VendorProfile = {
      address: vendorAddress,
      name: profileData.name || "",
      ipfsHash: "", // Not available from contract
      rating: profileData.ratingCount > 0
        ? profileData.ratingSum / profileData.ratingCount
        : 0,
      totalSales: Number(profileData.totalSales),
      verified: profileData.verified || false,
      createdAt: Date.now(),
    };

    vendorStore.setCurrentVendor(vendorProfile);
    vendorStore.setLoading(false);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch vendor profile";
    vendorStore.setError(message);
    vendorStore.setCurrentVendor(null);
    vendorStore.setLoading(false);
    throw error;
  }
};
