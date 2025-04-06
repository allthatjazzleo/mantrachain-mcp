# MantraChain MCP Server

A Model Context Protocol (MCP) server for interacting with MantraChain (Cosmos SDK) blockchain. This server provides tools for sending tokens, delegating to validators, querying balances, and more using the MCP protocol.

## Features

- Send tokens to other addresses (bank send)
- Delegate tokens to validators (staking)
- Query account balances
- Get validator information
- Sign and broadcast arbitrary transactions
- Configure mnemonic and network via environment variables
- Choose between Dukong testnet and Mainnet

## Available Tools

### Bank Operations
- **bank-send**: Send tokens to another address
- **get-balance**: Get balance of an address (defaults to your own address if none provided)

### Staking Operations
- **delegate**: Delegate/Stake tokens to a validator
- **undelegate**: Undelegate/Unstake tokens from a validator
- **claim-rewards**: Claim rewards for a specific validator
- **get-validators**: Get all validators
- **get-delegations**: Get current staking information for an address
- **get-available-rewards**: Get all available rewards for an address

### Network Operations
- **get-account-info**: Get current account information
- **get-block-info**: Get block information
- **query-network**: Execute a generic network query against chain APIs

### IBC Operations
- **ibc-transfer**: Send tokens via IBC transfer

### Smart Contract Operations
- **contract-query**: Query a smart contract by executing a read-only function
- **contract-execute**: Execute a function on a smart contract that changes state

### DEX Operations
- **dex-get-pools**: Get all available liquidity pools from the DEX
- **dex-find-routes**: Find available swap routes between two tokens
- **dex-simulate-swap**: Simulate a token swap to get expected outcome without executing it
- **dex-swap**: Execute a token swap on the DEX with slippage protection

### Transaction Operations
- **sign-and-broadcast**: Sign and broadcast a generic transaction

## Available Resources

- **networks://all**: JSON resource showing all available networks with their configuration
- **openapi://{networkName}**: OpenAPI/Swagger specification for the specified network

## MCP Configuration

### To integrate with MCP client applications, add the server configuration to your MCP client configuration file:

```json
{
  "mcpServers": {
    "mantrachain-mcp": {
      "command": "npx",
      "args": [
        "-y",
        "mantrachain-mcp@latest"
      ],
      "env": {
        "MNEMONIC": "YOUR_MNEMONIC",
        "CUSTOM_NETWORKS": "{\"my-custom-net\":{\"rpcEndpoint\":\"https://rpc.custom-network.io\",\"apiEndpoint\":\"https://api.custom-network.io\",\"chainId\":\"my-custom-net-1\",\"prefix\":\"custom\",\"denom\":\"ucustom\",\"gasPrice\":\"0.01\",\"isMainnet\":false}}"
      }
    }
  }
}
```

### If you build the package locally instead of globally

After building the package, you can run it directly from the build directory. Make sure to replace `your_path` with the actual path to your build directory.
```bash
npm run build
```

Then, you can use the following configuration:

```json
{
  "mcpServers": {
    "mantrachain-mcp": {
      "command": "node",
      "args": [
        "your_path/mantrachain-mcp/build/index.js"
      ],
      "env": {
        "MNEMONIC": "YOUR_MNEMONIC"
      }
    }
  }
}
```

## Environment Variables

- **MNEMONIC**: Required. The mnemonic seed phrase for the wallet to use.
- **CUSTOM_NETWORKS**: Optional. JSON string containing additional network configurations.
