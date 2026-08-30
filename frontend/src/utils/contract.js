import { Account, Address, Contract, Networks, TransactionBuilder, rpc, scValToNative, xdr } from "@stellar/stellar-sdk";

export const CONTRACT_ID = "CA36B6GWEQKEFMYQR73HKEIBJPWSHH4TGO3VPBJ5PMVY4VK6WAIGBU3S";
const RPC_URL = "https://soroban-testnet.stellar.org";
const rpcServer = new rpc.Server(RPC_URL);

// Stellar Native Asset (XLM) uses 7 decimal places (1 XLM = 10,000,000 stroops)
export const STROOPS_PER_XLM = 10000000;

export function toI128ScVal(amount) {
  const cleanInt = BigInt(amount.toString());
  return xdr.ScVal.scvI128(
    new xdr.Int128Parts({
      lo: xdr.Uint64.fromString((cleanInt & 0xffffffffffffffffn).toString()),
      hi: xdr.Int64.fromString((cleanInt >> 64n).toString())
    })
  );
}

// Build, simulate, and prepare a create_payment transaction
export const createPaymentTx = async (studentAddress, paymentId, universityAddress, amountXlm, term) => {
  const contract = new Contract(CONTRACT_ID);
  const studentAcc = await rpcServer.getAccount(studentAddress);
  
  // Convert XLM to stroops (7 decimals) so real XLM tokens are transferred on-chain
  const amountStroops = BigInt(Math.floor(Number(amountXlm || 0) * STROOPS_PER_XLM));

  const paymentIdVal = xdr.ScVal.scvSymbol(paymentId);
  const studentVal = Address.fromString(studentAddress).toScVal();
  const universityVal = Address.fromString(universityAddress).toScVal();
  const amountVal = toI128ScVal(amountStroops);
  const termVal = xdr.ScVal.scvString(term);

  const tx = new TransactionBuilder(studentAcc, {
    fee: "1000",
    networkPassphrase: Networks.TESTNET
  })
  .addOperation(contract.call("create_payment", paymentIdVal, studentVal, universityVal, amountVal, termVal))
  .setTimeout(60)
  .build();

  const simulated = await rpcServer.simulateTransaction(tx);
  if (rpc.Api.isSimulationError(simulated)) {
    throw new Error(`Simulation failed: ${simulated.error}`);
  }

  const prep = rpc.assembleTransaction(tx, simulated).build();
  return prep.toXDR();
};

// Build, simulate, and prepare a deposit transaction
export const depositPaymentTx = async (studentAddress, paymentId, amount) => {
  const contract = new Contract(CONTRACT_ID);
  const studentAcc = await rpcServer.getAccount(studentAddress);

  // If amount is small (e.g. 50), convert to stroops; if already large, use as is
  let amountStroops;
  if (Number(amount) < 1000000) {
    amountStroops = BigInt(Math.floor(Number(amount) * STROOPS_PER_XLM));
  } else {
    amountStroops = BigInt(amount.toString());
  }

  const paymentIdVal = xdr.ScVal.scvSymbol(paymentId);
  const amountVal = toI128ScVal(amountStroops);

  const tx = new TransactionBuilder(studentAcc, {
    fee: "1000",
    networkPassphrase: Networks.TESTNET
  })
  .addOperation(contract.call("deposit", paymentIdVal, amountVal))
  .setTimeout(60)
  .build();

  const simulated = await rpcServer.simulateTransaction(tx);
  if (rpc.Api.isSimulationError(simulated)) {
    // If stroops failed, try raw units fallback
    const rawVal = toI128ScVal(Math.floor(Number(amount)));
    const txFallback = new TransactionBuilder(studentAcc, {
      fee: "1000",
      networkPassphrase: Networks.TESTNET
    })
    .addOperation(contract.call("deposit", paymentIdVal, rawVal))
    .setTimeout(60)
    .build();

    const simFallback = await rpcServer.simulateTransaction(txFallback);
    if (rpc.Api.isSimulationError(simFallback)) {
      throw new Error(`Simulation failed: ${simulated.error}`);
    }
    const prepFallback = rpc.assembleTransaction(txFallback, simFallback).build();
    return prepFallback.toXDR();
  }

  const prep = rpc.assembleTransaction(tx, simulated).build();
  return prep.toXDR();
};

