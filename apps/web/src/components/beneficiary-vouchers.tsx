"use client";

import { useEffect, useState, useCallback } from "react";
import { useAccount, useChainId } from "wagmi";
import { usePublicClient, useWriteContract } from "wagmi";
import { Gift } from "lucide-react";
import { getContractAddress, getContractABI } from "@/config/contracts";
import { formatAddress } from "@/lib/utils";

interface VoucherTransaction {
  buyer: string;
  vendor: string;
  amount: bigint;
  token: string;
  status: number;
  timestamp: bigint;
  voucherTokenId: bigint;
}

interface DisplayVoucher extends VoucherTransaction {
  transactionId: bigint;
  vendorName: string;
  plateName: string;
  plateDescription: string;
}

export function BeneficiaryVouchers() {
  const { address } = useAccount();
  const chainId = useChainId();
  const publicClient = usePublicClient();
  const { writeContractAsync } = useWriteContract();

  const [vouchers, setVouchers] = useState<DisplayVoucher[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [claimError, setClaimError] = useState<string | null>(null);

  const fetchAvailableVouchers = useCallback(async () => {
    if (!address || !publicClient || !chainId) return;

    try {
      setIsLoading(true);
      setError(null);

      const mesaAddress = getContractAddress(chainId, "MesaCompartida");
      const plateAddress = getContractAddress(chainId, "PlateNFT");
      const mesaABI = getContractABI("MesaCompartida");
      const plateABI = getContractABI("PlateNFT");

      if (!mesaAddress || !plateAddress) {
        setError("Network not supported");
        return;
      }

      // Get available vouchers
      const vouchersData = (await publicClient.readContract({
        address: mesaAddress as `0x${string}`,
        abi: mesaABI,
        functionName: "getAvailableVouchersForBeneficiary",
        args: [],
      })) as any[];

      // Get the transaction counter to search for transaction IDs
      const voucherTransactionCounter = (await publicClient.readContract({
        address: mesaAddress as `0x${string}`,
        abi: mesaABI,
        functionName: "voucherTransactionCounter",
        args: [],
      })) as bigint;

      const displayVouchers: DisplayVoucher[] = [];

      // For each available voucher, find its transaction ID by matching voucherTokenId
      for (const voucher of vouchersData) {
        try {
          // Find the transaction ID by iterating through all transactions
          // and matching the voucherTokenId
          let transactionId: bigint | null = null;

          for (let i = 0n; i < voucherTransactionCounter; i++) {
            const tx = await publicClient.readContract({
              address: mesaAddress as `0x${string}`,
              abi: mesaABI,
              functionName: "voucherTransactions",
              args: [i],
            });

            if ((tx as any).voucherTokenId === voucher.voucherTokenId) {
              transactionId = i;
              break;
            }
          }

          if (transactionId === null) {
            console.warn("Could not find transaction ID for voucher:", voucher.voucherTokenId);
            continue;
          }

          // Vendor name
          const vendorProfile = await publicClient.readContract({
            address: mesaAddress as `0x${string}`,
            abi: mesaABI,
            functionName: "getVendorProfile",
            args: [voucher.vendor],
          });

          // Plate metadata
          const voucherInfo = await publicClient.readContract({
            address: plateAddress as `0x${string}`,
            abi: plateABI,
            functionName: "getVoucherInfo",
            args: [BigInt(voucher.voucherTokenId)],
          });

          const plateMetadata = await publicClient.readContract({
            address: plateAddress as `0x${string}`,
            abi: plateABI,
            functionName: "getPlateMetadata",
            args: [(voucherInfo as any).plateId],
          });

          displayVouchers.push({
            ...voucher,
            transactionId,
            vendorName: (vendorProfile as any).name || formatAddress(voucher.vendor),
            plateName: (plateMetadata as any).name || "Unnamed Voucher",
            plateDescription: (plateMetadata as any).description || "",
          });
        } catch (err) {
          console.error("Error fetching voucher details:", err);
        }
      }

      setVouchers(displayVouchers);
    } catch (err) {
      console.error("Error fetching available vouchers:", err);
      setError(`${err}`);
      setVouchers([]);
    } finally {
      setIsLoading(false);
    }
  }, [address, publicClient, chainId]);

  useEffect(() => {
    fetchAvailableVouchers();
  }, [fetchAvailableVouchers]);

  const handleClaimVoucher = async (transactionId: bigint) => {
    if (!address || !publicClient || !chainId) return;

    try {
      setClaimingId(transactionId.toString());
      setClaimError(null);

      const mesaAddress = getContractAddress(chainId, "MesaCompartida");
      const mesaABI = getContractABI("MesaCompartida");

      if (!mesaAddress) {
        throw new Error("Network not supported");
      }

      const txHash = await writeContractAsync({
        address: mesaAddress as `0x${string}`,
        abi: mesaABI,
        functionName: "claimVoucher",
        args: [transactionId],
      });

      // Wait for transaction
      const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });

      if (receipt.status === "success") {
        // Refresh the list
        await fetchAvailableVouchers();
      } else {
        throw new Error("Transaction failed");
      }
    } catch (err) {
      console.error("Error claiming voucher:", err);
      setClaimError(`${err}`);
    } finally {
      setClaimingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-gray-600">Loading vouchers...</p>
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

      {claimError && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600">{claimError}</p>
        </div>
      )}

      {vouchers.length === 0 ? (
        <div className="text-center py-12">
          <Gift className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg mb-4">
            No vouchers available at the moment
          </p>
          <p className="text-gray-400 text-sm">
            Check back soon for new vouchers to redeem
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {vouchers.map((voucher) => (
            <div
              key={voucher.transactionId.toString()}
              className="p-4 border border-gray-200 rounded-lg hover:shadow-lg transition-shadow"
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {voucher.plateName}
                  </h3>
                  <p className="text-sm text-gray-500">
                    from <span className="font-medium">{voucher.vendorName}</span>
                  </p>
                </div>
                <Gift className="w-5 h-5 text-blue-600" />
              </div>

              <p className="text-gray-600 text-sm mb-4">
                {voucher.plateDescription}
              </p>

              <div className="flex justify-between text-sm text-gray-500 mb-4">
                <span className="text-blue-600 font-semibold">
                  {Number(voucher.amount) / 10 ** 6} cUSD
                </span>
                <span>
                  {new Date(Number(voucher.timestamp) * 1000).toLocaleDateString()}
                </span>
              </div>

              <button
                onClick={() => handleClaimVoucher(voucher.transactionId)}
                disabled={claimingId === voucher.transactionId.toString()}
                className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-colors font-medium"
              >
                {claimingId === voucher.transactionId.toString() ? "Claiming..." : "Claim Voucher"}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
