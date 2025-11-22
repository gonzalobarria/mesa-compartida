import { celo, celoSepolia } from "wagmi/chains";

export const CONTRACTS_BY_CHAIN = {
  [celo.id]: {
    cUSD: "0x765DE816845861e75A25fCA122bb6898B8B1282a",
    USDC: "0xcebA9300f2b948710d2653dD7B07f33A8B32118C",
    USDT: "0x48065fbBE25f71C9282ddf5e1cD6D6A887483D5e",
  },
  [celoSepolia.id]: {
    cUSD: "0xdE9e4C3ce781b4bA68120d6261cbad65ce0aB00b",
    USDC: "0x01C5C0122039549AD1493B8220cABEdD739BC44E",
    USDT: "0xd077A400968890Eacc75cdc901F0356c943e4fDb",
  },
} as const;

export function getContractAddress(
  chainId: number,
  token: "cUSD" | "USDC" | "USDT"
): string | undefined {
  const contracts = CONTRACTS_BY_CHAIN[chainId as keyof typeof CONTRACTS_BY_CHAIN];
  if (!contracts) {
    return undefined;
  }
  return contracts[token];
}
