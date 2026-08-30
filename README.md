# EduPay 🎓

EduPay is a production-ready MVP for a cross-border tuition fee payment platform built on **Stellar Testnet**. It enables students to pay tuition fees securely via an escrow smart contract, while universities and administrators retain the authority to release funds or handle refunds if disputes arise.

---

## 🚀 Deployed Details

- **Soroban Escrow Contract ID (Testnet):**  
  `CA36B6GWEQKEFMYQR73HKEIBJPWSHH4TGO3VPBJ5PMVY4VK6WAIGBU3S`
- **Native XLM Token Contract Address (Testnet):**  
  `CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC`
- **Stellar Explorer Link:**  
  [Stellar.Expert Testnet](https://stellar.expert/explorer/testnet/contract/CA36B6GWEQKEFMYQR73HKEIBJPWSHH4TGO3VPBJ5PMVY4VK6WAIGBU3S)
- **Live Frontend URL:**  
  [https://edu-pay-l4.vercel.app/](https://edu-pay-l4.vercel.app/)
- **Live Feedback Form:**  
  [Google Feedback Form](https://docs.google.com/forms/d/1YlTWD3d9XNmsSQxapl0-B5Mebk6TbWkaX5bvBFEllsU/edit)
- **User Feedback Responses Sheet:**  
  [Google Responses Sheet](https://docs.google.com/spreadsheets/d/16N1H6TOISQ1p0tvwBxnVUIedQOKXRBvzGxEjeM8vOE4/edit?usp=sharing)
- **Working Demo Video:**  
  [Watch Demo Video](https://photos.app.goo.gl/3KumqSYYd6D9uR9m6)

---

## 🛠 Tech Stack

### Smart Contract
- **Soroban SDK (Rust)**: Version `22.0.0`
- **Unit Tests**: Full test suite verifying deposit+release, refund, and unauthorized access panic.

### Frontend
- **React + Vite (ESM)**: Custom Tailwind-free, glassmorphic dark theme.
- **Stellar SDK**: `@stellar/stellar-sdk` for RPC and ledger interactions.
- **Stellar Wallets Kit**: `@creit.tech/stellar-wallets-kit` supporting Freighter, Albedo, and others.
- **Error Monitoring**: Sentry integration tracking exceptions.
- **User Analytics**: PostHog integration capturing key user actions (wallet connect, payments, deposits, releases).
- **Backend Database**: Persists student/user ratings and comments securely using a public Firebase Realtime Database.

---

## 📖 Local Development Setup

### Smart Contract (`/contracts/escrow`)

1. **Compile Contract:**
   ```bash
   cd contracts/escrow
   stellar contract build
   ```

2. **Run Tests:**
   ```bash
   cargo test
   ```

### Frontend (`/frontend`)

1. **Install dependencies:**
   ```bash
   cd frontend
   npm install
   ```

2. **Start Dev Server:**
   ```bash
   npm run dev
   ```

---

## 👥 Real User Onboarding & Testing Guide (Manual Steps)

To conduct end-to-end testing with classmates or team members, follow these steps:

1. **Wallet Setup:** Ensure users install the **Freighter Wallet** or use **Albedo**. Set the wallet network to **Testnet**.
2. **Fund Wallet:** Use the in-app **"Fund Wallet with Friendbot"** button to claim 10,000 free testnet XLM.
3. **Student Flow:**
   - Onboard by entering a custom payment reference.
   - Enter the university address (or click **"Use Demo Uni"**).
   - Click **"Create Escrow Record"** and sign the transaction.
   - Once created, click **"Deposit Escrow Funds"** and sign the transaction to deposit XLM.
4. **University/Admin Flow:**
   - Access the **"University / Admin Portal"** tab.
   - Find the active payment (which will now show as `Escrowed`).
   - Click **"Release to Uni"** to release the funds, or **"Refund Student"** to return them.
5. **Collect Feedback:** Click the floating **"Give Feedback"** button to submit ratings and reviews, which will be saved to the database.
