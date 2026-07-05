import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Nav from "../components/Nav";
import { api } from "../api";

const steps = ["placed", "preparing", "out_for_delivery", "delivered"];
const labels = {
  placed: "Order Placed",
  preparing: "Preparing",
  out_for_delivery: "Out for Delivery",
  delivered: "Delivered",
};

export default function OrderTracking() {
  const { id } = useParams();
  const [status, setStatus] = useState(null);
  const [cached, setCached] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function poll() {
      try {
        const result = await api(`/orders/${id}/status`);
        if (!cancelled) {
          setStatus(result.status);
          setCached(result.cached);
        }
      } catch (err) {
        if (!cancelled) setError(err.message);
      }
    }
    poll();
    const interval = setInterval(poll, 2000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [id]);

  const currentIndex = steps.indexOf(status);

  return (
    <div>
      <div className="relative bg-kv-charcoal py-10">
        <Nav dark />
      </div>
      <div className="mx-auto max-w-lg px-8 py-20 text-center">
        <h1 className="font-display text-3xl">Order #{id}</h1>

        {error && <p className="mt-6 text-sm text-red-700">{error}</p>}

        {!status && !error && <p className="mt-10 text-sm text-kv-charcoal/50">Fetching status...</p>}

        {status && (
          <>
            <div className="mt-10 flex items-center justify-between">
              {steps.map((s, i) => (
                <div key={s} className="flex-1 text-center">
                  <div
                    className={`mx-auto h-3 w-3 rounded-full ${
                      i <= currentIndex ? "bg-kv-orange" : "bg-kv-charcoal/15"
                    }`}
                  />
                  <p className={`mt-2 text-[10px] uppercase tracking-wider ${i <= currentIndex ? "text-kv-charcoal" : "text-kv-charcoal/40"}`}>
                    {labels[s]}
                  </p>
                </div>
              ))}
            </div>
            <p className="mt-10 text-xs text-kv-charcoal/40">
              {cached ? "Status served from cache" : "Status recalculated from database"}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
