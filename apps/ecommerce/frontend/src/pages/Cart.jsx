import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Nav from "../components/Nav";
import { LineSkeleton } from "../components/Skeleton";
import { api, formatPrice } from "../api";
import { useToast } from "../components/Toast";

export default function Cart() {
  const [items, setItems] = useState(null);
  const [error, setError] = useState(null);
  const [checkingOut, setCheckingOut] = useState(false);
  const navigate = useNavigate();
  const toast = useToast();

  function load() {
    setItems(null);
    api("/cart").then(setItems).catch((err) => setError(err.message));
  }

  useEffect(load, []);

  async function removeItem(id) {
    await api(`/cart/items/${id}`, { method: "DELETE" });
    load();
  }

  async function checkout() {
    setCheckingOut(true);
    try {
      const result = await api("/checkout", { method: "POST" });
      toast(`Order #${result.orderId} placed`);
      navigate("/orders");
    } catch (err) {
      toast(err.message, "error");
    } finally {
      setCheckingOut(false);
    }
  }

  const total = items?.reduce((sum, i) => sum + i.price_cents * i.quantity, 0) ?? 0;

  return (
    <div>
      <div className="relative bg-norr-navy py-10">
        <Nav />
      </div>
      <div className="mx-auto max-w-3xl px-8 py-16 md:px-16">
        <h1 className="font-display text-3xl">Your Cart</h1>

        {error && <p className="mt-8 text-sm text-red-700">Couldn&apos;t load your cart: {error}</p>}

        {!items && !error && (
          <div className="mt-10 space-y-4">
            <LineSkeleton className="h-16 w-full" />
            <LineSkeleton className="h-16 w-full" />
          </div>
        )}

        {items && items.length === 0 && (
          <p className="mt-16 text-center text-sm text-norr-navy/50">
            Your cart is empty. <a href="/shop" className="underline">Continue shopping</a>.
          </p>
        )}

        {items && items.length > 0 && (
          <div className="mt-10 divide-y divide-norr-navy/10 border-y border-norr-navy/10">
            {items.map((item) => (
              <div key={item.id} className="flex items-center gap-4 py-4">
                <img src={item.image_url} alt={item.name} className="h-20 w-16 object-cover" />
                <div className="flex-1">
                  <p className="text-sm">{item.name}</p>
                  <p className="text-xs text-norr-navy/50">Qty {item.quantity}</p>
                </div>
                <p className="text-sm">{formatPrice(item.price_cents * item.quantity)}</p>
                <button
                  onClick={() => removeItem(item.id)}
                  className="text-xs uppercase tracking-wider text-norr-navy/40 hover:text-norr-terracotta"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}

        {items && items.length > 0 && (
          <div className="mt-8 flex items-center justify-between">
            <p className="font-display text-xl">Total: {formatPrice(total)}</p>
            <button onClick={checkout} disabled={checkingOut} className="btn-ghost disabled:opacity-50">
              {checkingOut ? "Processing..." : "Checkout"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
