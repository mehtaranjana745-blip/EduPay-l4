import { Horizon } from "@stellar/stellar-sdk";

const HORIZON_URL = "https://horizon-testnet.stellar.org";
const server = new Horizon.Server(HORIZON_URL);

export const fundAccount = async (address) => {
  try {
    const response = await fetch(`https://friendbot.stellar.org/?addr=${address}`);
    if (!response.ok) {
      throw new Error("Friendbot funding failed");
    }
    return await response.json();
  } catch (error) {
    console.error("Error funding account via Friendbot:", error);
    throw error;
  }
};

export const checkBalance = async (address) => {
  try {
    const account = await server.loadAccount(address);
    const balance = account.balances.find((b) => b.asset_type === "native");
    return balance ? parseFloat(balance.balance) : 0;
  } catch (error) {
    // If account not found, it is uninitialized
    if (error.response && error.response.status === 404) {
      return 0;
    }
    console.error("Error fetching balance:", error);
    throw error;
  }
};
