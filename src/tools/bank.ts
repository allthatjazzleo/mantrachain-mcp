import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { Address, Hash, Hex } from 'viem';
import { MantraClient } from '../mantra-client.js';
import * as services from '../evm-services/index.js';
import { networks } from '../config.js';
import { convertBigIntToString } from '../utils.js';

export function registerBankTools(server: McpServer, mantraClient: MantraClient) {
  // Define bank send tool
  server.tool(
    "bank-send",
    "Send tokens to another address. Supports sending multiple coins in one transaction.",
    {
      recipientAddress: z.string().describe("Address of the recipient, e.g., 'mantra1...'"),
      coins: z.array(
        z.object({
          denom: z.string().optional(),
          amount: z.string()
        })
      ).or(
        z.object({
          denom: z.string().optional(),
          amount: z.string()
        })
      ).describe("Array of coins to send, each with denom and amount"),
      networkName: z.string().refine(val => Object.keys(networks).includes(val), {
        message: "Must be a valid network name"
      }).describe("Name of the network to use - must first check what networks are available by accessing the networks resource `networks://all` before you pass this arguments. Defaults to `mantra-dukong-1` testnet."),
      memo: z.string().optional().describe("Optional memo for the transaction"),
    },
    async ({ recipientAddress, coins, networkName, memo }) => {
      await mantraClient.initialize(networkName);
      
      // Use network default denom if not provided
      const networkConfig = networks[networkName];
      const defaultDenom = networkConfig.denom;
      
      // Convert single coin to array for consistent processing
      const coinArray = Array.isArray(coins) ? coins : [coins];
      
      // Add default denom if not specified
      const processedCoins = coinArray.map(coin => ({
        denom: coin.denom || defaultDenom,
        amount: coin.amount
      }));
      
      // Send the tokens
      const result = await mantraClient.sendTokens({
        recipientAddress,
        coins: processedCoins,
        memo
      });
      
      return {
        content: [{type: "text", text: JSON.stringify(result)}],
      };
    }
  );

  // Define get balance tool
  server.tool(
    "get-balance",
    "Get balance of an address (defaults to your own address if none provided)",
    {
      address: z.string().optional().describe("Optional address to get balance for, defaults to current address"),
      networkName: z.string().refine(val => Object.keys(networks).includes(val), {
        message: "Must be a valid network name"
      }).describe("Name of the network to use - must first check what networks are available by accessing the networks resource `networks://all` before you pass this arguments. Defaults to `mantra-dukong-1` testnet."),
    },
    async ({ address, networkName }) => {
      await mantraClient.initialize(networkName);
      const balance = await mantraClient.getBalance(address);
      return {
        content: [{type: "text", text: JSON.stringify(balance)}],
      };
    }
  );

	// Get OM balance
	server.tool(
		'get_evm_balance',
		'Get the native token balance (OM) for an address (defaults to your own address if none provided)',
		{
			address: z.string().describe("The optional wallet address name (e.g., '0x1234...') to check the balance for, defaults to current address"),
      networkName: z.string().refine(val => Object.keys(networks).includes(val), {
        message: "Must be a valid network name"
      }).describe("Name of the network to use - must first check what networks are available by accessing the networks resource `networks://all` before you pass this arguments. Defaults to `mantra-dukong-1` testnet."),
		},
		async ({ address, networkName }) => {
			try {
				const balance = await services.getBalance(address, networkName);

				return {
					content: [{type: "text", text: JSON.stringify(convertBigIntToString(balance))}],
				};
			} catch (error) {
				return {
					content: [
						{
							type: 'text',
							text: `Error fetching balance: ${error instanceof Error ? error.message : String(error)}`
						}
					],
					isError: true
				};
			}
		}
	);

	// Get ERC20 token balance
	server.tool(
		'get_token_balance',
		'Get the balance of an ERC20 token for an address',
		{
			tokenAddress: z.string().describe("The contract address name of the ERC20 token (e.g., '0x3894085Ef7Ff0f0aeDf52E2A2704928d1Ec074F1')"),
			ownerAddress: z.string().describe("The wallet address name to check the balance for (e.g., '0x1234...')"),
      networkName: z.string().refine(val => Object.keys(networks).includes(val), {
        message: "Must be a valid network name"
      }).describe("Name of the network to use - must first check what networks are available by accessing the networks resource `networks://all` before you pass this arguments. Defaults to `mantra-dukong-1` testnet."),
		},
		async ({ tokenAddress, ownerAddress, networkName }) => {
			try {
				const balance = await services.getERC20Balance(tokenAddress, ownerAddress, networkName);

				return {
					content: [
						{
							type: 'text',
							text: JSON.stringify(
								{
									tokenAddress,
									owner: ownerAddress,
									network: networkName,
									raw: balance.raw.toString(),
									formatted: balance.formatted,
									symbol: balance.token.symbol,
									decimals: balance.token.decimals
								},
								null,
								2
							)
						}
					]
				};
			} catch (error) {
				return {
					content: [
						{
							type: 'text',
							text: `Error fetching token balance: ${error instanceof Error ? error.message : String(error)}`
						}
					],
					isError: true
				};
			}
		}
	);

	// Add tool for getting ERC721 NFT balance
	server.tool(
		'get_nft_balance',
		'Get the total number of ERC721 NFTs owned by an address from a specific collection. This returns the count of NFTs, not individual token IDs.',
		{
			tokenAddress: z.string().describe("The contract address of the NFT collection (e.g., '0x5B6D32f2B55b62da7a8cd553857EB6Dc26bFDC63')"),
			ownerAddress: z.string().describe("The wallet address to check the NFT balance for (e.g., '0x1234...')"),
      networkName: z.string().refine(val => Object.keys(networks).includes(val), {
        message: "Must be a valid network name"
      }).describe("Name of the network to use - must first check what networks are available by accessing the networks resource `networks://all` before you pass this arguments. Defaults to `mantra-dukong-1` testnet."),
		},
		async ({ tokenAddress, ownerAddress, networkName }) => {
			try {
				const balance = await services.getERC721Balance(tokenAddress as Address, ownerAddress as Address, networkName);

				return {
					content: [
						{
							type: 'text',
							text: JSON.stringify(
								{
									collection: tokenAddress,
									owner: ownerAddress,
									network: networkName,
									balance: balance.toString()
								},
								null,
								2
							)
						}
					]
				};
			} catch (error) {
				return {
					content: [
						{
							type: 'text',
							text: `Error fetching NFT balance: ${error instanceof Error ? error.message : String(error)}`
						}
					],
					isError: true
				};
			}
		}
	);

	// Add tool for getting ERC1155 token balance
	server.tool(
		'get_erc1155_balance',
		'Get the balance of a specific ERC1155 token ID owned by an address. ERC1155 allows multiple tokens of the same ID, so the balance can be greater than 1.',
		{
			tokenAddress: z.string().describe("The contract address of the ERC1155 token collection (e.g., '0x5B6D32f2B55b62da7a8cd553857EB6Dc26bFDC63')"),
			tokenId: z.string().describe("The ID of the specific token to check the balance for (e.g., '1234')"),
			ownerAddress: z.string().describe("The wallet address to check the token balance for (e.g., '0x1234...')"),
      networkName: z.string().refine(val => Object.keys(networks).includes(val), {
        message: "Must be a valid network name"
      }).describe("Name of the network to use - must first check what networks are available by accessing the networks resource `networks://all` before you pass this arguments. Defaults to `mantra-dukong-1` testnet."),
		},
		async ({ tokenAddress, tokenId, ownerAddress, networkName }) => {
			try {
				const balance = await services.getERC1155Balance(tokenAddress as Address, ownerAddress as Address, BigInt(tokenId), networkName);

				return {
					content: [
						{
							type: 'text',
							text: JSON.stringify(
								{
									contract: tokenAddress,
									tokenId,
									owner: ownerAddress,
									network: networkName,
									balance: balance.toString()
								},
								null,
								2
							)
						}
					]
				};
			} catch (error) {
				return {
					content: [
						{
							type: 'text',
							text: `Error fetching ERC1155 token balance: ${error instanceof Error ? error.message : String(error)}`
						}
					],
					isError: true
				};
			}
		}
	);

	// Get address from mnemonic
	server.tool(
		'get_address_from_mnemonic',
		'Get the EVM address derived from a mnemonic phrase',
		{}, // Schema is empty as mnemonic parameter was removed
		async () => {
			// Handler function starts here
			try {
				const address = await services.getAddressFromProvider();

				return {
					content: [
						{
							type: 'text',
							text: JSON.stringify(
								{
									address
									// Do not return the private key in the response.
								},
								null,
								2
							)
						}
					]
				};
			} catch (error) {
				return {
					content: [
						{
							type: 'text',
							text: `Error deriving address from private key: ${error instanceof Error ? error.message : String(error)}`
						}
					],
					isError: true
				};
			}
		}
	);

}
