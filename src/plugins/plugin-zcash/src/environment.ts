/**
 * Environment configuration for the Zcash plugin.
 * This file defines settings and constants used throughout the plugin.
 */

import type { IAgentRuntime } from "@elizaos/core";

// Constants for the NEAR protocol integration
export const SOLVER_BUS_URL = "https://solver-relay-v2.chaindefuser.com/rpc";
export const MAX_GAS = 300 * 10 ** 12;

// Asset mapping for tokens
export const ASSET_MAP: Record<string, { token_id: string; decimals: number; symbol: string; omft?: string }> = {
  'ZEC': {
    'token_id': 'zec-token.near',  // This would be the actual ZEC token ID on NEAR
    'decimals': 8,
    'symbol': 'ZEC'
  },
  'USDC': { 
    'token_id': 'a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48.factory.bridge.near',
    'omft': 'eth-0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48.omft.near',
    'decimals': 6,
    'symbol': 'USDC'
  },
  'NEAR': {
    'token_id': 'wrap.near',
    'decimals': 24,
    'symbol': 'NEAR'
  }
};

// Required settings for Zcash and NEAR operations
export const REQUIRED_SETTINGS = [
  "NEAR_ADDRESS",
  "NEAR_WALLET_SECRET_KEY",
  "NEAR_NETWORK",
  "NEAR_RPC_URL",
  "SLIPPAGE_TOLERANCE"
];

// Default settings if not provided
export const DEFAULT_SETTINGS = {
  NEAR_NETWORK: "mainnet",
  NEAR_RPC_URL: "https://rpc.mainnet.near.org",
  SLIPPAGE_TOLERANCE: "0.01"
};

/**
 * Helper function to check if all required settings are available
 */
export function checkRequiredSettings(runtime: IAgentRuntime): boolean {
  const missingSettings = REQUIRED_SETTINGS.filter(
    setting => !runtime.getSetting(setting)
  );

  if (missingSettings.length > 0) {
    console.warn(`Missing required settings: ${missingSettings.join(", ")}`);
    return false;
  }

  return true;
}

/**
 * Applies default settings if they are not set
 */
export function applyDefaultSettings(runtime: IAgentRuntime): void {
  for (const [key, value] of Object.entries(DEFAULT_SETTINGS)) {
    if (!runtime.getSetting(key)) {
      // Update the character's settings through runtime
      if (runtime.character && runtime.character.settings && runtime.character.settings.secrets) {
        runtime.character.settings.secrets[key] = value;
      }
    }
  }
}

/**
 * Converts an amount to its decimal representation based on token decimals
 */
export function toDecimals(amount: number, decimals: number): string {
  return (amount * 10 ** decimals).toString();
}

/**
 * Converts a raw amount from its decimal representation to a human-readable format
 */
export function fromDecimals(rawAmount: string, decimals: number): number {
  return parseFloat(rawAmount) / 10 ** decimals;
}

/**
 * Gets the asset identifier in the format expected by the solver bus
 */
export function getAssetId(token: string): string {
  if (token === 'NEAR') {
    return 'near';  // Native NEAR token
  } else if (token === 'USDC') {
    return 'nep141:a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48.factory.bridge.near';  // USDC on NEAR
  } else if (token === 'ZEC' && token in ASSET_MAP) {
    return `nep141:${ASSET_MAP[token].token_id}`;  // ZEC token on NEAR
  }
  
  // Default case for other tokens
  if (token in ASSET_MAP) {
    return `nep141:${ASSET_MAP[token].token_id}`;
  }
  
  return `nep141:${token}`;
} 