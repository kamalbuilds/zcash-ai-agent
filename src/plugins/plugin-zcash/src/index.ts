import type { Plugin } from "@elizaos/core";
import { walletProvider } from "./providers/wallet.js";
import { executeZecSwap } from "./actions/swap.js";
import { executeZecDeposit } from "./actions/deposit.js";
import { checkZecBalance } from "./actions/balance.js";

/**
 * ZcashPlugin for Eliza
 * 
 * This plugin provides capabilities for managing ZEC balances, trading ZEC,
 * and interacting with the NEAR intents system for decentralized exchanges.
 */
export const zcashPlugin: Plugin = {
  name: "ZcashPlugin",
  description: "Zcash integration for autonomous agents to store, trade, and manage ZEC balances",
  providers: [walletProvider],
  actions: [executeZecSwap, executeZecDeposit, checkZecBalance],
  evaluators: [],
};

export default zcashPlugin; 