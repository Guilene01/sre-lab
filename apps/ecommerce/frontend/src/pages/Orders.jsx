import { useEffect, useState } from "react";
import Nav from "../components/Nav";
import { LineSkeleton } from "../components/Skeleton";
import { api, formatPrice } from "../api";

export default function Orders() {
  const [orders, setOrders] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    api("/orders").then(setOrders).catch((err) => setError(err.message));
  }, []);

  return (
    <div>
      <div className="relative bg-norr-navy py-10">
        <Nav />
      </div>
      <div className="mx-auto max-w-3xl px-8 py-16 md:px-16">
        <h1 className="font-display text-3xl">Order History</h1>

        {error && <p className="mt-8 text-sm text-red-700">Couldn&apos;t load orders: {error}</p>}

        {!orders && !error && (
          <div className="mt-10 space-y-3">
            <LineSkeleton className="h-12 w-full" />
            <LineSkeleton className="h-12 w-full" />
          </div>
        )}

        {orders && orders.length === 0 && (
          <p className="mt-16 text-center text-sm text-norr-navy/50">No orders yet.</p>
        )}

        {orders && orders.length > 0 && (
          <table className="mt-10 w-full text-left text-sm">
            <thead className="text-xs uppercase tracking-wider text-norr-navy/50">
              <tr>
                <th className="pb-3">Order</th>
                <th className="pb-3">Date</th>
                <th className="pb-3">Status</th>
                <th className="pb-3 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-norr-navy/10">
              {orders.map((o) => (
                <tr key={o.id}>
                  <td className="py-3">#{o.id}</td>
                  <td className="py-3">{new Date(o.created_at).toLocaleDateString()}</td>
                  <td className="py-3 capitalize">{o.status.replace("_", " ")}</td>
                  <td className="py-3 text-right">{formatPrice(o.total_cents)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
