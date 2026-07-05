import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Nav from "../components/Nav";
import { api, getToken } from "../api";
import { useToast } from "../components/Toast";

export default function Transfer() {
  const [toAccountNumber, setToAccountNumber] = useState("");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const toast = useToast();

  useEffect(() => {
    if (!getToken()) navigate("/login");
  }, [navigate]);

  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      await api("/transfer", {
        method: "POST",
        body: JSON.stringify({ toAccountNumber, amountCents: Math.round(Number(amount) * 100) }),
      });
      toast("Transfer complete");
      navigate("/dashboard");
    } catch (err) {
      toast(err.message, "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="relative bg-meridian-navy py-10">
        <Nav dark />
      </div>
      <div className="mx-auto max-w-sm px-8 py-20">
        <h1 className="font-display text-3xl">Transfer Funds</h1>
        <form onSubmit={submit} className="mt-8 space-y-4">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-meridian-navy/60">
              Recipient Account Number
            </label>
            <input
              value={toAccountNumber}
              onChange={(e) => setToAccountNumber(e.target.value)}
              placeholder="MB-100482914"
              required
              className="mt-1 w-full border border-meridian-navy/20 bg-white px-4 py-3 text-sm focus:border-meridian-navy focus:outline-none"
            />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-meridian-navy/60">
              Amount (USD)
            </label>
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              className="mt-1 w-full border border-meridian-navy/20 bg-white px-4 py-3 text-sm focus:border-meridian-navy focus:outline-none"
            />
          </div>
          <button type="submit" disabled={loading} className="btn-solid w-full disabled:opacity-50">
            {loading ? "Sending..." : "Send Transfer"}
          </button>
        </form>
      </div>
    </div>
  );
}
