import { useEffect, useState } from "react";
import Nav from "../components/Nav";
import ProductCard from "../components/ProductCard";
import { ProductGridSkeleton } from "../components/Skeleton";
import { api } from "../api";

const categories = ["all", "apparel", "footwear", "accessories", "home"];

export default function Shop() {
  const [products, setProducts] = useState(null);
  const [error, setError] = useState(null);
  const [category, setCategory] = useState("all");

  useEffect(() => {
    setProducts(null);
    const query = category === "all" ? "" : `?category=${category}`;
    api(`/products${query}`)
      .then(setProducts)
      .catch((err) => setError(err.message));
  }, [category]);

  return (
    <div>
      <div className="relative bg-norr-navy py-16 text-center">
        <Nav />
        <h1 className="font-display pt-16 text-3xl text-norr-cream md:text-4xl">Shop the collection</h1>
      </div>

      <section className="mx-auto max-w-6xl px-8 py-14 md:px-16">
        <div className="mb-10 flex flex-wrap gap-6 border-b border-norr-navy/10 pb-4 text-xs font-semibold uppercase tracking-[0.2em]">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`transition-opacity hover:opacity-60 ${
                category === c ? "underline underline-offset-4" : "opacity-50"
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        {error && <p className="text-sm text-red-700">Couldn&apos;t load products: {error}</p>}
        {!products && !error && <ProductGridSkeleton />}
        {products && products.length === 0 && (
          <p className="py-20 text-center text-sm text-norr-navy/50">No products in this category yet.</p>
        )}
        {products && products.length > 0 && (
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
