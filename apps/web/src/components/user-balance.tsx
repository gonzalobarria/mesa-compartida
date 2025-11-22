"use client";

import { useAccount, useBalance, useChainId } from "wagmi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getContractAddress } from "@/config/contracts";

function BalanceDisplay({ address, token, symbol }: { address: `0x${string}`, token?: `0x${string}`, symbol: string }) {
  const { data, isLoading } = useBalance({
    address,
    token,
  });

  return (
    <div className="flex justify-between items-center">
      <span className="text-muted-foreground">{symbol}</span>
      <span className="font-medium">
        {isLoading ? "Loading..." : `${parseFloat(data?.formatted || '0').toFixed(4)}`}
      </span>
    </div>
  );
}

export function UserBalance() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();

  if (!isConnected || !address) {
    return null;
  }

  const cUSD_ADDRESS = getContractAddress(chainId, "cUSD") as `0x${string}` | undefined;
  const USDC_ADDRESS = getContractAddress(chainId, "USDC") as `0x${string}` | undefined;
  const USDT_ADDRESS = getContractAddress(chainId, "USDT") as `0x${string}` | undefined;

  return (
    <Card className="w-full max-w-md mx-auto mb-8">
      <CardHeader>
        <CardTitle className="text-lg font-medium">Connected Wallet</CardTitle>
        <p className="text-sm text-muted-foreground truncate pt-1">{address}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2 pt-2 border-t">
          <BalanceDisplay address={address} symbol="CELO" token={undefined} />
          {cUSD_ADDRESS && <BalanceDisplay address={address} token={cUSD_ADDRESS} symbol="cUSD" />}
          {USDC_ADDRESS && <BalanceDisplay address={address} token={USDC_ADDRESS} symbol="USDC" />}
          {USDT_ADDRESS && <BalanceDisplay address={address} token={USDT_ADDRESS} symbol="USDT" />}
        </div>
      </CardContent>
    </Card>
  );
}
