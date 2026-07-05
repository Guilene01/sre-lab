import { Link } from "react-router-dom";
import Nav from "../components/Nav";

export default function Home() {
  return (
    <div className="relative flex h-screen min-h-[640px] items-end overflow-hidden bg-meridian-navy">
      <img
        src="https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=1920&q=80&auto=format&fit=crop"
        alt="A confident professional adjusting their suit jacket"
        className="absolute inset-0 h-full w-full object-cover opacity-70"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-meridian-navy via-meridian-navy/40 to-transparent" />
      <Nav dark />
      <div className="relative z-10 px-8 pb-24 md:px-16 md:pb-32">
        <h1 className="font-display max-w-2xl text-5xl leading-[1.05] text-white md:text-7xl">
          Banking that
          <br />
          moves at your pace.
        </h1>
        <p className="mt-6 max-w-md text-sm text-white/80">
          Checking, transfers, and statements in one place -- built for people who
          don&apos;t have time to think about their bank.
        </p>
        <Link to="/login" className="btn-ghost mt-8 text-white">
          Sign In
        </Link>
      </div>
    </div>
  );
}
