import { Link } from "react-router-dom";
import Nav from "../components/Nav";

export default function Home() {
  return (
    <div className="relative flex h-screen min-h-[640px] items-end overflow-hidden bg-kv-charcoal">
      <img
        src="https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=1920&q=80&auto=format&fit=crop"
        alt="A warm stack of pancakes with syrup being poured over"
        className="absolute inset-0 h-full w-full object-cover opacity-80"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-kv-charcoal via-kv-charcoal/30 to-transparent" />
      <Nav dark />
      <div className="relative z-10 px-8 pb-24 md:px-16 md:pb-32">
        <h1 className="font-display max-w-2xl text-5xl leading-[1.05] text-white md:text-7xl">
          Delivered fast,
          <br />
          cooked slow.
        </h1>
        <p className="mt-6 max-w-md text-sm text-white/80">
          Real kitchens, real ingredients, at your door in under 30 minutes.
        </p>
        <Link to="/restaurants" className="btn-ghost mt-8 text-white">
          Order Now
        </Link>
      </div>
    </div>
  );
}
