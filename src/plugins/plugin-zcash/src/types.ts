import { IAgentRuntime, Memory, State } from "@elizaos/core";

/**
 * Custom Provider interface that matches the structure expected in the code
 */
export interface CustomProvider {
  id: string;
  description: string;
  initialize: (runtime: IAgentRuntime) => Promise<any>;
  get: (runtime: IAgentRuntime, message: Memory, state?: State) => Promise<any>;
}

/**
 * Extended Provider interface that matches what we access in the code
 */
export interface ExtendedProvider {
  id: string;
  data: any;
}

/**
 * Custom Action interface that matches the expected structure
 */
export interface ActionExample {
  content: {
    text: string;
  };
  user: string; // In our implementation we use "true" as string, not boolean
}

/**
 * Simple ModelClass enum for local use
 */
export enum CustomModelClass {
  Text = "text",
  Json = "json",
  Completion = "completion",
}

/**
 * Utility function to extract the right output type
 */
export function simplifiedGenerateObject(params: { 
  runtime: IAgentRuntime;
  context: string;
  modelClass?: string;
  schema?: any;
}) {
  // Simplified placeholder implementation
  // In a real implementation, this would parse the context and extract the values
  // But for compatibility we're just returning a mock object
  return {
    token: "ZEC",
    inputToken: "ZEC",
    outputToken: "USDC",
    amount: "1.0"
  };
} 