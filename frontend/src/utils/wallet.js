import { StellarWalletsKit } from "@creit.tech/stellar-wallets-kit";
import { FreighterModule } from "@creit.tech/stellar-wallets-kit/modules/freighter";
import { AlbedoModule } from "@creit.tech/stellar-wallets-kit/modules/albedo";

export const initWalletKit = () => {
  StellarWalletsKit.init({
    modules: [
      new FreighterModule(),
      new AlbedoModule()
    ],
    network: "testnet"
  });
};

export const connectWallet = async () => {
  try {
    const { address } = await StellarWalletsKit.authModal();
    return address;
  } catch (error) {
    console.error("Wallet connection failed:", error);
    throw error;
  }
};

export const disconnectWallet = async () => {
  try {
    await StellarWalletsKit.disconnect();
  } catch (error) {
    console.error("Wallet disconnect failed:", error);
  }
};

export const signTx = async (xdr, userAddress) => {
  try {
    const networkPassphrase = "Test SDF Network ; September 2015";
    const { signedTxXdr } = await StellarWalletsKit.signTransaction(xdr, {
      networkPassphrase,
      address: userAddress
    });
    return signedTxXdr;
  } catch (error) {
    console.error("Transaction signing failed:", error);
    throw error;
  }
};
