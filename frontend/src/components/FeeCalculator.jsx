import React, { useState } from "react";

export function FeeCalculator() {
  const [amount, setAmount] = useState("1000");

  const numAmount = parseFloat(amount) || 0;
  const bankWireFee = (numAmount * 0.05) + 35; // 5% FX margin + $35 wire fee
  const stellarFee = 0.00001; // Stellar ledger fee
  const estimatedSavings = Math.max(0, bankWireFee - stellarFee);

  return (
    <div className="glass-panel" style={{ padding: "1.5rem", marginTop: "2rem" }}>
      <h3 style={{ fontSize: "1.1rem", marginBottom: "0.5rem" }}>💡 Tuition Fee Savings Calculator</h3>
      <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "1rem" }}>
        Compare traditional international bank wire transfer fees against Stellar smart contract escrow.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem", alignItems: "center" }}>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">Tuition Amount ($ or XLM)</label>
          <input
            className="form-input"
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="e.g. 1000"
          />
        </div>

        <div style={{
          padding: "1rem",
          borderRadius: "8px",
          background: "rgba(239, 68, 68, 0.1)",
          border: "1px solid rgba(239, 68, 68, 0.3)"
        }}>
          <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Traditional Bank Wire Fee (5% + $35)</div>
          <div style={{ fontSize: "1.2rem", fontWeight: "700", color: "#f87171" }}>
            ${bankWireFee.toFixed(2)}
          </div>
          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>3-5 business days delay</div>
        </div>

        <div style={{
          padding: "1rem",
          borderRadius: "8px",
          background: "rgba(16, 185, 129, 0.1)",
          border: "1px solid rgba(16, 185, 129, 0.3)"
        }}>
          <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>EduPay on Stellar</div>
          <div style={{ fontSize: "1.2rem", fontWeight: "700", color: "var(--success)" }}>
            ${stellarFee.toFixed(5)}
          </div>
          <div style={{ fontSize: "0.75rem", color: "var(--success)" }}>⚡ Instant 3-sec finality</div>
        </div>
      </div>

      <div style={{ marginTop: "1rem", padding: "0.75rem", background: "rgba(99, 102, 241, 0.1)", borderRadius: "6px", fontSize: "0.85rem", color: "#a5b4fc", textAlign: "center" }}>
        🎉 You save approximately <strong>${estimatedSavings.toFixed(2)}</strong> by paying via EduPay Escrow!
      </div>
    </div>
  );
}
