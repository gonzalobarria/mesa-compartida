import { celo, celoSepolia, hardhat } from "wagmi/chains";
import MesaCompartidaABI from "./abis/MesaCompartida.json";
import PlateNFTABI from "./abis/PlateNFT.json";

// Token addresses by chain
export const TOKENS_BY_CHAIN = {
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

// Smart contract addresses by chain
export const SMART_CONTRACTS_BY_CHAIN = {
  [celoSepolia.id]: {
    PlateNFT: "0x0d4095Bb42a60Db45CabB1dc8343B7c895bB79F8",
    MesaCompartida: "0x47121735d951c17b4a1b51DCb000aa1480164a1b",
  },
  [celo.id]: {
    PlateNFT: "0x0000000000000000000000000000000000000000",
    MesaCompartida: "0x0000000000000000000000000000000000000000",
  },
  [hardhat.id]: {
    PlateNFT: "0x5FbDB2315678afecb367f032d93F642f64180aa3",
    MesaCompartida: "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512",
  },
} as const;

// Contract ABIs
export const CONTRACT_ABIS = {
  MesaCompartida: MesaCompartidaABI as any,
  PlateNFT: PlateNFTABI as any,
};

/**
 * Get token address by chain ID
 */
export function getTokenAddress(
  chainId: number,
  token: "cUSD" | "USDC" | "USDT"
): string | undefined {
  const tokens = TOKENS_BY_CHAIN[chainId as keyof typeof TOKENS_BY_CHAIN];
  if (!tokens) {
    return undefined;
  }
  return tokens[token];
}

/**
 * Get smart contract address by chain ID
 */
export function getContractAddress(
  chainId: number,
  contract: "MesaCompartida" | "PlateNFT"
): string | undefined {
  const contracts = SMART_CONTRACTS_BY_CHAIN[chainId as keyof typeof SMART_CONTRACTS_BY_CHAIN];
  if (!contracts) {
    return undefined;
  }
  return contracts[contract];
}

/**
 * Get contract ABI by name
 */
export function getContractABI(
  contract: "MesaCompartida" | "PlateNFT"
) {
  return CONTRACT_ABIS[contract].abi;
}

/**
 * Get all available tokens for a given chain
 * Returns with cUSD as the first (default) token
 */
export function getAvailableTokens(chainId: number): Array<{ symbol: "cUSD" | "USDC" | "USDT"; address: string }> {
  const tokens = TOKENS_BY_CHAIN[chainId as keyof typeof TOKENS_BY_CHAIN];
  if (!tokens) {
    return [];
  }
  return [
    { symbol: "cUSD", address: tokens.cUSD },
    { symbol: "USDC", address: tokens.USDC },
    { symbol: "USDT", address: tokens.USDT },
  ];
}

/**
 * Get the default token for a given chain (always cUSD)
 * Fallback to Celo Mainnet cUSD if chain is not supported
 */
export function getDefaultToken(chainId: number): { symbol: "cUSD"; address: string } {
  const tokens = TOKENS_BY_CHAIN[chainId as keyof typeof TOKENS_BY_CHAIN];
  if (!tokens) {
    // Fallback to Celo Mainnet cUSD
    return { symbol: "cUSD", address: TOKENS_BY_CHAIN[celo.id].cUSD };
  }
  return { symbol: "cUSD", address: tokens.cUSD };
}
