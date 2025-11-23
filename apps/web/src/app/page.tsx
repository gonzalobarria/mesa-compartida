"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useAccount } from "wagmi";
import { usePublicClient, useChainId } from "wagmi";
import { useUserStore } from "@/stores/userStore";
import { useVendorStore } from "@/stores/vendorStore";
import { HomeWelcome } from "@/components/homeWelcome";
import { RoleSelector } from "@/components/roleSelector";
import { VendorVouchers } from "@/components/vendor-vouchers";
import { BeneficiaryVouchers } from "@/components/beneficiary-vouchers";
import { useRouter } from "next/navigation";
import { getContractAddress, getContractABI } from "@/config/contracts";

export default function MarketplacePage() {
  const userRole = useUserStore((state) => state.role);
  const vendorProfile = useUserStore((state) => state.vendorProfile);
  const { address, isConnected } = useAccount();
  const router = useRouter();
  const chainId = useChainId();
  const publicClient = usePublicClient();

  const [searchQuery, setSearchQuery] = useState("");
  const [isCheckingVendor, setIsCheckingVendor] = useState(false);

  const { currentVendor } = useVendorStore();
  const setVendorProfile = useUserStore((state) => state.setVendorProfile);
  const setCurrentVendor = useVendorStore((state) => state.setCurrentVendor);

  const hasCheckedVendor = useRef(false);

  const fetchVendorProfile = useCallback(
    async (vendorAddress: string) => {
      if (!publicClient || !chainId) return;

      try {
        setIsCheckingVendor(true);
        const contractAddress = getContractAddress(chainId, "MesaCompartida");
        const abi = getContractABI("MesaCompartida");

        if (!contractAddress) return;

        try {
          const profileData = await publicClient.readContract({
            address: contractAddress as `0x${string}`,
            abi: abi as any,
            functionName: "getVendorProfile",
            args: [vendorAddress],
          }) as any;

          // Si no tiene nombre, no existe
          const vendorName = profileData?.name?.trim();
          if (vendorName.length === 0) {
            setCurrentVendor(null);
            return;
          }

          const vendorProfileData = {
            address: vendorAddress,
            name: vendorName,
            ipfsHash: "",
            rating: profileData.ratingCount > 0
              ? Number(profileData.ratingSum) / Number(profileData.ratingCount)
              : 0,
            totalSales: Number(profileData.totalSales),
            verified: profileData.verified || false,
            createdAt: Date.now(),
          };

          setCurrentVendor(vendorProfileData);
        } catch (contractError: any) {
          setCurrentVendor(null);
        }
      } catch (err) {
        console.error("Error fetching vendor profile:", err);
        setCurrentVendor(null);
      } finally {
        setIsCheckingVendor(false);
        hasCheckedVendor.current = true;
      }
    },
    [publicClient, chainId, setCurrentVendor]
  );

  useEffect(() => {
    if (userRole !== "vendor" || !isConnected || !address) {
      setIsCheckingVendor(false);
      hasCheckedVendor.current = false;
      return;
    }

    if (hasCheckedVendor.current) {
      return;
    }

    fetchVendorProfile(address);
  }, [userRole, address, isConnected, fetchVendorProfile]);

  useEffect(() => {
    if (currentVendor && currentVendor.name) {
      setVendorProfile(currentVendor);
    }
  }, [currentVendor, setVendorProfile]);

  useEffect(() => {
    if (userRole === "vendor" && !isCheckingVendor && hasCheckedVendor.current && !vendorProfile) {
      router.push("/vendor-registration");
    }
  }, [userRole, isCheckingVendor, vendorProfile, router]);

  if (userRole === "none") {
    return <RoleSelector />;
  }

  if (userRole === "vendor" && isCheckingVendor) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verificando perfil de vendedor...</p>
        </div>
      </div>
    );
  }

  if (userRole === "vendor" && !vendorProfile && !currentVendor?.name) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <HomeWelcome
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {userRole === "vendor" && vendorProfile && (
        <div className="max-w-6xl mx-auto px-4">
          <VendorVouchers />
        </div>
      )}

      {userRole === "beneficiary" && (
        <div className="max-w-6xl mx-auto px-4">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Available Vouchers
            </h2>
            <p className="text-gray-600">
              Claim vouchers available for you to redeem
            </p>
          </div>
          <BeneficiaryVouchers />
        </div>
      )}
    </div>
  );
}
