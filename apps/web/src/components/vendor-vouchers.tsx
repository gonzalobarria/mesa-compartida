"use client";

import { useEffect, useState, useCallback } from "react";
import { useAccount, useChainId } from "wagmi";
import { usePublicClient } from "wagmi";
import { Plus, ShoppingCart } from "lucide-react";
import { getContractAddress, getContractABI } from "@/config/contracts";
import { Plate } from "@/types";
import { CreateVoucherModal } from "./create-voucher-modal";

export function VendorVouchers() {
  const { address } = useAccount();
  const chainId = useChainId();
  const publicClient = usePublicClient();

  const [plates, setPlates] = useState<Plate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const fetchVendorPlates = useCallback(async () => {
    if (!address || !publicClient || !chainId) return;

    try {
      setIsLoading(true);
      setError(null);

      const mesaAddress = getContractAddress(chainId, "MesaCompartida");
      const mesaABI = getContractABI("MesaCompartida");

      if (!mesaAddress || mesaAddress === "0x0000000000000000000000000000000000000000") {
        setError("Network not supported");
        return;
      }

      // Get vendor's plates using the new contract method
      const vendorPlatesData = await publicClient.readContract({
        address: mesaAddress as `0x${string}`,
        abi: mesaABI,
        functionName: "getVendorPlates",
        args: [address],
      }) as any[];

      const formattedPlates: Plate[] = vendorPlatesData.map((plate) => ({
        name: plate.name || "",
        description: plate.description || "",
        ipfsHash: plate.ipfsHash || "",
        vendor: plate.vendor || "",
        createdAt: Number(plate.createdAt),
        expiresAt: Number(plate.expiresAt),
        maxSupply: Number(plate.maxSupply),
        availableVouchers: Number(plate.availableVouchers),
      }));

      setPlates(formattedPlates);
    } catch (err) {
      console.error("Error fetching vendor plates:", err);
      setError(`${err}`);
      setPlates([]);
    } finally {
      setIsLoading(false);
    }
  }, [address, publicClient, chainId]);

  useEffect(() => {
    fetchVendorPlates();
  }, [fetchVendorPlates]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#E07B39] mx-auto mb-2"></div>
          <p className="text-gray-600">Loading your vouchers...</p>
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

      {plates.length === 0 ? (
        <div className="text-center py-12">
          <ShoppingCart className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg mb-4">
            No vouchers created yet
          </p>
          <p className="text-gray-400 text-sm">
            Create your first voucher to get started
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plates.map((plate, index) => {
            const now = Math.floor(Date.now() / 1000);
            const daysUntilExpiry = Math.ceil((plate.expiresAt - now) / (24 * 60 * 60));

            return (
              <div
                key={index}
                className="group border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-all duration-300 flex flex-col"
              >
                {/* Image placeholder */}
                <div className="h-48 bg-gradient-to-br from-orange-100 to-orange-50 flex items-center justify-center overflow-hidden">
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
                  </div>

                  <p className="text-gray-600 text-sm mb-4 line-clamp-2 flex-grow">
                    {plate.description}
                  </p>

                  <div className="grid grid-cols-2 gap-2 mb-4 pb-4 border-b border-gray-100">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-[#E07B39]">
                        {plate.maxSupply}
                      </p>
                      <p className="text-xs text-gray-500">Max Supply</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-semibold text-gray-900">
                        {daysUntilExpiry} days
                      </p>
                      <p className="text-xs text-gray-500">Until expiry</p>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Available:</span>
                      <span className="font-medium text-gray-900">
                        {plate.availableVouchers}/{plate.maxSupply}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Expires:</span>
                      <span className="font-medium text-gray-900">
                        {new Date(plate.expiresAt * 1000).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <button
        onClick={() => setIsCreateModalOpen(true)}
        className="fixed bottom-16 right-8 w-14 h-14 bg-[#E07B39] hover:bg-[#C96A2E] text-white rounded-full flex items-center justify-center shadow-lg transition-all"
        aria-label="Create new voucher"
      >
        <Plus className="w-6 h-6" />
      </button>

      <CreateVoucherModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => fetchVendorPlates()}
      />
    </div>
  );
}
