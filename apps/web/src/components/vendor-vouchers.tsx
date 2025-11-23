"use client";

import { useEffect, useState, useCallback } from "react";
import { useAccount, useChainId } from "wagmi";
import { usePublicClient } from "wagmi";
import { useTranslations } from "next-intl";
import { Plus } from "lucide-react";
import { getContractAddress, getContractABI } from "@/config/contracts";
import { Plate } from "@/types";

export function VendorVouchers() {
  const t = useTranslations();
  const { address } = useAccount();
  const chainId = useChainId();
  const publicClient = usePublicClient();

  const [plates, setPlates] = useState<Plate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchVendorPlates = useCallback(async () => {
    if (!address || !publicClient || !chainId) return;

    try {
      setIsLoading(true);
      setError(null);

      const mesaAddress = getContractAddress(chainId, "MesaCompartida");
      const mesaABI = getContractABI("MesaCompartida");

      if (!mesaAddress) {
        setError(t("common.errors.networkNotSupported"));
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
  }, [address, publicClient, chainId, t]);

  useEffect(() => {
    fetchVendorPlates();
  }, [fetchVendorPlates]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-gray-600">{t("common.loading")}</p>
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
          <p className="text-gray-500 text-lg mb-4">
            {t("vendor.noVouchersCreated")}
          </p>
          <p className="text-gray-400 text-sm">
            {t("vendor.createFirstVoucher")}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {plates.map((plate, index) => (
            <div
              key={index}
              className="p-4 border border-gray-200 rounded-lg hover:shadow-lg transition-shadow"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {plate.name}
              </h3>
              <p className="text-gray-600 text-sm mb-4">{plate.description}</p>
              <div className="flex justify-between text-sm text-gray-500 mb-4">
                <span>{t("vendor.voucher.maxSupply")}: {plate.maxSupply}</span>
                <span>
                  {new Date(plate.expiresAt * 1000).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      <button
        className="fixed bottom-16 right-8 w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full flex items-center justify-center shadow-lg transition-all"
        aria-label={t("vendor.createNewVoucher")}
      >
        <Plus className="w-6 h-6" />
      </button>
    </div>
  );
}
