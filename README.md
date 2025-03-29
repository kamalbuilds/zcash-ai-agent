# Zcash Plugin for Eliza

This plugin enables Eliza-based autonomous agents to manage ZEC balances, trade ZEC using NEAR intents, and handle other related cryptocurrency operations.

## Features

- Store and manage ZEC balances
- Execute swaps between ZEC and other tokens (USDC, NEAR)
- Deposit tokens to the intents contract for trading
- Check token balances

## Installation

To use this plugin in your Eliza project:

1. Install it to your project:

```bash
pnpm add @elizaos/plugin-zcash
```

2. Import and register it in your agent:

```typescript
import { zcashPlugin } from "@elizaos/plugin-zcash";

// Add to your character's plugins array
const character = {
  // ...
  plugins: [zcashPlugin],
  // ...
};
```

## Configuration

The plugin requires the following settings to be configured in your character's `settings.secrets` object:

```typescript
const character = {
  // ...
  settings: {
    secrets: {
      // Required settings
      NEAR_ADDRESS: "your-near-address.near",
      NEAR_WALLET_SECRET_KEY: "your-private-key", // ed25519 private key
      NEAR_NETWORK: "mainnet", // or "testnet"
      NEAR_RPC_URL: "https://rpc.mainnet.near.org", // or testnet URL
      SLIPPAGE_TOLERANCE: "0.01", // 1% slippage tolerance for swaps
    }
  }
  // ...
};
```

## Usage

Once the plugin is installed and configured, your agent can perform the following actions:

### Swap ZEC for other tokens

Users can instruct your agent to swap ZEC for other tokens with natural language:

```
Swap 1.5 ZEC for USDC please
```

### Deposit tokens

Users can instruct your agent to deposit tokens to the intents contract:

```
Deposit 2 ZEC to the intents contract
```

### Check token balances

Users can ask about token balances:

```
What's my ZEC balance?
```

or

```
Show me all my token balances
```

## Integration with NEAR Intents

This plugin leverages NEAR intents for decentralized token swaps. The NEAR intents architecture enables efficient, permission-less swapping across different tokens, providing a seamless experience for users.

## Development

To develop and build this plugin:

1. Clone the repository
2. Install dependencies: `pnpm install`
3. Build the plugin: `pnpm build`
4. Test it in your Eliza project

## License

MIT


## Edit the character files

Open `src/character.ts` to modify the default character. Uncomment and edit.

### Custom characters

To load custom characters instead:
- Use `pnpm start --characters="path/to/your/character.json"`
- Multiple character files can be loaded simultaneously

### Add clients
```
# in character.ts
clients: [Clients.TWITTER, Clients.DISCORD],

# in character.json
clients: ["twitter", "discord"]
```

## Duplicate the .env.example template

```bash
cp .env.example .env
```

\* Fill out the .env file with your own values.

### Add login credentials and keys to .env
```
DISCORD_APPLICATION_ID="discord-application-id"
DISCORD_API_TOKEN="discord-api-token"
...
OPENROUTER_API_KEY="sk-xx-xx-xxx"
...
TWITTER_USERNAME="username"
TWITTER_PASSWORD="password"
TWITTER_EMAIL="your@email.com"
```

## Install dependencies and start your agent

```bash
pnpm i && pnpm start
```
Note: this requires node to be at least version 22 when you install packages and run the agent.

## Run with Docker

### Build and run Docker Compose (For x86_64 architecture)

#### Edit the docker-compose.yaml file with your environment variables

```yaml
services:
    eliza:
        environment:
            - OPENROUTER_API_KEY=blahdeeblahblahblah
```

#### Run the image

```bash
docker compose up
```

### Build the image with Mac M-Series or aarch64

Make sure docker is running.

```bash
# The --load flag ensures the built image is available locally
docker buildx build --platform linux/amd64 -t eliza-starter:v1 --load .
```

#### Edit the docker-compose-image.yaml file with your environment variables

```yaml
services:
    eliza:
        environment:
            - OPENROUTER_API_KEY=blahdeeblahblahblah
```

#### Run the image

```bash
docker compose -f docker-compose-image.yaml up
```

# Deploy with Railway

[![Deploy on Railway](https://railway.com/button.svg)](https://railway.com/template/aW47_j)