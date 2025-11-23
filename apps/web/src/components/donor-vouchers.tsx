"use client";

import { useEffect, useState, useCallback } from "react";
import { useAccount, useChainId } from "wagmi";
import { usePublicClient } from "wagmi";
import { ShoppingCart, Star } from "lucide-react";
import { getContractAddress, getContractABI } from "@/config/contracts";
import { formatAddress } from "@/lib/utils";
import { PurchaseVoucherModal } from "./purchase-voucher-modal";

interface Plate {
  name: string;
  description: string;
  ipfsHash: string;
  vendor: string;
  createdAt: bigint;
  expiresAt: bigint;
  maxSupply: bigint;
  availableVouchers: bigint;
}

interface DisplayPlate extends Plate {
  vendorName: string;
  vendorRating: number;
  isExpired: boolean;
  daysUntilExpiry: number;
}

export function DonorVouchers() {
  const { address } = useAccount();
  const chainId = useChainId();
  const publicClient = usePublicClient();

  const [vouchers, setVouchers] = useState<DisplayPlate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPlate, setSelectedPlate] = useState<Plate | null>(null);
  const [selectedVendorInfo, setSelectedVendorInfo] = useState<{
    name: string;
    rating: number;
  } | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchMarketplaceVouchers = useCallback(async () => {
    if (!publicClient || !chainId) return;

    try {
      setIsLoading(true);
      setError(null);

      const mesaAddress = getContractAddress(chainId, "MesaCompartida");
      const mesaABI = getContractABI("MesaCompartida");

      if (!mesaAddress || mesaAddress === "0x0000000000000000000000000000000000000000") {
        setError("Network not supported");
        return;
      }

      const platesData = (await publicClient.readContract({
        address: mesaAddress as `0x${string}`,
        abi: mesaABI,
        functionName: "getMarketplaceVouchers",
        args: [],
      })) as any[];

      const displayPlates: DisplayPlate[] = [];
      const now = Math.floor(Date.now() / 1000);

      for (const plate of platesData) {
        try {
          const vendorProfile = await publicClient.readContract({
            address: mesaAddress as `0x${string}`,
            abi: mesaABI,
            functionName: "getVendorProfile",
            args: [plate.vendor],
          });

          const expiresAt = Number(plate.expiresAt);
          const isExpired = expiresAt < now;
          const daysUntilExpiry = Math.ceil((expiresAt - now) / (24 * 60 * 60));

          const vendorRating =
            (vendorProfile as any).ratingCount > 0
              ? Number((vendorProfile as any).ratingSum) / Number((vendorProfile as any).ratingCount)
              : 0;

          displayPlates.push({
            ...plate,
            vendorName: (vendorProfile as any).name || formatAddress(plate.vendor),
            vendorRating,
            isExpired,
            daysUntilExpiry,
          });
        } catch (err) {
          console.error("Error fetching voucher details:", err);
        }
      }

      const activeVouchers = displayPlates.filter((plate) => !plate.isExpired);
      setVouchers(activeVouchers);
    } catch (err) {
      console.error("Error fetching marketplace vouchers:", err);
      setError(`${err}`);
      setVouchers([]);
    } finally {
      setIsLoading(false);
    }
  }, [publicClient, chainId]);

  useEffect(() => {
    fetchMarketplaceVouchers();
  }, [fetchMarketplaceVouchers]);

  const handlePurchaseClick = (plate: DisplayPlate) => {
    setSelectedPlate(plate);
    setSelectedVendorInfo({
      name: plate.vendorName,
      rating: plate.vendorRating,
    });
    setIsModalOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#E07B39] mx-auto mb-2"></div>
          <p className="text-gray-600">Loading marketplace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative py-8">
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {vouchers.length === 0 ? (
        <div className="text-center py-12">
          <ShoppingCart className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg mb-4">
            No vouchers available at the moment
          </p>
          <p className="text-gray-400 text-sm">
            Check back soon for new offerings from our vendors
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {vouchers.map((plate, index) => (
            <div
              key={`${plate.vendor}-${index}`}
              className="group border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-all duration-300 flex flex-col"
            >
              {/* Image placeholder */}
              <div className="h-48 bg-gradient-to-br from-blue-100 to-blue-50 flex items-center justify-center overflow-hidden">
                {plate.ipfsHash ? (
                  <img
                    src={`https://ipfs.io/ipfs/${plate.ipfsHash}`}
                    alt={plate.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                ) : (
                  <ShoppingCart className="w-16 h-16 text-[#E07B39] opacity-30" />
                )}
              </div>

              <div className="p-4 flex flex-col flex-grow">
                <div className="mb-3">
                  <h3 className="text-lg font-semibold text-gray-900 line-clamp-2 mb-1">
                    {plate.name}
                  </h3>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-gray-600">{plate.vendorName}</p>
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 fill-[#E07B39] text-[#E07B39]" />
                      <span className="text-sm font-medium text-gray-700">
                        {plate.vendorRating.toFixed(1)}
                      </span>
                    </div>
                  </div>
                </div>

                <p className="text-gray-600 text-sm mb-4 line-clamp-2 flex-grow">
                  {plate.description}
                </p>

                <div className="grid grid-cols-2 gap-2 mb-4 pb-4 border-b border-gray-100">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-[#E07B39]">
                      {Number(plate.availableVouchers)}
                    </p>
                    <p className="text-xs text-gray-500">Available</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-semibold text-gray-900">
                      {plate.daysUntilExpiry} days
                    </p>
                    <p className="text-xs text-gray-500">Until expiry</p>
                  </div>
                </div>

                <button
                  onClick={() => handlePurchaseClick(plate)}
                  className="w-full px-4 py-2 bg-[#E07B39] hover:bg-[#C96A2E] text-white rounded-lg transition-colors font-medium flex items-center justify-center gap-2"
                >
                  <ShoppingCart className="w-4 h-4" />
                  Purchase
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <PurchaseVoucherModal
        isOpen={isModalOpen}
        plate={selectedPlate}
        vendorInfo={selectedVendorInfo}
        onClose={() => setIsModalOpen(false)}
        onPurchaseSuccess={() => {
          setIsModalOpen(false);
          fetchMarketplaceVouchers();
        }}
      />
    </div>
  );
}
