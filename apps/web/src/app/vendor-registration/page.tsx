"use client";

import { useState, useEffect } from "react";
import { useAccount, useWriteContract, useChainId, useWaitForTransactionReceipt } from "wagmi";
import { useUserStore } from "@/stores/userStore";
import { useRouter } from "next/navigation";
import { getContractAddress, getContractABI } from "@/config/contracts";
import { Card } from "@/components/ui/card";

export default function VendorRegistrationPage() {
  const router = useRouter();
  const chainId = useChainId();
  const { address } = useAccount();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<`0x${string}` | null>(null);
  const [success, setSuccess] = useState(false);
  const [vendorName, setVendorName] = useState("");
  const [ensName, setEnsName] = useState("");

  const setVendorProfile = useUserStore((state) => state.setVendorProfile);

  const contractAddress = chainId
    ? getContractAddress(chainId, "MesaCompartida")
    : undefined;
  const contractABI = getContractABI("MesaCompartida");

  const { writeContractAsync } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash: txHash || undefined,
  });

  useEffect(() => {
    if (isSuccess && txHash) {
      setSuccess(true);
      setVendorProfile({
        address: address!,
        name: vendorName,
        ipfsHash: "",
        rating: 0,
        totalSales: 0,
        verified: false,
        ensSubdomain: ensName,
        createdAt: Date.now(),
      });
      setError(null);
      setTimeout(() => {
        router.push("/");
      }, 2000);
    }
  }, [isSuccess, txHash, address, vendorName, ensName, setVendorProfile, router]);

  const handleRegister = async () => {
    setError(null);
    setSuccess(false);

    if (!vendorName.trim()) {
      setError("Vendor name is required");
      return;
    }

    if (!ensName.trim()) {
      setError("ENS name is required");
      return;
    }

    if (!contractAddress) {
      setError("Network not supported");
      return;
    }

    if (!address) {
      setError("Wallet not connected");
      return;
    }

    try {
      setIsLoading(true);

      const hash = await writeContractAsync({
        address: contractAddress as `0x${string}`,
        abi: contractABI,
        functionName: "createVendorProfile",
        args: [vendorName, ensName],
      });

      if (hash) {
        setTxHash(hash);
        setError("Transaction sent. Waiting for confirmation...");
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Transaction failed. Please try again";
      setError(errorMessage);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center px-4">
      <Card className="max-w-md w-full p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Vendor Registration
          </h1>
          <p className="text-gray-600 mb-4">
            Create your vendor profile to start selling
          </p>
        </div>

        {success ? (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg mb-6">
            <p className="text-green-700 font-semibold">✓ Registration successful!</p>
            <p className="text-green-600 text-sm mt-1">Redirecting...</p>
          </div>
        ) : (
          <>
            {error && (
              <div className={`p-4 rounded-lg mb-6 ${
                error.includes("Waiting") || error.includes("sent")
                  ? "bg-blue-50 border border-blue-200"
                  : "bg-red-50 border border-red-200"
              }`}>
                <p className={`text-sm ${
                  error.includes("Waiting") || error.includes("sent")
                    ? "text-blue-700"
                    : "text-red-700"
                }`}>
                  {error}
                  {isConfirming && " ⏳"}
                </p>
              </div>
            )}

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Vendor Name
                </label>
                <input
                  type="text"
                  value={vendorName}
                  onChange={(e) => setVendorName(e.target.value)}
                  placeholder="Enter your vendor name"
                  disabled={isLoading || isConfirming}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ENS Name
                </label>
                <input
                  type="text"
                  value={ensName}
                  onChange={(e) => setEnsName(e.target.value)}
                  placeholder="e.g., yourname.eth"
                  disabled={isLoading || isConfirming}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            <button
              onClick={handleRegister}
              disabled={isLoading || isConfirming}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading
                ? "Registering..."
                : isConfirming
                ? "Confirming..."
                : "Register as Vendor"}
            </button>

            <p className="text-xs text-gray-500 text-center mt-4">
              This will register you as a vendor with default profile settings.
              {address && (
                <>
                  <br />
                  <span className="font-mono">
                    {address.slice(0, 6)}...{address.slice(-4)}
                  </span>
                </>
              )}
            </p>
          </>
        )}
      </Card>
    </div>
  );
}
