"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useAccount, useWriteContract, useChainId } from "wagmi";
import { useUserStore } from "@/stores/userStore";
import { useRouter, useParams } from "next/navigation";
import { getContractAddress, getContractABI } from "@/config/contracts";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function VendorRegistrationPage() {
  const t = useTranslations();
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;
  const chainId = useChainId();
  const { address } = useAccount();
  const [vendorName, setVendorName] = useState("");
  const [ensDomain, setEnsDomain] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setVendorProfile = useUserStore((state) => state.setVendorProfile);

  const contractAddress = chainId
    ? getContractAddress(chainId, "MesaCompartida")
    : undefined;
  const contractABI = getContractABI("MesaCompartida");

  const { writeContractAsync } = useWriteContract();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!vendorName.trim()) {
      setError(t("vendor.errors.nameRequired"));
      return;
    }

    if (!ensDomain.trim()) {
      setError(t("vendor.errors.ensRequired"));
      return;
    }

    if (!contractAddress) {
      setError(t("common.errors.networkNotSupported"));
      return;
    }

    if (!address) {
      setError(t("common.errors.walletNotConnected"));
      return;
    }

    try {
      setIsLoading(true);

      const hash = await writeContractAsync({
        address: contractAddress as `0x${string}`,
        abi: contractABI,
        functionName: "createVendorProfile",
        args: [vendorName.trim(), ensDomain.trim()],
      });

      if (hash) {
        setVendorProfile({
          address: address,
          name: vendorName,
          ipfsHash: "",
          rating: 0,
          totalSales: 0,
          verified: false,
          ensSubdomain: ensDomain,
          createdAt: Date.now(),
        });

        router.push(`/${locale}`);
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : t("common.errors.transactionFailed");
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="max-w-md mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {t("vendor.registration.title")}
          </h1>
          <p className="text-gray-600">
            {t("vendor.registration.description")}
          </p>
        </div>

        <Card className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="vendorName"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                {t("vendor.registration.nameLabel")}
              </label>
              <input
                id="vendorName"
                type="text"
                value={vendorName}
                onChange={(e) => setVendorName(e.target.value)}
                placeholder={t("vendor.registration.namePlaceholder")}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isLoading}
              />
            </div>

            <div>
              <label
                htmlFor="ensDomain"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                {t("vendor.registration.ensLabel")}
              </label>
              <input
                id="ensDomain"
                type="text"
                value={ensDomain}
                onChange={(e) => setEnsDomain(e.target.value)}
                placeholder={t("vendor.registration.ensPlaceholder")}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isLoading}
              />
              <p className="text-xs text-gray-500 mt-1">
                {t("vendor.registration.ensHelper")}
              </p>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg transition-colors"
            >
              {isLoading
                ? t("common.buttons.registering")
                : t("vendor.registration.submitButton")}
            </Button>
          </form>
        </Card>

      </div>
    </div>
  );
}
