import { Link } from "react-router-dom";

export default function Nav({ dark }) {
  return (
    <header
      className={`absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-8 py-6 md:px-16 ${
        dark ? "text-white" : "text-kv-charcoal"
      }`}
    >
      <Link to="/" className="font-display text-2xl tracking-wide">
        Kettle &amp; Vine
      </Link>
      <nav className="hidden gap-8 text-xs font-semibold uppercase tracking-[0.2em] md:flex">
        <Link to="/restaurants" className="opacity-80 transition-opacity hover:opacity-60">
          Restaurants
        </Link>
        <Link to="/orders" className="opacity-80 transition-opacity hover:opacity-60">
          Orders
        </Link>
      </nav>
    </header>
  );
}
