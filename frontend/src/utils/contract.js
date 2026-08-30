import { Account, Address, Contract, Networks, TransactionBuilder, rpc, scValToNative, xdr } from "@stellar/stellar-sdk";

export const CONTRACT_ID = "CA36B6GWEQKEFMYQR73HKEIBJPWSHH4TGO3VPBJ5PMVY4VK6WAIGBU3S";
const RPC_URL = "https://soroban-testnet.stellar.org";
const rpcServer = new rpc.Server(RPC_URL);

export function toI128ScVal(amount) {
  const cleanInt = Math.floor(Number(amount || 0));
  return xdr.ScVal.scvI128(
    new xdr.Int128Parts({
      lo: xdr.Uint64.fromString(cleanInt.toString()),
      hi: xdr.Int64.fromString("0")
    })
  );
}

// Build, simulate, and prepare a create_payment transaction
export const createPaymentTx = async (studentAddress, paymentId, universityAddress, amount, term) => {
  const contract = new Contract(CONTRACT_ID);
  const studentAcc = await rpcServer.getAccount(studentAddress);
  
  const paymentIdVal = xdr.ScVal.scvSymbol(paymentId);
  const studentVal = Address.fromString(studentAddress).toScVal();
  const universityVal = Address.fromString(universityAddress).toScVal();
  const amountVal = toI128ScVal(amount);
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

  const paymentIdVal = xdr.ScVal.scvSymbol(paymentId);
  const amountVal = toI128ScVal(amount);

  const tx = new TransactionBuilder(studentAcc, {
    fee: "1000",
    networkPassphrase: Networks.TESTNET
  })
  .addOperation(contract.call("deposit", paymentIdVal, amountVal))
  .setTimeout(60)
  .build();

  const simulated = await rpcServer.simulateTransaction(tx);
  if (rpc.Api.isSimulationError(simulated)) {
    throw new Error(`Simulation failed: ${simulated.error}`);
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
      return {
        id: paymentId,
        student: record.student,
        university: record.university,
        amount: Number(record.amount),
        term: record.term,
        status: statusMap[record.status] || "Unknown"
      };
    }
    return null;
  } catch (error) {
    return null;
  }
};

// Read payment history for a user
export const getAllPaymentsForUser = async (userAddress, knownIds = []) => {
  try {
    const uniqueIds = new Set(knownIds);
    const results = [];

    // Query on-chain record for each known payment ID
    for (const pid of uniqueIds) {
      const rec = await getPaymentRecord(pid);
      if (rec && (rec.student === userAddress || rec.university === userAddress)) {
        results.push(rec);
      }
    }

    // Also attempt contract get_all_payments_for_user
    try {
      const dummyAccount = new Account("GBGMRORX4H7WOHPH2PBY2GXP7Z7PHX6Y3W56WQQNZMX4N5Q5W6XQ5AFJ", "0");
      const contract = new Contract(CONTRACT_ID);
      const userVal = Address.fromString(userAddress).toScVal();

      const tx = new TransactionBuilder(dummyAccount, {
        fee: "100",
        networkPassphrase: Networks.TESTNET
      })
      .addOperation(contract.call("get_all_payments_for_user", userVal))
      .setTimeout(30)
      .build();

      const simulated = await rpcServer.simulateTransaction(tx);
      if (!rpc.Api.isSimulationError(simulated) && simulated.result?.retval) {
        const nativeArray = scValToNative(simulated.result.retval);
        nativeArray.forEach((record, index) => {
          // If not already included
          if (!results.some(r => r.student === record.student && r.amount === Number(record.amount) && r.term === record.term)) {
            results.push({
              id: `pay_${index + 1}`,
              student: record.student,
              university: record.university,
              amount: Number(record.amount),
              term: record.term,
              status: ["Deposited", "Escrowed", "Released", "Refunded"][record.status] || "Unknown"
            });
          }
        });
      }
    } catch (e) {
      // Non-blocking
    }

    return results;
  } catch (error) {
    console.error("Error fetching payments list:", error);
    return [];
  }
};
