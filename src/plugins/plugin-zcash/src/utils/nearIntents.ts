import { 
  getAssetId, 
  toDecimals, 
  ASSET_MAP, 
  SOLVER_BUS_URL, 
  MAX_GAS 
} from "../environment.js";

// We'll need these from the NEAR JS libraries
import { base58 } from "base58";
import base64 from "base64-js";

// Define the interfaces for our intent operations
interface Intent {
  intent: string;
  diff: Record<string, string>;
}

interface Quote {
  nonce: string;
  signer_id: string;
  verifying_contract: string;
  deadline: string;
  intents: Intent[];
}

interface Commitment {
  standard: string;
  payload: string;
  signature: string;
  public_key: string;
}

interface PublishIntent {
  signed_data: Commitment;
  quote_hashes: string[];
}

interface IntentRequestConfig {
  asset_in: string;
  amount_in: string;
  asset_out: string;
  amount_out?: string;
  min_deadline_ms?: number;
}

/**
 * Creates a quote for a token swap intent
 * 
 * @param account NEAR account instance
 * @param token_in Input token symbol (e.g., 'ZEC')
 * @param amount_in Amount of input token
 * @param token_out Output token symbol (e.g., 'USDC')
 * @param amount_out Expected amount of output token
 * @returns Signed commitment object
 */
export async function createTokenDiffQuote(
  account: any,
  token_in: string,
  amount_in: number,
  token_out: string,
  amount_out: number
): Promise<Commitment> {
  // Generate a random nonce
  const nonce = generateNonce();
  
  // Create the quote with proper token identifiers
  const quote: Quote = {
    nonce,
    signer_id: account.accountId,
    verifying_contract: 'intents.near',
    deadline: (Date.now() + 120000).toString(), // 2 minutes from now
    intents: [
      {
        intent: 'token_diff',
        diff: {
          [getAssetId(token_in)]: `-${toDecimals(amount_in, ASSET_MAP[token_in].decimals)}`,
          [getAssetId(token_out)]: toDecimals(amount_out, ASSET_MAP[token_out].decimals)
        }
      }
    ]
  };
  
  // Sign and return the quote
  return signQuote(account, JSON.stringify(quote));
}

/**
 * Generates a random nonce for intents
 */
function generateNonce(): string {
  const randomBytes = new Uint8Array(32);
  crypto.getRandomValues(randomBytes);
  return base64.fromByteArray(randomBytes);
}

/**
 * Signs a quote with the account's private key
 */
async function signQuote(account: any, quote: string): Promise<Commitment> {
  const quoteData = new TextEncoder().encode(quote);
  const signature = await account.connection.signer.signMessage(
    quoteData,
    account.accountId,
    account.connection.networkId
  );
  
  const signatureStr = 'ed25519:' + base58.encode(Buffer.from(signature.signature));
  const publicKeyStr = 'ed25519:' + base58.encode(Buffer.from(signature.publicKey.data));
  
  return {
    standard: "raw_ed25519",
    payload: quote,
    signature: signatureStr,
    public_key: publicKeyStr
  };
}

/**
 * Creates an intent request object for the solver bus
 */
export function createIntentRequest(config: IntentRequestConfig): Record<string, any> {
  const message: Record<string, any> = {
    defuse_asset_identifier_in: config.asset_in,
    defuse_asset_identifier_out: config.asset_out,
    exact_amount_in: config.amount_in,
    min_deadline_ms: config.min_deadline_ms || 120000
  };
  
  if (config.amount_out) {
    message.exact_amount_out = config.amount_out;
  }
  
  return message;
}

/**
 * Fetches trading options from the solver bus
 */
export async function fetchOptions(request: Record<string, any>): Promise<any[]> {
  const rpcRequest = {
    id: "dontcare",
    jsonrpc: "2.0",
    method: "quote",
    params: [request]
  };
  
  try {
    const response = await fetch(SOLVER_BUS_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(rpcRequest)
    });
    
    const responseJson = await response.json();
    return responseJson.result || [];
  } catch (error) {
    console.error("Error fetching options from solver bus:", error);
    return [];
  }
}

/**
 * Selects the best option from the list of options
 */
export function selectBestOption(options: any[]): any | null {
  if (!options || options.length === 0) {
    console.warn("No options available from solver bus");
    return null;
  }
  
  let bestOption = null;
  for (const option of options) {
    if (!bestOption || parseFloat(option.amount_out || 0) > parseFloat(bestOption.amount_out || 0)) {
      bestOption = option;
    }
  }
  
  return bestOption;
}

/**
 * Publishes a signed intent to the solver bus
 */
