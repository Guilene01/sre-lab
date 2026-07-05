import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Nav from "../components/Nav";
import { CardGridSkeleton } from "../components/Skeleton";
import { api } from "../api";

export default function Restaurants() {
  const [restaurants, setRestaurants] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    api("/restaurants").then(setRestaurants).catch((err) => setError(err.message));
  }, []);

  return (
    <div>
      <div className="relative bg-kv-charcoal py-16 text-center">
        <Nav dark />
        <h1 className="font-display pt-16 text-3xl text-white md:text-4xl">Restaurants near you</h1>
      </div>

      <section className="mx-auto max-w-6xl px-8 py-14 md:px-16">
        {error && <p className="text-sm text-red-700">Couldn&apos;t load restaurants: {error}</p>}
        {!restaurants && !error && <CardGridSkeleton />}
        {restaurants && (
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {restaurants.map((r) => (
              <Link
                key={r.id}
                to={`/restaurants/${r.id}`}
                className="group block overflow-hidden rounded-2xl bg-white shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="aspect-[4/3] overflow-hidden">
                  <img
                    src={r.image_url}
                    alt={r.name}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <div className="p-4">
                  <h3 className="font-display text-lg">{r.name}</h3>
                  <p className="mt-1 text-sm text-kv-charcoal/60">
                    {r.cuisine} &middot; ★ {r.rating}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
