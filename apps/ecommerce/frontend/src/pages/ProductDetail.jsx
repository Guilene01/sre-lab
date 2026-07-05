import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Nav from "../components/Nav";
import { LineSkeleton } from "../components/Skeleton";
import { api, formatPrice } from "../api";
import { useToast } from "../components/Toast";

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [product, setProduct] = useState(null);
  const [error, setError] = useState(null);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    setProduct(null);
    api(`/products/${id}`)
      .then(setProduct)
      .catch((err) => setError(err.message));
  }, [id]);

  async function addToCart() {
    setAdding(true);
    try {
      await api("/cart/items", { method: "POST", body: JSON.stringify({ productId: Number(id), quantity: 1 }) });
      toast("Added to cart");
    } catch (err) {
      toast(err.message, "error");
    } finally {
      setAdding(false);
    }
  }

  if (error) {
    return (
      <div className="p-16 text-center">
        <Nav />
        <p className="pt-24 text-sm text-red-700">Couldn&apos;t load this product: {error}</p>
        <button onClick={() => navigate("/shop")} className="btn-ghost mt-6">
          Back to shop
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="relative bg-norr-navy py-10">
        <Nav />
      </div>
      <div className="mx-auto grid max-w-5xl grid-cols-1 gap-12 px-8 py-16 md:grid-cols-2 md:px-16">
        <div className="aspect-[3/4] bg-norr-stone/40">
          {product ? (
            <img src={product.image_url} alt={product.name} className="h-full w-full object-cover" />
          ) : (
            <div className="h-full w-full animate-pulse bg-norr-stone/60" />
          )}
        </div>
        <div>
          {product ? (
            <>
              <h1 className="font-display text-3xl">{product.name}</h1>
              <p className="mt-3 text-lg text-norr-navy/70">{formatPrice(product.price_cents)}</p>
              <p className="mt-6 max-w-md text-sm leading-relaxed text-norr-navy/80">{product.description}</p>
              <button onClick={addToCart} disabled={adding} className="btn-ghost mt-10 disabled:opacity-50">
                {adding ? "Adding..." : "Add to Cart"}
              </button>
            </>
          ) : (
            <>
              <LineSkeleton className="h-8 w-2/3" />
              <LineSkeleton className="mt-4 h-5 w-1/4" />
              <LineSkeleton className="mt-8 h-20 w-full" />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
