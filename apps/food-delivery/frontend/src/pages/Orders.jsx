import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
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
      <div className="relative bg-kv-charcoal py-10">
        <Nav dark />
      </div>
      <div className="mx-auto max-w-2xl px-8 py-16 md:px-16">
        <h1 className="font-display text-3xl">Your Orders</h1>

        {error && <p className="mt-8 text-sm text-red-700">{error}</p>}
        {!orders && !error && (
          <div className="mt-8 space-y-3">
            <LineSkeleton className="h-14 w-full" />
            <LineSkeleton className="h-14 w-full" />
          </div>
        )}
        {orders && orders.length === 0 && <p className="mt-10 text-sm text-kv-charcoal/50">No orders yet.</p>}
        {orders && orders.length > 0 && (
          <div className="mt-8 divide-y divide-kv-charcoal/10">
            {orders.map((o) => (
              <Link key={o.id} to={`/orders/${o.id}`} className="flex items-center justify-between py-4">
                <div>
                  <p className="text-sm font-medium">{o.restaurant_name}</p>
                  <p className="text-xs text-kv-charcoal/50">{new Date(o.created_at).toLocaleString()}</p>
                </div>
                <p className="text-sm">{formatPrice(o.total_cents)}</p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
