import { formatEther, formatUnits, getContract } from 'viem';
import { getPublicClient } from './clients.js';
import { readContract } from './contracts.js';
import * as services from './index.js';
import { DEFAULT_NETWORK } from '../config.js';

// Standard ERC20 ABI (minimal for reading)
const erc20Abi = [
	{
		inputs: [],
		name: 'symbol',
		outputs: [{ type: 'string' }],
		stateMutability: 'view',
		type: 'function'
	},
	{
		inputs: [],
		name: 'decimals',
		outputs: [{ type: 'uint8' }],
		stateMutability: 'view',
		type: 'function'
	},
	{
		inputs: [{ type: 'address', name: 'account' }],
		name: 'balanceOf',
		outputs: [{ type: 'uint256' }],
		stateMutability: 'view',
		type: 'function'
	}
] as const;

// Standard ERC721 ABI (minimal for reading)
const erc721Abi = [
	{
		inputs: [{ type: 'address', name: 'owner' }],
		name: 'balanceOf',
		outputs: [{ type: 'uint256' }],
		stateMutability: 'view',
		type: 'function'
	},
	{
		inputs: [{ type: 'uint256', name: 'tokenId' }],
		name: 'ownerOf',
		outputs: [{ type: 'address' }],
		stateMutability: 'view',
		type: 'function'
	}
] as const;

// Standard ERC1155 ABI (minimal for reading)
const erc1155Abi = [
	{
		inputs: [
			{ type: 'address', name: 'account' },
			{ type: 'uint256', name: 'id' }
		],
		name: 'balanceOf',
		outputs: [{ type: 'uint256' }],
		stateMutability: 'view',
		type: 'function'
	}
] as const;

/**
 * Get the OM balance for an address
 * @param address OM 0x address
 * @param network Network name or chain ID
 * @returns Balance in wei and om
 */
export async function getBalance(address: string, network = DEFAULT_NETWORK): Promise<{ wei: bigint; om: string }> {
	const validatedAddress = services.helpers.validateAddress(address);

	const client = getPublicClient(network);
	const balance = await client.getBalance({ address: validatedAddress });

	return {
		wei: balance,
		om: formatEther(balance)
	};
}

/**
 * Get the balance of an ERC20 token for an address
 * @param tokenAddress Token contract address
 * @param ownerAddress Owner address
 * @param network Network name or chain ID
 * @returns Token balance with formatting information
 */
export async function getERC20Balance(
	tokenAddress: string,
	ownerAddress: string,
	network = DEFAULT_NETWORK
): Promise<{
	raw: bigint;
	formatted: string;
	token: {
		symbol: string;
		decimals: number;
	};
}> {
	const validatedTokenAddress = services.helpers.validateAddress(tokenAddress);
	const validatedOwnerAddress = services.helpers.validateAddress(ownerAddress);

	const publicClient = getPublicClient(network);

	const contract = getContract({
		address: validatedTokenAddress,
		abi: erc20Abi,
		client: publicClient
	});

	const [balance, symbol, decimals] = await Promise.all([contract.read.balanceOf([validatedOwnerAddress]), contract.read.symbol(), contract.read.decimals()]);

	return {
		raw: balance,
		formatted: formatUnits(balance, decimals),
		token: {
			symbol,
			decimals
		}
	};
}

/**
 * Get the number of NFTs owned by an address for a specific collection
 * @param tokenAddress NFT contract address
 * @param ownerAddress Owner address
 * @param network Network name or chain ID
 * @returns Number of NFTs owned
 */
export async function getERC721Balance(tokenAddress: string, ownerAddress: string, network = DEFAULT_NETWORK): Promise<bigint> {
	const validatedTokenAddress = services.helpers.validateAddress(tokenAddress);
	const validatedOwnerAddress = services.helpers.validateAddress(ownerAddress);

	return (await readContract(
		{
			address: validatedTokenAddress,
			abi: erc721Abi,
			functionName: 'balanceOf',
			args: [validatedOwnerAddress]
		},
		network
	)) as Promise<bigint>;
}

/**
 * Get the balance of an ERC1155 token for an address
 * @param tokenAddress ERC1155 contract address
 * @param ownerAddress Owner address
 * @param tokenId Token ID to check
 * @param network Network name or chain ID
 * @returns Token balance
 */
export async function getERC1155Balance(tokenAddress: string, ownerAddress: string, tokenId: bigint, network = DEFAULT_NETWORK): Promise<bigint> {
	const validatedTokenAddress = services.helpers.validateAddress(tokenAddress);
	const validatedOwnerAddress = services.helpers.validateAddress(ownerAddress);

	return (await readContract(
		{
			address: validatedTokenAddress,
			abi: erc1155Abi,
			functionName: 'balanceOf',
			args: [validatedOwnerAddress, tokenId]
		},
		network
	)) as Promise<bigint>;
}
