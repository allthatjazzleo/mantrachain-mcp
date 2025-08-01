import type { Block, Hash } from 'viem';
import { DEFAULT_NETWORK } from '../config.js';
import { getPublicClient } from './clients.js';

/**
 * Get a block by number for a specific network
 */
export async function getBlockByNumber(blockNumber?: number, network = DEFAULT_NETWORK): Promise<Block> {
	const client = getPublicClient(network);
	return await client.getBlock(blockNumber !== undefined ? { blockNumber: BigInt(blockNumber) } : {});
}

/**
 * Get a block by hash for a specific network
 */
export async function getBlockByHash(blockHash: Hash, network = DEFAULT_NETWORK): Promise<Block> {
	const client = getPublicClient(network);
	return await client.getBlock({ blockHash });
}

/**
 * Get the latest block for a specific network
 */
export async function getLatestBlock(network = DEFAULT_NETWORK): Promise<Block> {
	const client = getPublicClient(network);
	return await client.getBlock();
}
