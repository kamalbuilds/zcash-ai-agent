import * as nearAPI from "near-api-js";
import type { IAgentRuntime, Memory, State } from "@elizaos/core";
import { checkRequiredSettings, applyDefaultSettings } from "../environment.js";

interface WalletInstance {
  account: any;
  connection: any;
}

/**
 * NEAR account provider for the Zcash plugin.
 * This provider manages NEAR account operations required for ZEC transactions.
 */
export const walletProvider = {
  name: "zcash-near-wallet", // Using name instead of id for compatibility
  description: "NEAR wallet provider for Zcash operations",
  initialize: async (runtime: IAgentRuntime): Promise<WalletInstance | null> => {
    try {
      // Apply default settings if not provided
      applyDefaultSettings(runtime);
      
      // Check if all required settings are present
      if (!checkRequiredSettings(runtime)) {
        console.error("Missing required settings for zcash-near-wallet provider");
        return null;
      }

      // Get NEAR account configuration
      const networkId = runtime.getSetting("NEAR_NETWORK") || "mainnet";
      const nodeUrl = runtime.getSetting("NEAR_RPC_URL") || "https://rpc.mainnet.near.org";
      const accountId = runtime.getSetting("NEAR_ADDRESS");
      const secretKey = runtime.getSetting("NEAR_WALLET_SECRET_KEY");

      if (!accountId || !secretKey) {
        console.error("Missing NEAR account credentials");
        return null;
      }

      // Set up the NEAR connection
      const keyStore = new nearAPI.keyStores.InMemoryKeyStore();
      // Use a type assertion to handle the KeyPairString type
      const keyPair = nearAPI.utils.KeyPair.fromString(secretKey);
      await keyStore.setKey(networkId, accountId, keyPair);

      const connection = await nearAPI.connect({
        networkId,
        keyStore,
        nodeUrl,
        headers: {},
      });

      // Get the account instance
      const account = await connection.account(accountId);

      // Validate that the account exists and is accessible
      try {
        await account.state();
        console.log(`Successfully connected to NEAR account: ${accountId}`);
      } catch (error) {
        console.error(`Failed to access NEAR account ${accountId}:`, error);
        return null;
      }

      return {
        account,
        connection,
      };
    } catch (error) {
      console.error("Error initializing zcash-near-wallet provider:", error);
      return null;
    }
  },
  get: async (runtime: IAgentRuntime, message: Memory, state?: State) => {
    // Simplified implementation for compatibility
    try {
      // Get a new instance each time (not optimal but works for compatibility)
      return await walletProvider.initialize(runtime);
    } catch (error) {
      console.error("Error getting wallet provider:", error);
      return null;
    }
  }
}; 