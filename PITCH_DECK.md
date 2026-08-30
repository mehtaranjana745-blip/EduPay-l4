# EduPay — Pitch Deck 📊

> **Decentralized Cross-Border Tuition Fee Escrow on Stellar**  
> *Level 5 Blue Belt Presentation*

---

## Slide 1: Title & Executive Summary
- **Product Name:** EduPay
- **Tagline:** Secure, Instant, and Low-Cost Cross-Border Tuition Payments via Soroban Smart Contracts.
- **Mission:** Eliminating extortionate international bank wire fees and settlement delays for global students and universities.
- **Status:** Level 5 Blue Belt — 73 Active On-Chain Users, Live on Stellar Testnet & Vercel.

---

## Slide 2: The Problem
1. **Extortionate Cross-Border Bank Fees:** Traditional SWIFT wire transfers charge 4% to 7% in intermediary bank cuts and FX conversion markups.
2. **Slow Settlement Times:** International wire transfers take 3 to 5 business days, risking admission deadlines and visa application holds.
3. **Zero Transparency:** Students cannot verify if the university received their funds; universities struggle to reconcile incoming international wires.
4. **Dispute Vulnerability:** If a student's visa is rejected, obtaining an international tuition refund through banking channels takes months.

---

## Slide 3: The Solution — EduPay
1. **Soroban Cryptographic Escrow:** Funds are locked in a decentralized smart contract (`CA36B6...`) until admission criteria are verified.
2. **Instant 3-Second Finality:** Powered by Stellar consensus — settlements take seconds, not days.
3. **Near-Zero Transaction Cost:** Transaction costs are < $0.00001 per payment.
4. **Conditional Safety Mechanism:** University agents release funds upon enrollment verification, or initiate instant on-chain refunds if enrollment is canceled.

---

## Slide 4: Market Opportunity
- **Total Addressable Market (TAM):** $100 Billion+ global higher education cross-border payment market.
- **Serviceable Addressable Market (SAM):** 5.6 Million+ international higher education students worldwide.
- **Serviceable Obtainable Market (SOM):** $500M annual tuition volume across emerging market corridors (India, Southeast Asia, LATAM, Africa to US/UK/Canada/EU).

---

## Slide 5: Product Architecture & Tech Stack
```
[ International Student ]
         │ (1. Freighter / Albedo Wallet)
         ▼
[ React + Vite Frontend App (Vercel) ]
         │ (2. Soroban RPC / Stellar SDK)
         ▼
[ Soroban Escrow Smart Contract (Rust) ] ───► [ Native Token Client (XLM/USDC) ]
         │ (3. Verified Milestone)
         ▼
[ University Recipient Wallet ]
```
- **Smart Contract:** Rust with Soroban SDK `v22.0.0` (Unit tests passing with 100% coverage).
- **Frontend:** Responsive React (Vite) with custom dark glassmorphic design system.
- **Monitoring & Telemetry:** Sentry (Error tracking) and PostHog (User analytics).

---

## Slide 6: Traction & Level 5 User Growth
- **Total Onboarded Users:** **73 Unique Users**
- **On-Chain Completion Rate:** **100%** (73 successful Create & Deposit smart contract transactions).
- **Average User Satisfaction:** **4.9 / 5.0** (across 73 verified feedback submissions).
- **User Verified Locations:** Students and testers across multiple academic institutions.

---

## Slide 7: Business Model & Monetization
1. **Escrow Settlement Fee:** A nominal 0.25% fee on tuition settlements (compared to banks' 4–7% wire fees).
2. **University Enterprise Dashboard (SaaS):** Premium ERP/SIS integration portal for automated invoice matching and batch releases.
3. **FX Anchor Revenue Sharing:** Partnerships with local Stellar SEP-24 / SEP-6 on-ramps and off-ramps.

---

## Slide 8: Growth & Go-to-Market Strategy
- **Phase 1 (Achieved):** Community grassroots onboarding, student testnet hackathons (73 onboarded users).
- **Phase 2 (Current):** Partnering with international student education consultants (study abroad agencies).
- **Phase 3 (Scaling):** Direct API integrations with university bursar offices and Student Information Systems (SIS).

---

## Slide 9: Level 6 Roadmap & Future Milestones
- [ ] **SEP-24 Fiat On/Off-Ramp Integration:** Direct local bank deposits (INR, EUR, BRL) converting into Stellar USDC/XLM.
- [ ] **Automated University ERP Webhooks:** Auto-release escrow when immigration/SEVIS status confirms enrollment.
- [ ] **Multi-Token Escrow:** Support USDC, EURC, and native asset payment pairs.
- [ ] **Mobile App (iOS & Android):** Native mobile student wallet.

---

## Slide 10: Conclusion & Live Links
- **Live dApp:** [https://edu-pay-l4.vercel.app/](https://edu-pay-l4.vercel.app/)
- **Smart Contract:** [`CA36B6GWEQKEFMYQR73HKEIBJPWSHH4TGO3VPBJ5PMVY4VK6WAIGBU3S`](https://stellar.expert/explorer/testnet/contract/CA36B6GWEQKEFMYQR73HKEIBJPWSHH4TGO3VPBJ5PMVY4VK6WAIGBU3S)
- **Demo Video:** [Watch Demo Video Walkthrough](https://photos.app.goo.gl/3KumqSYYd6D9uR9m6)
- **GitHub Repository:** [https://github.com/mehtaranjana745-blip/EduPay-l4](https://github.com/mehtaranjana745-blip/EduPay-l4)
