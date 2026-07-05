import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Nav from "../components/Nav";
import { CardGridSkeleton } from "../components/Skeleton";
import { api, formatPrice } from "../api";
import { useToast } from "../components/Toast";

export default function RestaurantMenu() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [menu, setMenu] = useState(null);
  const [error, setError] = useState(null);
  const [cart, setCart] = useState({});
  const [placing, setPlacing] = useState(false);

  useEffect(() => {
    api(`/restaurants/${id}/menu`).then(setMenu).catch((err) => setError(err.message));
  }, [id]);

  function addItem(menuItemId) {
    setCart((c) => ({ ...c, [menuItemId]: (c[menuItemId] || 0) + 1 }));
  }

  const itemCount = Object.values(cart).reduce((a, b) => a + b, 0);
  const total = menu
    ? Object.entries(cart).reduce((sum, [itemId, qty]) => {
        const item = menu.find((m) => m.id === Number(itemId));
        return sum + (item ? item.price_cents * qty : 0);
      }, 0)
    : 0;

  async function placeOrder() {
    setPlacing(true);
    try {
      const items = Object.entries(cart).map(([menuItemId, quantity]) => ({
        menuItemId: Number(menuItemId),
        quantity,
      }));
      const result = await api("/orders", {
        method: "POST",
        body: JSON.stringify({ restaurantId: Number(id), items }),
      });
      toast(`Order #${result.orderId} placed`);
      navigate(`/orders/${result.orderId}`);
    } catch (err) {
      toast(err.message, "error");
    } finally {
      setPlacing(false);
    }
  }

  return (
    <div>
      <div className="relative bg-kv-charcoal py-10">
        <Nav dark />
      </div>
      <div className="mx-auto max-w-3xl px-8 py-14 md:px-16">
        {error && <p className="text-sm text-red-700">Couldn&apos;t load menu: {error}</p>}
        {!menu && !error && <CardGridSkeleton count={4} />}
        {menu && (
          <div className="divide-y divide-kv-charcoal/10">
            {menu.map((item) => (
              <div key={item.id} className="flex items-center gap-4 py-5">
                <img src={item.image_url} alt={item.name} className="h-20 w-20 rounded-xl object-cover" />
                <div className="flex-1">
                  <h3 className="font-display text-lg">{item.name}</h3>
                  <p className="mt-1 text-sm text-kv-charcoal/60">{item.description}</p>
                  <p className="mt-1 text-sm">{formatPrice(item.price_cents)}</p>
                </div>
                <button onClick={() => addItem(item.id)} className="btn-solid rounded-full !px-4 !py-2">
                  Add {cart[item.id] ? `(${cart[item.id]})` : ""}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {itemCount > 0 && (
        <div className="fixed bottom-0 left-0 right-0 flex items-center justify-between bg-kv-charcoal px-8 py-4 text-white md:px-16">
          <p className="text-sm">
            {itemCount} item{itemCount > 1 ? "s" : ""} &middot; {formatPrice(total)}
          </p>
          <button onClick={placeOrder} disabled={placing} className="btn-solid disabled:opacity-50">
            {placing ? "Placing..." : "Place Order"}
          </button>
        </div>
      )}
    </div>
  );
}
