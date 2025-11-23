"use client";

import { useState, useRef, useEffect } from "react";
import { useChainId, useAccount, useBalance } from "wagmi";
import { usePublicClient, useWriteContract } from "wagmi";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { X, Star, CheckCircle, AlertCircle, Wallet } from "lucide-react";
import { getContractAddress, getContractABI, getTokenAddress, TOKENS_BY_CHAIN } from "@/config/contracts";
import { formatAddress } from "@/lib/utils";

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

interface VendorInfo {
  name: string;
  rating: number;
}

interface PurchaseVoucherModalProps {
  isOpen: boolean;
  plate: Plate | null;
  vendorInfo: VendorInfo | null;
  onClose: () => void;
  onPurchaseSuccess?: () => void;
}


const ERC20_ABI = [
  {
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    name: "approve",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "account", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
];

export function PurchaseVoucherModal({
  isOpen,
  plate,
  vendorInfo,
  onClose,
  onPurchaseSuccess,
}: PurchaseVoucherModalProps) {
  const chainId = useChainId();
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const { writeContractAsync } = useWriteContract();

  // Get token addresses for current chain
  const tokenAddresses = TOKENS_BY_CHAIN[chainId as keyof typeof TOKENS_BY_CHAIN] || {};
  const tokens = [
    { symbol: "cUSD", address: tokenAddresses.cUSD },
    { symbol: "USDC", address: tokenAddresses.USDC },
    { symbol: "USDT", address: tokenAddresses.USDT },
  ].filter((t) => t.address);

  // Fetch balances using wagmi's useBalance hook
  const cUSDBalance = useBalance({
    address: address as `0x${string}` | undefined,
    token: tokenAddresses.cUSD as `0x${string}` | undefined,
  });

  const USDCBalance = useBalance({
    address: address as `0x${string}` | undefined,
    token: tokenAddresses.USDC as `0x${string}` | undefined,
  });

  const USDTBalance = useBalance({
    address: address as `0x${string}` | undefined,
    token: tokenAddresses.USDT as `0x${string}` | undefined,
  });

  const [quantity, setQuantity] = useState(1);
  const [selectedToken, setSelectedToken] = useState(tokens[0]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuccessScreen, setShowSuccessScreen] = useState(false);
  const [transactionHash, setTransactionHash] = useState<string | null>(null);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const scrollableContentRef = useRef<HTMLDivElement>(null);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setShowSuccessScreen(false);
      setQuantity(1);
      setTermsAccepted(false);
      setTransactionHash(null);
      setError(null);
    }
  }, [isOpen]);

  // Scroll to top when success screen is shown
  useEffect(() => {
    if (showSuccessScreen && scrollableContentRef.current) {
      scrollableContentRef.current.scrollTop = 0;
    }
  }, [showSuccessScreen]);

  // Get balance data based on token symbol
  const getBalance = (symbol: string) => {
    switch (symbol) {
      case "cUSD":
        return cUSDBalance;
      case "USDC":
        return USDCBalance;
      case "USDT":
        return USDTBalance;
      default:
        return { data: undefined, isLoading: false };
    }
  };

  if (!plate) return null;

  const pricePerVoucher = 1; // Precio fijo: 1 USD por voucher
  const totalAmount = pricePerVoucher * quantity;

  const handlePurchase = async () => {
    if (!address || !publicClient || !plate) {
      setError("Wallet not connected or plate not selected");
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      const mesaAddress = getContractAddress(chainId, "MesaCompartida");
      const mesaABI = getContractABI("MesaCompartida");

      if (!mesaAddress) {
        throw new Error("MesaCompartida contract not configured");
      }

      // Convertir a wei (18 decimales para cUSD)
      const amountInWei = BigInt(Math.floor(totalAmount * 1e18));

      // PASO 1: Aprobar token
      try {
        const approveTxHash = await writeContractAsync({
          address: selectedToken.address as `0x${string}`,
          abi: ERC20_ABI,
          functionName: "approve",
          args: [mesaAddress as `0x${string}`, amountInWei],
        });

        console.log("Approval transaction:", approveTxHash);

        // Wait a bit for the approval to be mined
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (approveError) {
        console.error("Approval error:", approveError);
        throw new Error("Failed to approve token");
      }

      // PASO 2: Comprar voucher
      // Usamos voucherTokenId = 1 por ahora (placeholder)
      const voucherTokenId = BigInt(1);

      const txHash = await writeContractAsync({
        address: mesaAddress as `0x${string}`,
        abi: mesaABI,
        functionName: "purchaseVoucher",
        args: [voucherTokenId, amountInWei, selectedToken.address as `0x${string}`],
      });

      setTransactionHash(txHash);
      setShowSuccessScreen(true);
      // Call the success callback after successful purchase
      setTimeout(() => {
        onPurchaseSuccess?.();
      }, 2000);
    } catch (err) {
      console.error("Purchase error:", err);
      setError(err instanceof Error ? err.message : "Purchase failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseSuccess = () => {
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] p-0 bg-white flex flex-col">
        <DialogHeader className="sr-only">
          <DialogTitle>
            {showSuccessScreen ? "Purchase Successful" : plate?.name}
          </DialogTitle>
        </DialogHeader>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-50 w-10 h-10 bg-white border-2 border-gray-300 rounded-full flex items-center justify-center hover:bg-gray-50 transition shadow-lg"
        >
          <X className="w-6 h-6 text-gray-600" />
        </button>

        {/* Scrollable Content */}
        <div className="overflow-y-auto flex-1" ref={scrollableContentRef}>
          {/* Success Screen */}
          {showSuccessScreen && transactionHash ? (
            <div className="p-6">
              <div className="space-y-6 text-center">
                {/* Success Icon */}
                <div className="flex justify-center pt-4">
                  <div className="relative w-32 h-32">
                    <div className="absolute inset-0 bg-[#E07B39] rounded-full animate-pulse opacity-20" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <CheckCircle className="w-24 h-24 text-[#E07B39]" />
                    </div>
                  </div>
                </div>

                {/* Success Message */}
                <div>
                  <h2 className="text-4xl font-bold text-gray-900 mb-3">
                    Purchase Successful!
                  </h2>
                  <p className="text-gray-600 text-base">
                    Your voucher purchase has been confirmed on the blockchain
                  </p>
                </div>

                {/* Transaction Details */}
                <div className="p-6 bg-gray-50 border border-gray-200 rounded-lg space-y-4 text-left">
                  {/* Voucher Info */}
                  <div>
                    <div className="flex gap-4">
                      <div className="h-20 w-20 rounded-lg overflow-hidden flex-shrink-0 bg-blue-100 flex items-center justify-center">
                        <span className="text-2xl">🎁</span>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-gray-900">{plate.name}</h3>
                        <p className="text-sm text-gray-600 mt-1">
                          {quantity}x {selectedToken.symbol}
                        </p>
                        {vendorInfo && (
                          <p className="text-xs text-gray-500 mt-1">
                            {vendorInfo.name}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Transaction Hash */}
                  <div className="border-t border-gray-300 pt-4">
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">
                      Transaction Hash
                    </p>
                    <p className="text-xs font-mono text-gray-700 break-all">
                      {transactionHash}
                    </p>
                    <button
                      onClick={() => navigator.clipboard.writeText(transactionHash)}
                      className="mt-2 text-xs text-blue-600 hover:text-blue-700 font-medium"
                    >
                      Copy Hash
                    </button>
                  </div>

                  {/* Total */}
                  <div className="border-t border-gray-300 pt-4 bg-orange-50 rounded-lg p-4">
                    <p className="text-xs text-gray-600 mb-2 uppercase tracking-wide font-semibold">
                      Total Paid
                    </p>
                    <p className="text-3xl font-bold text-[#E07B39]">
                      {totalAmount.toFixed(2)} {selectedToken.symbol}
                    </p>
                  </div>
                </div>

                {/* Done Button */}
                <button
                  onClick={handleCloseSuccess}
                  className="w-full bg-[#E07B39] hover:bg-[#C96A2E] text-white font-semibold py-3 rounded-lg transition"
                >
                  Done
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col p-6">
              {/* Plate Info */}
              <div className="space-y-4 flex-1 pb-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    {plate.name}
                  </h2>
                  <p className="text-gray-700 text-base leading-normal">
                    {plate.description}
                  </p>
                </div>
              </div>

              {/* Vendor Info */}
              {vendorInfo && (
                <div className="space-y-2 border-t border-gray-200 py-4">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Vendor
                  </p>
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-[#E07B39] flex items-center justify-center text-white font-bold text-lg">
                      {vendorInfo.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">
                        {vendorInfo.name}
                      </h3>
                      <div className="flex items-center gap-1 mt-1">
                        <div className="flex items-center gap-1">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-4 h-4 ${
                                i < Math.floor(vendorInfo.rating)
                                  ? "fill-[#E07B39] text-[#E07B39]"
                                  : "fill-gray-300 text-gray-300"
                              }`}
                            />
                          ))}
                        </div>
                        <span className="font-semibold text-gray-900 ml-2">
                          {vendorInfo.rating.toFixed(1)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Quantity Selector */}
              <div className="space-y-2 border-t border-gray-200 py-4">
                <div className="flex items-center gap-2">
                  <label className="text-sm font-semibold text-gray-900">
                    Quantity
                  </label>
                  <p className="text-xs text-gray-500">
                    ({Number(plate.availableVouchers)} available)
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                  >
                    −
                  </button>
                  <input
                    type="number"
                    min="1"
                    max={Number(plate.availableVouchers)}
                    value={quantity}
                    onChange={(e) =>
                      setQuantity(
                        Math.max(
                          1,
                          Math.min(
                            Number(plate.availableVouchers),
                            parseInt(e.target.value) || 1
                          )
                        )
                      )
                    }
                    className="w-16 px-3 py-2 border border-gray-300 rounded-lg text-center focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                  />
                  <button
                    onClick={() =>
                      setQuantity(
                        Math.min(Number(plate.availableVouchers), quantity + 1)
                      )
                    }
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Token Selection */}
              <div className="space-y-2 border-t border-gray-200 py-4">
                <label className="text-sm font-semibold text-gray-900">
                  Select Token
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {tokens.map((token) => {
                    const balanceData = getBalance(token.symbol);
                    const balanceAmount = balanceData.data?.value || BigInt(0);
                    const hasEnoughBalance = balanceAmount >= BigInt(Math.floor(totalAmount * 1e18));

                    return (
                      <button
                        key={token.symbol}
                        onClick={() => setSelectedToken(token)}
                        className={`px-3 py-3 rounded-lg border-2 font-semibold transition flex flex-col items-center gap-1.5 ${
                          selectedToken.symbol === token.symbol
                            ? "border-[#E07B39] bg-orange-50"
                            : "border-gray-300 bg-white hover:border-[#E07B39]"
                        }`}
                      >
                        <span className={selectedToken.symbol === token.symbol ? "text-[#E07B39]" : "text-gray-700"}>
                          {token.symbol}
                        </span>
                        <span className={`text-sm font-medium ${
                          hasEnoughBalance ? "text-gray-700" : "text-red-600"
                        }`}>
                          {balanceData.isLoading ? "..." : parseFloat(balanceData.data?.formatted || "0").toFixed(4)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Voucher Info */}
              <div className="border-t border-gray-200 py-4">
                <h3 className="text-sm font-bold text-gray-900 mb-3">
                  Voucher Details
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Available:</span>
                    <span className="font-medium text-gray-900">
                      {Number(plate.availableVouchers)} vouchers
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Expires at:</span>
                    <span className="font-medium text-gray-900">
                      {new Date(Number(plate.expiresAt) * 1000).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Order Summary */}
              <div className="border-t border-gray-200 py-4">
                <h3 className="text-sm font-bold text-gray-900 mb-3">
                  Order Summary
                </h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700">
                      {quantity}x {pricePerVoucher.toFixed(2)} {selectedToken.symbol}
                    </span>
                    <span className="font-medium text-gray-900">
                      {totalAmount.toFixed(2)} {selectedToken.symbol}
                    </span>
                  </div>
                  <div className="border-t border-gray-200 pt-3 flex justify-between items-center">
                    <span className="font-semibold text-gray-900">Total</span>
                    <span className="text-lg font-bold text-[#E07B39]">
                      {totalAmount.toFixed(2)} {selectedToken.symbol}
                    </span>
                  </div>
                </div>
              </div>

              {/* Terms and Conditions */}
              <div className="border-t border-gray-200 py-4">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={termsAccepted}
                    onChange={(e) => setTermsAccepted(e.target.checked)}
                    className="w-5 h-5 rounded border-gray-300 text-[#E07B39] mt-0.5 flex-shrink-0 cursor-pointer"
                  />
                  <span className="text-sm text-gray-700">
                    I agree to the terms and conditions of this purchase
                  </span>
                </label>
              </div>

              {/* Error Message */}
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg mb-4">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                </div>
              )}

              {/* Insufficient Balance Warning */}
              {(() => {
                const balanceData = getBalance(selectedToken.symbol);
                const balanceAmount = parseFloat(balanceData.data?.formatted || "0");
                if (!balanceData.isLoading && balanceAmount < totalAmount) {
                  return (
                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg mb-4">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-yellow-700">
                          Insufficient {selectedToken.symbol} balance. You need {totalAmount.toFixed(2)} but have {balanceAmount.toFixed(4)}
                        </p>
                      </div>
                    </div>
                  );
                }
                return null;
              })()}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-2 text-[#E07B39] border border-[#E07B39] rounded-lg hover:bg-orange-50 font-semibold transition"
                >
                  Cancel
                </button>
                {(() => {
                  const balanceData = getBalance(selectedToken.symbol);
                  const balanceAmount = parseFloat(balanceData.data?.formatted || "0");
                  const insufficientBalance = balanceAmount < totalAmount;

                  return (
                    <button
                      onClick={handlePurchase}
                      disabled={!termsAccepted || isLoading || insufficientBalance}
                      className="flex-1 px-4 py-2 bg-[#E07B39] hover:bg-[#C96A2E] text-white rounded-lg font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      title={insufficientBalance ? `Insufficient ${selectedToken.symbol} balance` : ""}
                    >
                      <Wallet className="w-4 h-4" />
                      {isLoading ? "Processing..." : "Purchase"}
                    </button>
                  );
                })()}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
