import React from "react";

export function Footer() {
  return (
    <footer style={{
      marginTop: "4rem",
      borderTop: "1px solid var(--border-glass)",
      padding: "2rem 1.5rem",
      background: "rgba(15, 23, 42, 0.6)",
      backdropFilter: "blur(12px)",
      color: "var(--text-secondary)",
      fontSize: "0.85rem"
    }}>
      <div style={{
        maxWidth: "1200px",
        margin: "0 auto",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "1.5rem"
      }}>
        <div>
          <strong style={{ color: "var(--text-primary)", fontSize: "1rem" }}>EduPay Protocol</strong>
          <p style={{ marginTop: "0.25rem", color: "var(--text-muted)" }}>
            Trustless cross-border tuition fee escrow powered by Stellar Soroban smart contracts.
          </p>
        </div>
        <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap" }}>
          <a href="https://stellar.expert/explorer/testnet/contract/CA36B6GWEQKEFMYQR73HKEIBJPWSHH4TGO3VPBJ5PMVY4VK6WAIGBU3S" target="_blank" rel="noreferrer" style={{ color: "var(--text-secondary)", textDecoration: "none" }}>
            Contract Explorer ↗
          </a>
          <a href="https://docs.google.com/forms/d/1YlTWD3d9XNmsSQxapl0-B5Mebk6TbWkaX5bvBFEllsU/viewform" target="_blank" rel="noreferrer" style={{ color: "var(--text-secondary)", textDecoration: "none" }}>
            Give Feedback ↗
          </a>
          <a href="https://stellar.org" target="_blank" rel="noreferrer" style={{ color: "var(--text-secondary)", textDecoration: "none" }}>
            Stellar Network ↗
          </a>
        </div>
        <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
          © {new Date().getFullYear()} EduPay. Built on Stellar Testnet.
        </div>
      </div>
    </footer>
  );
}
