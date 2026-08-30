import { Account, Address, Contract, Networks, TransactionBuilder, rpc, scValToNative, xdr } from "@stellar/stellar-sdk";

export const CONTRACT_ID = "CA36B6GWEQKEFMYQR73HKEIBJPWSHH4TGO3VPBJ5PMVY4VK6WAIGBU3S";
const RPC_URL = "https://soroban-testnet.stellar.org";
const rpcServer = new rpc.Server(RPC_URL);

// Valid query account on testnet for read-only simulation
const VALID_QUERY_ACCOUNT = "GDOAIC67A264QG5W5KPUPIWHANCOQBXYHI6DD6BGAO2WC6BWGC4YI35J";

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
  
  // Convert XLM to stroops (7 decimals)
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
    // Fallback with raw unit if stroops simulation failed
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
    const dummyAccount = new Account(VALID_QUERY_ACCOUNT, "0");
    const contract = new Contract(CONTRACT_ID);
    const paymentIdVal = xdr.ScVal.scvSymbol(paymentId);

    const tx = new TransactionBuilder(dummyAccount, {
      fee: "1000",
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
    const results = [];

    // 1. Direct on-chain query for all payments associated with this user
    try {
      const dummyAccount = new Account(VALID_QUERY_ACCOUNT, "0");
      const contract = new Contract(CONTRACT_ID);
      const userVal = Address.fromString(userAddress).toScVal();

      const tx = new TransactionBuilder(dummyAccount, {
        fee: "1000",
        networkPassphrase: Networks.TESTNET
      })
      .addOperation(contract.call("get_all_payments_for_user", userVal))
      .setTimeout(30)
      .build();

      const simulated = await rpcServer.simulateTransaction(tx);
      if (!rpc.Api.isSimulationError(simulated) && simulated.result?.retval) {
        const nativeArray = scValToNative(simulated.result.retval);
        const statusMap = ["Deposited", "Escrowed", "Released", "Refunded"];
        nativeArray.forEach((record, index) => {
          const rawAmt = Number(record.amount);
          const displayAmt = rawAmt >= STROOPS_PER_XLM ? (rawAmt / STROOPS_PER_XLM) : rawAmt;
          results.push({
            id: `pay_${index + 1}`,
            student: record.student,
            university: record.university,
            rawAmount: rawAmt,
            amount: displayAmt,
            term: record.term,
            status: statusMap[record.status] || "Unknown"
          });
        });
      }
    } catch (e) {
      console.warn("Direct contract query warning:", e);
    }

    // 2. Query known payment IDs for exact IDs and statuses
    const defaultIds = ["pay_7741", "pay_1446", "pay_u01_4473", "pay_u02_9676", "pay_u03_2454"];
    const uniqueIds = new Set([...knownIds, ...defaultIds]);
    for (const pid of uniqueIds) {
      const rec = await getPaymentRecord(pid);
      if (rec) {
        if (isAdmin || rec.student === userAddress || rec.university === userAddress) {
          const existingIdx = results.findIndex(r => r.student === rec.student && r.amount === rec.amount && r.term === rec.term);
          if (existingIdx !== -1) {
            results[existingIdx].id = rec.id;
            results[existingIdx].status = rec.status;
          } else if (!results.some(r => r.id === rec.id)) {
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
