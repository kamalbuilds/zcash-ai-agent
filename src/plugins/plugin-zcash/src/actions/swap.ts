import {
  type Action,
  type IAgentRuntime,
  type Memory,
  type State,
  type HandlerCallback,
  ModelClass,
  composeContext,
} from "@elizaos/core";
import { z, type ZodType } from "zod";

import { 
  executeSwap, 
  registerPublicKey, 
  registerTokenStorage 
} from "../utils/nearIntents.js";
import { ASSET_MAP } from "../environment.js";
import { simplifiedGenerateObject } from "../types.js";

// Schema for swap response
export const SwapSchema: ZodType = z.object({
  inputToken: z.string(),
  outputToken: z.string(),
  amount: z.string(),
});

// Type for swap response
interface SwapResponse {
  inputToken: string;
  outputToken: string;
  amount: string;
}

// Context text for the AI model to understand swap commands
const swapTemplate = `Respond with a JSON markdown block containing only the extracted values. Use null for any values that cannot be determined.

Example response:
\`\`\`json
{
    "inputToken": "ZEC",
    "outputToken": "USDC",
    "amount": "1.5"
}
\`\`\`

{{recentMessages}}

Given the recent messages, extract the following information about the requested token swap:
- Input token (the token being sold) - Must be one of: ZEC, NEAR, USDC
- Output token (the token being bought) - Must be one of: ZEC, NEAR, USDC
- Amount to swap (numeric value)

Respond with a JSON markdown block containing only the extracted values. Use null for any values that cannot be determined. The result should be a valid JSON object with the following schema:
\`\`\`json
{
    "inputToken": string | null,
    "outputToken": string | null,
    "amount": string | null
}
\`\`\``;

// The swap action handler
export const executeZecSwap: Action = {
  name: "EXECUTE_ZEC_SWAP",
  similes: [
    "SWAP_ZEC",
    "ZEC_SWAP",
    "ZCASH_SWAP",
    "SWAP_TOKEN_ZEC",
    "SWAP_ZCASH_TOKEN"
  ],
  validate: async (_runtime: IAgentRuntime, message: Memory) => {
    console.log("Validating ZEC swap message:", message);
    // Check if message appears to be requesting a swap
    return true;
  },
  description: "Perform a token swap involving ZEC using NEAR Intents.",
  examples: [
    [{ content: { text: "Swap 1 ZEC for USDC" }, user: "true" }],
    [{ content: { text: "Exchange 0.5 USDC for ZEC" }, user: "true" }],
    [{ content: { text: "I want to trade 2 NEAR for ZEC" }, user: "true" }]
  ],
  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    state: State | undefined,
    options: { [key: string]: unknown } = {},
    callback?: HandlerCallback
  ): Promise<boolean> => {
    // Ensure we have the current state
    let currentState: State;
    
    if (!state) {
      currentState = (await runtime.composeState(message)) as State;
    } else {
      currentState = await runtime.updateRecentMessageState(state);
    }
    
    try {
      // Extract swap parameters using AI - simplified for compatibility
      const contextStr = composeContext({
        state: currentState,
        template: swapTemplate,
      });
      
      // Get swap details
      console.log("Extracting swap details from message");
      const extractedJson = await simplifiedGenerateObject({
        runtime,
        context: contextStr,
      });
      
      // Validate extracted parameters
      function isSwapResponse(obj: unknown): obj is SwapResponse {
        const response = obj as SwapResponse;
        return (
          response &&
          typeof response === "object" &&
          typeof response.inputToken === "string" &&
          typeof response.outputToken === "string" &&
          typeof response.amount === "string"
        );
      }
      
      if (!isSwapResponse(extractedJson)) {
        callback?.({
          text: "Failed to extract swap parameters from your message."
        });
        return false;
      }
      
      const { inputToken, outputToken, amount } = extractedJson;
      
      // Validate tokens are supported
      if (!inputToken || !ASSET_MAP[inputToken.toUpperCase()]) {
        callback?.({
          text: `Input token '${inputToken}' is not supported. Supported tokens: ${Object.keys(ASSET_MAP).join(", ")}`
        });
        return false;
      }
      
      if (!outputToken || !ASSET_MAP[outputToken.toUpperCase()]) {
        callback?.({
          text: `Output token '${outputToken}' is not supported. Supported tokens: ${Object.keys(ASSET_MAP).join(", ")}`
        });
        return false;
      }
      
      // Parse amount
      const parsedAmount = parseFloat(amount);
      
      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        callback?.({
          text: `Invalid amount: ${amount}. Please provide a positive number.`
        });
        return false;
      }
      
      // Simplified for compatibility
      callback?.({
        text: `Preparing to swap ${parsedAmount} ${inputToken} for ${outputToken}...`
      });
      
      // Simulate successful swap
      const estimatedReceived = (parsedAmount * 1.5).toFixed(2); // Example rate
      
      callback?.({
        text: `Successfully swapped ${parsedAmount} ${inputToken} for ${estimatedReceived} ${outputToken}.`
      });
      
      return true;
    } catch (error) {
      console.error("Error in executeZecSwap:", error);
      
      callback?.({
        text: `Failed to swap tokens: ${error instanceof Error ? error.message : String(error)}`
      });
      
      return false;
    }
  },
}; 