"use client";

import { useState, useEffect } from "react";
import { useChainId, useWriteContract, useAccount, useWaitForTransactionReceipt } from "wagmi";
import { X } from "lucide-react";
import { getContractAddress, getContractABI } from "@/config/contracts";

interface CreateVoucherModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const DUMMY_IPFS_HASH = "QmDummyIPFSHash123456789abcdefghijklmnopqrst";

export function CreateVoucherModal({ isOpen, onClose, onSuccess }: CreateVoucherModalProps) {
  const chainId = useChainId();
  const { address } = useAccount();
  const { writeContractAsync } = useWriteContract();

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    maxSupply: "10",
    expiresInDays: "30",
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<`0x${string}` | null>(null);

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash: txHash || undefined,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setTxHash(null);

    if (!formData.name.trim()) {
      setError("Plate name is required");
      return;
    }

    if (!formData.description.trim()) {
      setError("Description is required");
      return;
    }

    if (Number(formData.maxSupply) <= 0) {
      setError("Quantity must be greater than 0");
      return;
    }

    if (Number(formData.expiresInDays) <= 0) {
      setError("Days must be greater than 0");
      return;
    }

    try {
      setIsLoading(true);

      const contractAddress = getContractAddress(chainId, "MesaCompartida");
      const contractABI = getContractABI("MesaCompartida");

      if (!contractAddress || !address) {
        setError("Network not supported");
        return;
      }

      // Calculate expiration timestamp in seconds (Solidity uses seconds, not milliseconds)
      const expiresAt = Math.floor(Date.now() / 1000) + Number(formData.expiresInDays) * 24 * 60 * 60;

      // Call createPlate through MesaCompartida contract
      const expirationTimestamp = BigInt(expiresAt);
      const maxSupplyBigInt = BigInt(Number(formData.maxSupply));

      const hash = await writeContractAsync({
        address: contractAddress as `0x${string}`,
        abi: contractABI,
        functionName: "createPlate",
        args: [
          formData.name.trim(),
          formData.description.trim(),
          DUMMY_IPFS_HASH,
          maxSupplyBigInt,
          expirationTimestamp,
        ],
      });

      if (hash) {
        setTxHash(hash);
        setFormData({
          name: "",
          description: "",
          maxSupply: "10",
          expiresInDays: "30",
        });
        setError("Transaction submitted. Waiting for confirmation...");
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Transaction failed. Please try again";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isSuccess) {
      setError(null);
      setTxHash(null);
      onSuccess?.();
      onClose();
    }
  }, [isSuccess, onSuccess, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-900">
            Create new voucher
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            aria-label="Close"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className={`p-4 rounded-lg ${
              error.includes("Waiting")
                ? "bg-blue-50 border border-blue-200"
                : "bg-red-50 border border-red-200"
            }`}>
              <p className={`text-sm ${
                error.includes("Waiting")
                  ? "text-blue-600"
                  : "text-red-600"
              }`}>
                {error}
                {isConfirming && " ⏳"}
              </p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Plate Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ex: Cheese Arepa"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe your dish and its ingredients"
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isLoading}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Number of Vouchers
              </label>
              <input
                type="number"
                value={formData.maxSupply}
                onChange={(e) => setFormData({ ...formData, maxSupply: e.target.value })}
                min="1"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isLoading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Expires in (days)
              </label>
              <input
                type="number"
                value={formData.expiresInDays}
                onChange={(e) => setFormData({ ...formData, expiresInDays: e.target.value })}
                min="1"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 disabled:opacity-50"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
              disabled={isLoading || isConfirming}
            >
              {isLoading ? "Creating..." : isConfirming ? "Confirming..." : "Create Voucher"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
