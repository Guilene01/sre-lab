import { Link } from "react-router-dom";
import Nav from "../components/Nav";

export default function Home() {
  return (
    <div className="relative flex h-screen min-h-[640px] items-end overflow-hidden bg-anchor-slate">
      <img
        src="https://images.unsplash.com/photo-1611095973763-414019e72400?w=1920&q=80&auto=format&fit=crop"
        alt="A person working calmly on a laptop with coffee amid greenery"
        className="absolute inset-0 h-full w-full object-cover opacity-60"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-anchor-slate via-anchor-slate/50 to-transparent" />
      <Nav dark />
      <div className="relative z-10 px-8 pb-24 md:px-16 md:pb-32">
        <h1 className="font-display max-w-2xl text-5xl leading-[1.05] text-white md:text-7xl">
          Support, resolved
          <br />
          calmly.
        </h1>
        <p className="mt-6 max-w-md text-sm text-white/80">
          One queue for every request, so nothing gets lost and nobody waits.
        </p>
        <Link to="/tickets/new" className="btn-ghost mt-8 text-white">
          Submit Ticket
        </Link>
      </div>
    </div>
  );
}