// Build, simulate, and prepare a release_payment transaction
export const releasePaymentTx = async (callerAddress, paymentId) => {
  const contract = new Contract(CONTRACT_ID);
  const callerAcc = await rpcServer.getAccount(callerAddress);

  const paymentIdVal = xdr.ScVal.scvSymbol(paymentId);
  const callerVal = Address.fromString(callerAddress).toScVal();

  const tx = new TransactionBuilder(callerAcc, {
    fee: "1000",
    networkPassphrase: Networks.TESTNET
  })
  .addOperation(contract.call("release_payment", paymentIdVal, callerVal))
  .setTimeout(60)
  .build();

  const simulated = await rpcServer.simulateTransaction(tx);
  if (rpc.Api.isSimulationError(simulated)) {
    throw new Error(`Simulation failed: ${simulated.error}`);
  }

  const prep = rpc.assembleTransaction(tx, simulated).build();
  return prep.toXDR();
};

// Build, simulate, and prepare a refund transaction
export const refundPaymentTx = async (adminAddress, paymentId) => {
  const contract = new Contract(CONTRACT_ID);
  const adminAcc = await rpcServer.getAccount(adminAddress);

  const paymentIdVal = xdr.ScVal.scvSymbol(paymentId);

  const tx = new TransactionBuilder(adminAcc, {
    fee: "1000",
    networkPassphrase: Networks.TESTNET
  })
  .addOperation(contract.call("refund", paymentIdVal))
  .setTimeout(60)
  .build();

  const simulated = await rpcServer.simulateTransaction(tx);
  if (rpc.Api.isSimulationError(simulated)) {
    throw new Error(`Simulation failed: ${simulated.error}`);
  }

  const prep = rpc.assembleTransaction(tx, simulated).build();
  return prep.toXDR();
};

// Submit signed transaction XDR to network and poll for success/failure
export const submitTx = async (signedXdr) => {
  const tx = TransactionBuilder.fromXDR(signedXdr, Networks.TESTNET);
  const response = await rpcServer.sendTransaction(tx);
  
  if (response.status === "ERROR") {
    throw new Error(`Transaction submission error: ${JSON.stringify(response)}`);
  }

  const txHash = response.hash;
  for (let i = 0; i < 30; i++) {
    const statusResponse = await rpcServer.getTransaction(txHash);
    if (statusResponse.status === "SUCCESS") {
      return { hash: txHash, result: statusResponse };
    } else if (statusResponse.status === "FAILED") {
      throw new Error(`Transaction execution failed: ${JSON.stringify(statusResponse)}`);
    }
    await new Promise((resolve) => setTimeout(resolve, 1500));
  }
  throw new Error("Transaction confirmation timeout");
};

// Fetch a single on-chain payment record directly by its unique payment ID
export const getPaymentRecord = async (paymentId) => {
  try {
    const dummyAccount = new Account("GBGMRORX4H7WOHPH2PBY2GXP7Z7PHX6Y3W56WQQNZMX4N5Q5W6XQ5AFJ", "0");
    const contract = new Contract(CONTRACT_ID);
    const paymentIdVal = xdr.ScVal.scvSymbol(paymentId);

    const tx = new TransactionBuilder(dummyAccount, {
      fee: "100",
      networkPassphrase: Networks.TESTNET
    })
    .addOperation(contract.call("get_payment_record", paymentIdVal))
    .setTimeout(30)
    .build();

    const simulated = await rpcServer.simulateTransaction(tx);
    if (rpc.Api.isSimulationError(simulated)) {
      return null;
    }

    if (simulated.result?.retval) {
      const record = scValToNative(simulated.result.retval);
      const statusMap = ["Deposited", "Escrowed", "Released", "Refunded"];
      const rawAmt = Number(record.amount);
      const displayAmt = rawAmt >= STROOPS_PER_XLM ? (rawAmt / STROOPS_PER_XLM) : rawAmt;

      return {
        id: paymentId,
        student: record.student,
        university: record.university,
        rawAmount: rawAmt,
        amount: displayAmt,
        term: record.term,
        status: statusMap[record.status] || "Unknown"
      };
    }
    return null;
  } catch (error) {
    return null;
  }
};

// Read payment history for a user / admin
export const getAllPaymentsForUser = async (userAddress, knownIds = [], isAdmin = false) => {
  try {
    const defaultIds = ["pay_7741", "pay_1446", "pay_u01_4473", "pay_u02_9676", "pay_u03_2454"];
    const uniqueIds = new Set([...knownIds, ...defaultIds]);
    const results = [];

    // Query on-chain record for each known payment ID
    for (const pid of uniqueIds) {
      const rec = await getPaymentRecord(pid);
      if (rec) {
        if (isAdmin || rec.student === userAddress || rec.university === userAddress) {
          if (!results.some(r => r.id === rec.id)) {
            results.push(rec);
          }
        }
      }
    }

    return results;
  } catch (error) {
    console.error("Error fetching payments list:", error);
    return [];
  }
};
