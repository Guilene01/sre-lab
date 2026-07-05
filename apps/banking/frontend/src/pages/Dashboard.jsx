import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Nav from "../components/Nav";
import { LineSkeleton } from "../components/Skeleton";
import { api, formatMoney, getToken } from "../api";

export default function Dashboard() {
  const [account, setAccount] = useState(null);
  const [transactions, setTransactions] = useState(null);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!getToken()) {
      navigate("/login");
      return;
    }
    api("/accounts/me").then(setAccount).catch((err) => setError(err.message));
    api("/accounts/me/transactions").then(setTransactions).catch((err) => setError(err.message));
  }, [navigate]);

  return (
    <div>
      <div className="relative bg-meridian-navy py-10">
        <Nav dark />
      </div>

      <div className="mx-auto max-w-4xl px-8 py-16 md:px-16">
        {error && <p className="text-sm text-red-700">{error}</p>}

        <div className="border border-meridian-navy/10 bg-white p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-meridian-navy/50">
            Available Balance
          </p>
          {account ? (
            <>
              <p className="font-display mt-2 text-4xl">{formatMoney(account.balance_cents)}</p>
              <p className="mt-1 text-sm text-meridian-navy/50">Account {account.account_number}</p>
            </>
          ) : (
            <LineSkeleton className="mt-3 h-10 w-48" />
          )}
        </div>

        <h2 className="font-display mt-12 text-2xl">Recent Activity</h2>
        {!transactions && (
          <div className="mt-6 space-y-3">
            <LineSkeleton className="h-10 w-full" />
            <LineSkeleton className="h-10 w-full" />
            <LineSkeleton className="h-10 w-full" />
          </div>
        )}
        {transactions && transactions.length === 0 && (
          <p className="mt-6 text-sm text-meridian-navy/50">No transactions yet.</p>
        )}
        {transactions && transactions.length > 0 && (
          <table className="mt-6 w-full text-left text-sm">
            <thead className="text-xs uppercase tracking-wider text-meridian-navy/50">
              <tr>
                <th className="pb-3">Date</th>
                <th className="pb-3">Description</th>
                <th className="pb-3 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-meridian-navy/10">
              {transactions.map((t) => (
                <tr key={t.id}>
                  <td className="py-3">{new Date(t.created_at).toLocaleDateString()}</td>
                  <td className="py-3">{t.counterparty}</td>
                  <td className={`py-3 text-right ${t.type === "credit" ? "text-emerald-700" : ""}`}>
                    {t.type === "credit" ? "+" : "-"}
                    {formatMoney(t.amount_cents)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
