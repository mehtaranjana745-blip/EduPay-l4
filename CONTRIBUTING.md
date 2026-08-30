# Contributing to EduPay 🎓

Thank you for your interest in contributing to **EduPay**! This document provides guidelines for local development, smart contract compilation, frontend testing, and submitting pull requests.

---

## 🛠 Development Workflow

### 1. Prerequisites
- **Node.js** `>= 20.x` and `npm`
- **Rust** `>= 1.80` with `wasm32-unknown-unknown` target
  ```bash
  rustup target add wasm32-unknown-unknown
  ```
- **Stellar CLI** `>= 22.0.0`

### 2. Smart Contract Development
```bash
cd contracts/escrow

# Run unit test suite
cargo test

# Build optimized WASM binary
stellar contract build
```

### 3. Frontend Web Application
```bash
cd frontend

# Install dependencies
npm install

# Start local development server
npm run dev

# Verify production build
npm run build
```

---

## 📜 Code Style & Standards
- Keep smart contract storage keys strongly typed using `Symbol` and `DataKey` enums.
- Verify that every on-chain transfer handles 7-decimal native Stroop conversions (`1 XLM = 10,000,000 stroops`).
- Preserve accessibility, dark glassmorphic UI aesthetics, and responsive layout standards in frontend code.

---

## 🤝 Submitting Changes
1. Fork the repository and create your feature branch: `git checkout -b feature/my-feature`.
2. Ensure all unit tests pass: `cargo test` & `npm run build`.
3. Commit with clear, conventional commit messages.
4. Open a Pull Request with a clear description of changes made.
