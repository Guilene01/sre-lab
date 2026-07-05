import { Link } from "react-router-dom";
import { formatPrice } from "../api";

export default function ProductCard({ product }) {
  return (
    <Link to={`/product/${product.id}`} className="group block">
      <div className="aspect-[3/4] overflow-hidden bg-norr-stone/40">
        <img
          src={product.image_url}
          alt={product.name}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
      </div>
      <div className="mt-3 flex items-baseline justify-between">
        <h3 className="text-sm text-norr-navy">{product.name}</h3>
      </div>
      <p className="mt-1 text-sm text-norr-navy/60">{formatPrice(product.price_cents)}</p>
    </Link>
  );
}
