import { Link, useLocation } from "react-router-dom";

const links = [
  { to: "/shop", label: "Shop" },
  { to: "/cart", label: "Cart" },
  { to: "/orders", label: "Orders" },
];

export default function Nav({ dark }) {
  const location = useLocation();
  return (
    <header
      className={`absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-8 py-6 md:px-16 ${
        dark ? "text-norr-cream" : "text-norr-navy"
      }`}
    >
      <Link to="/" className="font-display text-2xl tracking-wide">
        NORR
      </Link>
      <nav className="hidden gap-8 text-xs font-semibold uppercase tracking-[0.2em] md:flex">
        {links.map((l) => (
          <Link
            key={l.to}
            to={l.to}
            className={`transition-opacity hover:opacity-60 ${
              location.pathname === l.to ? "opacity-100 underline underline-offset-4" : "opacity-80"
            }`}
          >
            {l.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