export async function publishIntent(signedIntent: PublishIntent): Promise<any> {
  const rpcRequest = {
    id: "dontcare",
    jsonrpc: "2.0",
    method: "publish_intent",
    params: [signedIntent]
  };
  
  try {
    const response = await fetch(SOLVER_BUS_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(rpcRequest)
    });
    
    return await response.json();
  } catch (error) {
    console.error("Error publishing intent to solver bus:", error);
    throw error;
  }
}

/**
 * Executes a swap of tokens using NEAR intents
 */
export async function executeSwap(
  account: any,
  token_in: string,
  amount_in: number,
  token_out: string
): Promise<any> {
  // Create intent request and fetch options
  const assetIn = getAssetId(token_in);
  const assetOut = getAssetId(token_out);
  const amountInDecimals = toDecimals(amount_in, ASSET_MAP[token_in].decimals);
  
  const request = createIntentRequest({
    asset_in: assetIn,
    amount_in: amountInDecimals,
    asset_out: assetOut
  });
  
  // Fetch and select best option
  const options = await fetchOptions(request);
  const bestOption = selectBestOption(options);
  
  if (!bestOption) {
    throw new Error("No valid swap options available from solver bus");
  }
  
  // Create quote for the swap
  const quote = await createTokenDiffQuote(
    account,
    token_in,
    amount_in,
    token_out,
    parseFloat(bestOption.amount_out)
  );
  
  // Create signed intent
  const signedIntent = {
    signed_data: quote,
    quote_hashes: [bestOption.quote_hash]
  };
  
  // Publish the signed intent
  return await publishIntent(signedIntent);
}

/**
 * Submits a signed intent to the intents contract
 */
export async function submitSignedIntent(account: any, signedIntent: any): Promise<any> {
  try {
    const result = await account.functionCall({
      contractId: "intents.near",
      methodName: "execute_intents",
      args: signedIntent,
      gas: MAX_GAS,
      attachedDeposit: "0"
    });
    
    return result;
  } catch (error) {
    console.error("Error submitting signed intent:", error);
    throw error;
  }
}

/**
 * Deposits tokens into the intents contract
 */
export async function depositToIntents(account: any, token: string, amount: number): Promise<any> {
  try {
    const amountRaw = toDecimals(amount, ASSET_MAP[token].decimals);
    
    if (token === 'NEAR') {
      // For NEAR token, we need to wrap it first
      console.log(`Depositing ${amount} NEAR (raw amount: ${amountRaw})`);
      console.log("Wrapping NEAR before deposit");
      
      await account.functionCall({
        contractId: 'wrap.near',
        methodName: 'near_deposit',
        args: {},
        gas: MAX_GAS,
        attachedDeposit: amountRaw
      });
      
      return await account.functionCall({
        contractId: 'wrap.near',
        methodName: 'ft_transfer_call',
        args: {
          receiver_id: "intents.near",
          amount: amountRaw,
          msg: ""
        },
        gas: MAX_GAS,
        attachedDeposit: "1"
      });
    } else {
      // For other tokens, transfer directly
      console.log(`Depositing ${amount} ${token} (raw amount: ${amountRaw})`);
      
      return await account.functionCall({
        contractId: ASSET_MAP[token].token_id,
        methodName: 'ft_transfer_call',
        args: {
          receiver_id: "intents.near",
          amount: amountRaw,
          msg: ""
        },
        gas: MAX_GAS,
        attachedDeposit: "1"
      });
    }
  } catch (error) {
    console.error(`Error depositing ${token}:`, error);
    throw error;
  }
}

/**
 * Registers the account's public key with the intents contract
 */
export async function registerPublicKey(account: any): Promise<any> {
  try {
    const publicKey = await account.connection.signer.getPublicKey(
      account.accountId,
      account.connection.networkId
    );
    
    return await account.functionCall({
      contractId: "intents.near",
      methodName: "add_public_key",
      args: {
        public_key: publicKey.toString()
      },
      gas: MAX_GAS,
      attachedDeposit: "1"
    });
  } catch (error) {
    console.error("Error registering public key:", error);
    throw error;
  }
}

/**
 * Registers token storage for the account
 */
export async function registerTokenStorage(account: any, token: string, otherAccount?: string): Promise<any> {
  try {
    const accountId = otherAccount || account.accountId;
    
    const balance = await account.viewFunction({
      contractId: ASSET_MAP[token].token_id,
      methodName: 'storage_balance_of',
      args: { account_id: accountId }
    });
    
    if (!balance) {
      console.log(`Registering ${accountId} for ${token} storage`);
      
      return await account.functionCall({
        contractId: ASSET_MAP[token].token_id,
        methodName: 'storage_deposit',
        args: { account_id: accountId },
        gas: MAX_GAS,
        attachedDeposit: "1250000000000000000000"
      });
    }
    
    return balance;
  } catch (error) {
    console.error(`Error registering token storage for ${token}:`, error);
    throw error;
  }
} 