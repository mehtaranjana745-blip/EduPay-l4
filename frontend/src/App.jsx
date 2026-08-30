import React, { useState, useEffect } from "react";
import { initWalletKit, connectWallet, disconnectWallet, signTx } from "./utils/wallet";
import { fundAccount, checkBalance } from "./utils/stellar";
import { createPaymentTx, depositPaymentTx, releasePaymentTx, refundPaymentTx, submitTx, getAllPaymentsForUser } from "./utils/contract";
import posthog from "posthog-js";
import * as Sentry from "@sentry/react";
import "./App.css";

// Initialize Sentry
Sentry.init({
  dsn: "https://72bf2727ea1d86d63a14e9f737cc57ea@o4507020087422976.ingest.us.sentry.io/4508933215289344",
  integrations: [Sentry.browserTracingIntegration()],
  tracesSampleRate: 1.0,
});

// Initialize PostHog
posthog.init("phc_zU8cI2mN9b7QxVnB4T6O5c3jF7nL1dKs9hJp4e5g6w", {
  api_host: "https://app.posthog.com",
  autocapture: false,
});

function App() {
  const [userAddress, setUserAddress] = useState("");
  const [balance, setBalance] = useState(0);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isFunding, setIsFunding] = useState(false);
  const [view, setView] = useState("student"); // "student" | "admin"
  
  const [payments, setPayments] = useState([]);
  const [isLoadingPayments, setIsLoadingPayments] = useState(false);
  
  const [formData, setFormData] = useState({
    paymentId: `pay_${Math.floor(1000 + Math.random() * 9000)}`,
    universityAddress: "",
    amount: "",
    term: "Fall 2026"
  });

  const [feedbackRating, setFeedbackRating] = useState(0);
  const [feedbackComment, setFeedbackComment] = useState("");
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);

  const [txStatus, setTxStatus] = useState({
    step: "", // "create" | "deposit" | "release" | "refund"
    status: "idle", // "idle" | "simulating" | "signing" | "submitting" | "success" | "error"
    hash: "",
    error: ""
  });

  // Pre-fill university address for demo/testing convenience
  const DEMO_UNIVERSITY = "GDOAIC67A264QG5W5KPUPIWHANCOQBXYHI6DD6BGAO2WC6BWGC4YI35J";

  // Initialize wallet kit on mount
  useEffect(() => {
    initWalletKit();
  }, []);

  // Fetch balance and payments when address is set
  useEffect(() => {
    if (userAddress) {
      reloadBalance();
      loadPayments();
      // Poll for active payment status updates from the contract state every 7 seconds
      const interval = setInterval(() => {
        loadPayments();
      }, 7000);
      return () => clearInterval(interval);
    } else {
      setBalance(0);
      setPayments([]);
    }
  }, [userAddress]);

  const reloadBalance = async () => {
    if (!userAddress) return;
    try {
      const bal = await checkBalance(userAddress);
      setBalance(bal);
    } catch (err) {
      console.error("Failed to load balance:", err);
    }
  };

  const loadPayments = async () => {
    if (!userAddress) return;
    setIsLoadingPayments(true);
    try {
      const list = await getAllPaymentsForUser(userAddress);
      setPayments(list);
    } catch (err) {
      console.error("Failed to load payments:", err);
    } finally {
      setIsLoadingPayments(false);
    }
  };

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      const addr = await connectWallet();
      setUserAddress(addr);
      posthog.capture("wallet_connected", { address: addr });
    } catch (err) {
      console.error(err);
      Sentry.captureException(err);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnectWallet();
      setUserAddress("");
      posthog.capture("wallet_disconnected");
    } catch (err) {
      console.error(err);
    }
  };

  const handleFundWallet = async () => {
    if (!userAddress) return;
    setIsFunding(true);
    try {
      await fundAccount(userAddress);
      await reloadBalance();
      alert("Successfully funded account with 10,000 testnet XLM!");
    } catch (err) {
      console.error(err);
      alert("Funding failed. Please try again.");
    } finally {
      setIsFunding(false);
    }
  };

  const handleCreatePayment = async (e) => {
    e.preventDefault();
    if (!userAddress) return;
    setTxStatus({ step: "create", status: "simulating", hash: "", error: "" });
    try {
      const { paymentId, universityAddress, amount, term } = formData;
      const targetUni = universityAddress || DEMO_UNIVERSITY;

      const preparedXdr = await createPaymentTx(userAddress, paymentId, targetUni, amount, term);
      
      setTxStatus({ step: "create", status: "signing", hash: "", error: "" });
      const signedXdr = await signTx(preparedXdr, userAddress);
      
      setTxStatus({ step: "create", status: "submitting", hash: "", error: "" });
      const { hash } = await submitTx(signedXdr);

      posthog.capture("payment_created", { paymentId, amount, term, university: targetUni });
      setTxStatus({ step: "create", status: "success", hash, error: "" });

      await loadPayments();
      // Setup next payment ID
      setFormData({
        paymentId: `pay_${Math.floor(1000 + Math.random() * 9000)}`,
        universityAddress: "",
        amount: "",
        term: "Fall 2026"
      });
    } catch (err) {
      console.error(err);
      setTxStatus({ step: "create", status: "error", hash: "", error: err.message });
      Sentry.captureException(err);
    }
  };

  const handleDepositFunds = async (paymentId, amount) => {
    setTxStatus({ step: "deposit", status: "simulating", hash: "", error: "" });
    try {
      const preparedXdr = await depositPaymentTx(userAddress, paymentId, amount);
      
      setTxStatus({ step: "deposit", status: "signing", hash: "", error: "" });
      const signedXdr = await signTx(preparedXdr, userAddress);
      
      setTxStatus({ step: "deposit", status: "submitting", hash: "", error: "" });
      const { hash } = await submitTx(signedXdr);

      posthog.capture("payment_escrowed", { paymentId, amount });
      setTxStatus({ step: "deposit", status: "success", hash, error: "" });

      await loadPayments();
      await reloadBalance();
    } catch (err) {
      console.error(err);
      setTxStatus({ step: "deposit", status: "error", hash: "", error: err.message });
      Sentry.captureException(err);
    }
  };

  const handleReleasePayment = async (paymentId) => {
    setTxStatus({ step: "release", status: "simulating", hash: "", error: "" });
    try {
      const preparedXdr = await releasePaymentTx(userAddress, paymentId);
      
      setTxStatus({ step: "release", status: "signing", hash: "", error: "" });
      const signedXdr = await signTx(preparedXdr, userAddress);
      
      setTxStatus({ step: "release", status: "submitting", hash: "", error: "" });
      const { hash } = await submitTx(signedXdr);

      posthog.capture("payment_released", { paymentId });
      setTxStatus({ step: "release", status: "success", hash, error: "" });

      await loadPayments();
      await reloadBalance();
    } catch (err) {
      console.error(err);
      setTxStatus({ step: "release", status: "error", hash: "", error: err.message });
      Sentry.captureException(err);
    }
  };

  const handleRefundPayment = async (paymentId) => {
    setTxStatus({ step: "refund", status: "simulating", hash: "", error: "" });
    try {
      const preparedXdr = await refundPaymentTx(userAddress, paymentId);
      
      setTxStatus({ step: "refund", status: "signing", hash: "", error: "" });
      const signedXdr = await signTx(preparedXdr, userAddress);
      
      setTxStatus({ step: "refund", status: "submitting", hash: "", error: "" });
      const { hash } = await submitTx(signedXdr);

      posthog.capture("payment_refunded", { paymentId });
      setTxStatus({ step: "refund", status: "success", hash, error: "" });

      await loadPayments();
      await reloadBalance();
    } catch (err) {
      console.error(err);
      setTxStatus({ step: "refund", status: "error", hash: "", error: err.message });
      Sentry.captureException(err);
    }
  };

  const submitFeedback = async (e) => {
    e.preventDefault();
    if (!feedbackRating) return;
    setIsSubmittingFeedback(true);
    try {
      const response = await fetch("https://edupay-feedback-default-rtdb.firebaseio.com/feedback.json", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rating: feedbackRating,
          comment: feedbackComment,
          user: userAddress || "anonymous",
          timestamp: new Date().toISOString()
        })
      });
      if (!response.ok) {
        throw new Error("Failed to submit feedback");
      }
      setFeedbackRating(0);
      setFeedbackComment("");
      setShowFeedbackModal(false);
      alert("Feedback submitted successfully! Thank you!");
    } catch (err) {
      console.error("Feedback error:", err);
      alert("Failed to submit feedback. Please try again.");
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="logo-section">
          <div className="logo-icon">E</div>
          <div className="logo-text">EduPay</div>
        </div>
        
        {userAddress && (
          <div className="nav-links">
            <button className={`nav-link ${view === "student" ? "active" : ""}`} onClick={() => setView("student")}>Student Dashboard</button>
            <button className={`nav-link ${view === "admin" ? "active" : ""}`} onClick={() => setView("admin")}>University / Admin Portal</button>
          </div>
        )}

        <div className="wallet-section">
          {userAddress ? (
            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>Testnet Wallet</div>
                <div style={{ fontSize: "0.95rem", fontWeight: "700" }}>{balance.toLocaleString()} XLM</div>
              </div>
              <button className="btn btn-secondary" onClick={handleDisconnect}>Disconnect</button>
            </div>
          ) : (
            <button className="btn btn-primary" onClick={handleConnect} disabled={isConnecting}>
              {isConnecting ? "Connecting..." : "Connect Wallet"}
            </button>
          )}
        </div>
      </header>

      <main className="main-content">
        {!userAddress ? (
          <div className="glass-panel onboarding-hero">
            <h1>Cross-Border Tuition Fee Payments</h1>
            <p className="hero-subtitle">
              EduPay enables secure, instant, and transparent escrow-backed tuition fee payments using Stellar Testnet. 
              Connect your Freighter or Albedo wallet to start.
            </p>
            <div>
              <button className="btn btn-primary" onClick={handleConnect}>Get Started & Connect Wallet</button>
            </div>
          </div>
        ) : (
          <div>
            {/* Wallet funding helper */}
            <div className="glass-panel helper-card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <strong>Need test funds?</strong>
                <p className="friendbot-helper">Fund your connected address with testnet XLM using Friendbot.</p>
              </div>
              <button className="btn btn-secondary" onClick={handleFundWallet} disabled={isFunding}>
                {isFunding ? "Funding..." : "Fund Wallet with Friendbot"}
              </button>
            </div>

            {/* Transaction status card */}
            {txStatus.status !== "idle" && (
              <div className={`glass-panel helper-card`} style={{ borderLeftColor: txStatus.status === "error" ? "var(--danger)" : txStatus.status === "success" ? "var(--success)" : "var(--warning)" }}>
                <h4>Transaction Progress: {txStatus.step.toUpperCase()}</h4>
                <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginTop: "0.5rem" }}>
                  {(txStatus.status === "simulating" || txStatus.status === "signing" || txStatus.status === "submitting") && <div className="spinner"></div>}
                  <div>
                    {txStatus.status === "simulating" && "Simulating transaction fee & footprint..."}
                    {txStatus.status === "signing" && "Waiting for wallet signature..."}
                    {txStatus.status === "submitting" && "Submitting transaction to Stellar Testnet..."}
                    {txStatus.status === "success" && (
                      <div>
                        <span style={{ color: "var(--success)", fontWeight: "700" }}>Transaction Confirmed!</span>
                        <div style={{ marginTop: "0.25rem" }}>
                          Hash: <a className="hash-link" href={`https://stellar.expert/explorer/testnet/tx/${txStatus.hash}`} target="_blank" rel="noreferrer">{txStatus.hash}</a>
                        </div>
                      </div>
                    )}
                    {txStatus.status === "error" && (
                      <span style={{ color: "var(--danger)" }}>Error: {txStatus.error}</span>
                    )}
                  </div>
                </div>
                {txStatus.status === "success" || txStatus.status === "error" ? (
                  <button className="btn btn-secondary" style={{ marginTop: "1rem", padding: "0.4rem 0.8rem", fontSize: "0.8rem" }} onClick={() => setTxStatus({ step: "", status: "idle", hash: "", error: "" })}>Dismiss</button>
                ) : null}
              </div>
            )}

            {view === "student" ? (
              <div className="dashboard-grid">
                {/* Onboarding / Create Payment */}
                <div className="glass-panel" style={{ padding: "2rem" }}>
                  <div className="card-title-section">
                    <h3>Create New Escrow Tuition Payment</h3>
                  </div>
                  <form onSubmit={handleCreatePayment}>
                    <div className="form-group">
                      <label className="form-label">Payment Reference Symbol</label>
                      <input className="form-input" type="text" value={formData.paymentId} readOnly required />
                    </div>
                    <div className="form-group">
                      <label className="form-label">University Wallet Address</label>
                      <div style={{ display: "flex", gap: "0.5rem" }}>
                        <input className="form-input" style={{ flex: 1 }} type="text" placeholder="G..." value={formData.universityAddress} onChange={(e) => setFormData({ ...formData, universityAddress: e.target.value })} />
                        <button className="btn btn-secondary" type="button" style={{ padding: "0.5rem 1rem", fontSize: "0.85rem" }} onClick={() => setFormData({ ...formData, universityAddress: DEMO_UNIVERSITY })}>Use Demo Uni</button>
                      </div>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Amount (in XLM)</label>
                      <input className="form-input" type="number" placeholder="e.g. 100" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} required />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Academic Term</label>
                      <input className="form-input" type="text" value={formData.term} onChange={(e) => setFormData({ ...formData, term: e.target.value })} required />
                    </div>
                    <button className="btn btn-primary" type="submit">Create Escrow Record</button>
                  </form>
                </div>

                {/* List payments */}
                <div className="glass-panel" style={{ padding: "2rem" }}>
                  <h3>Tuition Payments History</h3>
                  <div style={{ marginTop: "1.5rem" }}>
                    {isLoadingPayments && payments.length === 0 ? (
                      <div className="loader-container">
                        <div className="spinner"></div>
                        <span>Loading history...</span>
                      </div>
                    ) : payments.length === 0 ? (
                      <p style={{ color: "var(--text-secondary)" }}>No payment escrows created yet.</p>
                    ) : (
                      payments.map((p) => (
                        <div key={p.id} className="glass-panel" style={{ padding: "1rem", marginBottom: "1rem", background: "rgba(255, 255, 255, 0.02)" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <strong>{p.id}</strong>
                            <span className={`status-badge status-${p.status.toLowerCase()}`}>{p.status}</span>
                          </div>
                          <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginTop: "0.5rem" }}>
                            <div>Uni: {p.university.substring(0, 8)}...{p.university.substring(p.university.length - 8)}</div>
                            <div>Term: {p.term}</div>
                            <div style={{ color: "var(--text-primary)", fontWeight: "600", marginTop: "0.25rem" }}>{p.amount} XLM</div>
                          </div>
                          {p.status === "Deposited" && (
                            <button className="btn btn-success" style={{ width: "100%", marginTop: "1rem", padding: "0.5rem" }} onClick={() => handleDepositFunds(p.id, p.amount)}>Deposit Escrow Funds</button>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            ) : (
              /* Admin Portal View */
              <div className="glass-panel" style={{ padding: "2rem" }}>
                <div className="card-title-section">
                  <h3>University / Contract Administrator Escrow Hub</h3>
                  <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>Logged in as Authorized University Agent</span>
                </div>
                
                <div className="payments-table-container">
                  {payments.length === 0 ? (
                    <p style={{ color: "var(--text-secondary)" }}>No active payment escrows found.</p>
                  ) : (
                    <table className="payments-table">
                      <thead>
                        <tr>
                          <th>Payment ID</th>
                          <th>Student</th>
                          <th>University</th>
                          <th>Amount</th>
                          <th>Term</th>
                          <th>Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {payments.map((p) => (
                          <tr key={p.id}>
                            <td><strong>{p.id}</strong></td>
                            <td>{p.student.substring(0, 6)}...{p.student.substring(p.student.length - 6)}</td>
                            <td>{p.university.substring(0, 6)}...{p.university.substring(p.university.length - 6)}</td>
                            <td>{p.amount} XLM</td>
                            <td>{p.term}</td>
                            <td>
                              <span className={`status-badge status-${p.status.toLowerCase()}`}>{p.status}</span>
                            </td>
                            <td>
                              {p.status === "Escrowed" ? (
                                <div style={{ display: "flex", gap: "0.5rem" }}>
                                  <button className="btn btn-success" style={{ padding: "0.35rem 0.75rem", fontSize: "0.8rem" }} onClick={() => handleReleasePayment(p.id)}>Release to Uni</button>
                                  <button className="btn btn-danger" style={{ padding: "0.35rem 0.75rem", fontSize: "0.8rem" }} onClick={() => handleRefundPayment(p.id)}>Refund Student</button>
                                </div>
                              ) : (
                                <span style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>No action required</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Floating feedback button */}
      <button className="btn btn-primary" style={{ position: "fixed", bottom: "2rem", right: "2rem", zIndex: 100 }} onClick={() => setShowFeedbackModal(true)}>Give Feedback</button>

      {/* Feedback Modal */}
      {showFeedbackModal && (
        <div className="modal-overlay">
          <div className="glass-panel modal-content">
            <div className="modal-header">
              <h3>Submit User Feedback</h3>
              <button className="modal-close" onClick={() => setShowFeedbackModal(false)}>&times;</button>
            </div>
            <form onSubmit={submitFeedback}>
              <div className="form-group">
                <label className="form-label">Overall Rating</label>
                <div className="rating-container">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button key={star} type="button" className={`star-btn ${feedbackRating >= star ? "active" : ""}`} onClick={() => setFeedbackRating(star)}>★</button>
                  ))}
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Review Comment</label>
                <textarea className="form-input" style={{ resize: "vertical", minHeight: "100px" }} placeholder="Describe your experience..." value={feedbackComment} onChange={(e) => setFeedbackComment(e.target.value)} required></textarea>
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "1rem" }}>
                <button className="btn btn-secondary" type="button" onClick={() => setShowFeedbackModal(false)}>Cancel</button>
                <button className="btn btn-primary" type="submit" disabled={isSubmittingFeedback || !feedbackRating}>
                  {isSubmittingFeedback ? "Submitting..." : "Submit Review"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
