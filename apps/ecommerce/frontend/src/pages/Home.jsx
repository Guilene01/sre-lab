import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Nav from "../components/Nav";
import ProductCard from "../components/ProductCard";
import { ProductGridSkeleton } from "../components/Skeleton";
import { api } from "../api";

export default function Home() {
  const [products, setProducts] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    api("/products")
      .then((data) => setProducts(data.slice(0, 4)))
      .catch((err) => setError(err.message));
  }, []);

  return (
    <div>
      <section className="relative flex h-[92vh] min-h-[560px] items-end overflow-hidden bg-norr-navy">
        <img
          src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1920&q=80&auto=format&fit=crop"
          alt="Minimal clothing rack in a considered wardrobe"
          className="absolute inset-0 h-full w-full object-cover opacity-80"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-norr-navy via-norr-navy/30 to-transparent" />
        <Nav dark />
        <div className="relative z-10 px-8 pb-20 md:px-16 md:pb-28">
          <h1 className="font-display max-w-2xl text-5xl leading-[1.05] text-norr-cream md:text-7xl">
            Fewer things,
            <br />
            considered longer.
          </h1>
          <p className="mt-6 max-w-md text-sm text-norr-cream/80">
            Apparel and home goods made to be used for a decade, not a season.
          </p>
          <Link to="/shop" className="btn-ghost mt-8 text-norr-cream">
            Shop Now
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-8 py-20 md:px-16">
        <div className="mb-10 flex items-baseline justify-between">
          <h2 className="font-display text-2xl">New this season</h2>
          <Link to="/shop" className="text-xs font-semibold uppercase tracking-[0.2em] underline underline-offset-4">
            View all
          </Link>
        </div>
        {error && <p className="text-sm text-red-700">Couldn&apos;t load products: {error}</p>}
        {!products && !error && <ProductGridSkeleton count={4} />}
        {products && (
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
