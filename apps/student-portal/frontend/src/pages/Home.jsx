import { Link } from "react-router-dom";
import Nav from "../components/Nav";

export default function Home() {
  return (
    <div className="relative flex h-screen min-h-[640px] items-end overflow-hidden bg-up-navy">
      <img
        src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=1920&q=80&auto=format&fit=crop"
        alt="Students laughing together while working on laptops in a library"
        className="absolute inset-0 h-full w-full object-cover opacity-70"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-up-navy via-up-navy/40 to-transparent" />
      <Nav dark />
      <div className="relative z-10 px-8 pb-24 md:px-16 md:pb-32">
        <h1 className="font-display max-w-2xl text-5xl leading-[1.05] text-white md:text-7xl">
          Your progress,
          <br />
          all in one place.
        </h1>
        <p className="mt-6 max-w-md text-sm text-white/80">
          Grades, courses, and assignments for every cohort at Utrains.
        </p>
        <Link to="/login" className="btn-ghost mt-8 text-white">
          View Grades
        </Link>
      </div>
    </div>
  );
}
