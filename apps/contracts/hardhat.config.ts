import hardhatToolboxMochaEthersPlugin from "@nomicfoundation/hardhat-toolbox-mocha-ethers";
import { configVariable, defineConfig } from "hardhat/config";

export default defineConfig({
  plugins: [hardhatToolboxMochaEthersPlugin],
  solidity: {
    profiles: {
      default: {
        version: "0.8.28",
      },
      production: {
        version: "0.8.28",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
    },
  },
  networks: {
    hardhatMainnet: {
      type: "edr-simulated",
      chainType: "l1",
    },
    hardhatOp: {
      type: "edr-simulated",
      chainType: "op",
    },
    celoSepolia: {
      type: "http",
      url: "https://forno.celo-sepolia.celo-testnet.org/",
      accounts: {
        mnemonic: configVariable("PRIVATE_KEY_MNEMONIC"),
        path: "m/44'/52752'/0'/0"
      },
      chainId: 11142220
    },
    celo: {
      type: "http",
      url: "https://forno.celo.org⁄",
      accounts: {
        mnemonic: configVariable("PRIVATE_KEY_MNEMONIC"),
        path: "m/44'/52752'/0'/0"
      },
      chainId: 42220
    }
  },
  chainDescriptors: {
    11142220: {
      name: "celoSepolia",
      blockExplorers: {
        etherscan: {
          name: "celoSepolia",
          url: "https://sepolia.celoscan.io",
          apiUrl: "https://api.etherscan.io/v2/api",
        },
      },
    },
    42220: {
      name: "celo",
      blockExplorers: {
        etherscan: {
          name: "celo",
          url: "https://celoscan.io/",
          apiUrl: "https://api.etherscan.io/v2/api",
        },
      },
    },
  },
  verify: {
    blockscout: {
      enabled: false,
    },
    etherscan: {
      apiKey: configVariable("ETHERSCAN_API_KEY"),
    },
  }
});
