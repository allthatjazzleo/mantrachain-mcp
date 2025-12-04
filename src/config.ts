import dotenv from 'dotenv';
import type { Chain } from 'viem';
import { DirectSecp256k1HdWallet, DirectEthSecp256k1HdWallet } from '@allthatjazzleo/proto-signing';
import { HdPath, Slip10RawIndex } from "@cosmjs/crypto";
import type { Address, Hash, WalletClient } from 'viem';
import { createWalletClient, http } from 'viem';
import { mnemonicToAccount } from 'viem/accounts';

// Load environment variables
dotenv.config();

export interface NetworkConfig {
  rpcEndpoint: string;
  apiEndpoint: string;
  evmEndpoint?: string;
  evmChainId?: string;
  chainId: string;
  prefix: string;
  denom: string;
  gasPrice: string;
  isMainnet: boolean;
  defaultNetwork?: boolean;
  displayDenom?: string;
  displayDenomExponent?: number;
  explorerUrl?: string;
  dexContractAddress?: string;
}

// Network configurations
const NETWORKS: Record<string, NetworkConfig> = {
  "mantra-dukong-1": {
    rpcEndpoint: 'https://rpc.dukong.mantrachain.io',
    apiEndpoint: 'https://api.dukong.mantrachain.io',
    evmEndpoint: 'https://evm.dukong.mantrachain.io',
    chainId: 'mantra-dukong-1',
    evmChainId: '5887',
    prefix: 'mantra',
    denom: 'amantra',
    gasPrice: '40000000000',
    isMainnet: false,
    defaultNetwork: true,
    displayDenom: 'MANTRA',
    displayDenomExponent: 18,
    explorerUrl: 'https://www.mintscan.io/mantra-testnet',
    dexContractAddress: 'mantra1us7rryvauhpe82fff0t6gjthdraqmtm5gw8c808f6eqzuxmulacqzkzdal'
  },
  "mantra-1": {
    rpcEndpoint: 'https://rpc.mantrachain.io',
    apiEndpoint: 'https://api.mantrachain.io',
    // evmEndpoint: 'https://evm.mantrachain.io',
    // evmChainId: '5888',
    chainId: 'mantra-1',
    prefix: 'mantra',
    denom: 'uom',
    gasPrice: '0.01',
    isMainnet: true,
    defaultNetwork: false,
    displayDenom: 'OM',
    displayDenomExponent: 6,
    explorerUrl: 'https://www.mintscan.io/mantra',
    dexContractAddress: 'mantra1466nf3zuxpya8q9emxukd7vftaf6h4psr0a07srl5zw74zh84yjqagspfm'
  },
};

export const DEFAULT_NETWORK = 'mantra-dukong-1';

// Add custom networks from environment variable if available
if (process.env.CUSTOM_NETWORKS) {
  try {
    const customNetworks = JSON.parse(process.env.CUSTOM_NETWORKS);
    Object.assign(NETWORKS, customNetworks);
    console.log('Custom networks loaded:', Object.keys(customNetworks));
  } catch (error) {
    console.error('Failed to parse CUSTOM_NETWORKS:', error);
  }
}

export const networks = NETWORKS;
export const mnemonic = process.env.MNEMONIC;

if (!mnemonic) {
  throw new Error('MNEMONIC environment variable is required.');
}

// Create wallet from mnemonic
export async function getWallet(networkName: string = DEFAULT_NETWORK) {
  const network = networks[networkName];
  const hasEvmEndpoint = network.evmEndpoint && network.evmEndpoint.trim() !== '';
  
  if (hasEvmEndpoint) {
    return DirectEthSecp256k1HdWallet.fromMnemonic(mnemonic!, {
      prefix: network.prefix,
      hdPaths: [makeCosmoshubPath(60, 0)],
    });
  } else {
    return DirectSecp256k1HdWallet.fromMnemonic(mnemonic!, {
      prefix: network.prefix,
      hdPaths: [makeCosmoshubPath(118, 0)],
    });
  }
}

// Create Evm wallet from mnemonic
export async function getEvmWallet(networkName: string = DEFAULT_NETWORK): Promise<WalletClient> {
  const network = networks[networkName];
  // Derive EVM account from mnemonic (default: first account, m/44'/60'/0'/0/0)
  const account = mnemonicToAccount(mnemonic!);

  // Create viem wallet client
  return createWalletClient({
    account,
    chain: getChain(networkName),
    transport: http(network.evmEndpoint),
  });
}

export function getChain(networkName: string = DEFAULT_NETWORK): Chain {
  const network = networks[networkName];
  if (!network) {
    throw new Error(`Network ${networkName} not found`);
  }
  if (!network.evmEndpoint) {
    throw new Error(`Network ${networkName} does not support EVM`);
  }
  return {
    id: Number(network.evmChainId),
    name: networkName,
    rpcUrls: {
      default: { http: [network.evmEndpoint] }
    },
    nativeCurrency: {
      name: network.displayDenom || 'OM',
      symbol: network.displayDenom || 'OM',
      decimals: 18,
    },
  };
}

/**
 * The Cosmos Hub derivation path in the form `m/44'/a'/0'/0/b`
 * where `a` is the coin type (60 for Ethereum, 118 for Cosmos)
 * with 0-based account index `b`.
 */
export function makeCosmoshubPath(a: number, b: number): HdPath {
  return [
    Slip10RawIndex.hardened(44),
    Slip10RawIndex.hardened(a),
    Slip10RawIndex.hardened(0),
    Slip10RawIndex.normal(0),
    Slip10RawIndex.normal(b),
  ];
}
