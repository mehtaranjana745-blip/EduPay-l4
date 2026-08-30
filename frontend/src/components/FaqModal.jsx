import React from "react";

export function FaqModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  const faqs = [
    {
      q: "What is an Escrow Smart Contract?",
      a: "An escrow smart contract acts as an impartial cryptographic vault on the Stellar blockchain. When a student pays tuition, the funds are securely locked in the contract rather than sent immediately to the university. Funds are only released once admission requirements are validated."
    },
    {
      q: "How fast are payments processed on EduPay?",
      a: "Transactions on the Stellar network settle with definitive consensus finality within 3 to 5 seconds, eliminating the 3 to 5-day delays common with traditional SWIFT wire transfers."
    },
    {
      q: "What happens if a student's visa application is rejected?",
      a: "If an enrollment cannot proceed due to visa issues or cancellation, the contract administrator can trigger the smart contract's on-chain refund function, returning the escrowed funds directly to the student's wallet."
    },
    {
      q: "What wallets are supported?",
      a: "EduPay integrates StellarWalletsKit, supporting Freighter (browser extension), Albedo (web wallet), and other Stellar ecosystem key managers."
    },
    {
      q: "What are the network fees for paying tuition?",
      a: "Stellar transactions cost a fraction of a cent (< $0.00001 per operation), saving students hundreds of dollars compared to traditional bank wire and FX fees."
    }
  ];

  return (
    <div className="modal-overlay">
      <div className="glass-panel modal-content" style={{ maxWidth: "600px", maxHeight: "80vh", overflowY: "auto" }}>
        <div className="modal-header">
          <h3>Frequently Asked Questions</h3>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem", marginTop: "1rem" }}>
          {faqs.map((faq, i) => (
            <div key={i} style={{ padding: "0.75rem", background: "rgba(255, 255, 255, 0.02)", borderRadius: "8px", border: "1px solid var(--border-glass)" }}>
              <strong style={{ color: "var(--accent-primary)", fontSize: "0.95rem" }}>{faq.q}</strong>
              <p style={{ marginTop: "0.4rem", color: "var(--text-secondary)", fontSize: "0.85rem", lineHeight: "1.4" }}>{faq.a}</p>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "1.5rem" }}>
          <button className="btn btn-primary" onClick={onClose}>Close FAQ</button>
        </div>
      </div>
    </div>
  );
}
