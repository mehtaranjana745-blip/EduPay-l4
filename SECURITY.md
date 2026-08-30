# Security Policy 🔒

The security of student tuition funds and university disbursements is the highest priority of the **EduPay Protocol**.

---

## 🛡️ Smart Contract Security Invariants

1. **Explicit Caller Authorization:**  
   Every state-modifying function enforces strict caller authorization checks (`require_auth()`).
   - `create_payment`: Requires `student.require_auth()`.
   - `deposit`: Requires `student.require_auth()`.
   - `release_payment`: Restricted exclusively to `university` or `admin`.
   - `refund`: Restricted exclusively to `admin`.

2. **Re-Entrancy Prevention:**  
   State transitions (`record.status = PaymentStatus::Released`) occur within the atomic execution context before and around token client transfers.

3. **Decimal Precision Protection:**  
   All native Stellar token balances are explicitly accounted using 128-bit integers (`i128`) scaled by `10,000,000` base units (Stroops).

---

## 🐛 Reporting a Vulnerability

If you discover a security vulnerability within the EduPay smart contract or web frontend, please report it responsibly:

- **Security Email:** security@edupay.io
- Please include detailed reproduction steps, contract inputs, and transaction simulations.
- We will acknowledge vulnerability reports within 24 hours.
