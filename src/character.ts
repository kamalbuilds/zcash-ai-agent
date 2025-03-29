import { Character, Clients, defaultCharacter, ModelProviderName } from "@elizaos/core";
import * as fs from 'fs';
import * as path from 'path';

// Load the Zcash agent configuration from zcash-agent.json
const zcashAgentPath = path.join(process.cwd(), 'characters', 'zcash-agent.json');
const zcashAgentConfig = JSON.parse(fs.readFileSync(zcashAgentPath, 'utf8'));

// Use the ZEC Agent configuration with some defaults
export const character: Character = {
    ...defaultCharacter,
    name: "ZcashAgent",
    modelProvider: ModelProviderName.OPENAI,
    ...zcashAgentConfig,
    // Override any specific settings here if needed
    settings: {
        ...zcashAgentConfig.settings,
        secrets: {
            ...zcashAgentConfig.settings.secrets,
            // Set the correct NEAR wallet information from .env file
            NEAR_ADDRESS: process.env.NEAR_ADDRESS || "kamalwillwin.near",
            NEAR_WALLET_SECRET_KEY: process.env.NEAR_WALLET_SECRET_KEY || "",
            NEAR_NETWORK: process.env.NEAR_NETWORK || "mainnet",
            NEAR_RPC_URL: process.env.NEAR_RPC_URL || "https://rpc.mainnet.near.org"
        }
    },
    // Only include the Zcash plugin for now
    plugins: [
        "./src/plugins/plugin-zcash/dist/index.js"
    ]
};
