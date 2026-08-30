# EduPay Architecture & State Machine 🏛️

This document outlines the technical architecture, cryptographic state model, and Soroban storage schema of **EduPay**.

---

## 1. System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Student Web Browser                      │
│   (React + Vite + StellarWalletsKit + PostHog Telemetry)     │
└───────────────┬─────────────────────────────▲───────────────┘
                │ 1. Sign & Submit XDR        │ 4. Poll Status
                ▼                             │
┌─────────────────────────────────────────────┴───────────────┐
│                    Stellar Soroban RPC                      │
│             (Simulation & Footprint Resolution)             │
└───────────────┬─────────────────────────────────────────────┘
                │ 2. Execute Invocation
                ▼
┌─────────────────────────────────────────────────────────────┐
│             EduPay Escrow Smart Contract (Rust)             │
│   (CA36B6GWEQKEFMYQR73HKEIBJPWSHH4TGO3VPBJ5PMVY4VK6WAIGBU3S)│
└───────────────┬─────────────────────────────────────────────┘
                │ 3. Transfer Stroops
                ▼
┌─────────────────────────────────────────────────────────────┐
│             Stellar Asset Contract (Native XLM)             │
│   (CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC)│
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Escrow State Machine

Every payment record in the contract transitions through strict, verifiable states:

```
[ Uninitialized ]
       │
       ▼ (create_payment)
[ 0: Deposited ] ─── (Record metadata registered, no funds debited)
       │
       ▼ (deposit)
[ 1: Escrowed ]  ─── (Funds transferred to contract via token client)
       │
       ├─────────────────────────────────┐
       ▼ (release_payment)               ▼ (refund)
[ 2: Released ]                   [ 3: Refunded ]
(Funds sent to University)       (Funds returned to Student)
```

---

## 3. Storage Schema

The Soroban escrow contract organizes ledger data using instance and persistent storage:

| Storage Key | Type | Description |
|---|---|---|
| `Symbol("Admin")` | `Address` | Authorized contract deployer & dispute resolver address |
| `Symbol("Token")` | `Address` | Registered Stellar token contract (Native XLM or USDC) |
| `DataKey::Payment(Symbol)` | `PaymentRecord` | Struct storing student, university, amount, term, and status |
| `DataKey::UserPayments(Address)` | `Vec<Symbol>` | User payment index tracking all payment IDs for a given address |
