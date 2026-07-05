import { Link, useNavigate } from "react-router-dom";
import { clearToken, getToken } from "../api";

export default function Nav({ dark }) {
  const navigate = useNavigate();
  const authed = Boolean(getToken());

  function signOut() {
    clearToken();
    navigate("/");
  }

  return (
    <header
      className={`absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-8 py-6 md:px-16 ${
        dark ? "text-white" : "text-up-navy"
      }`}
    >
      <Link to="/" className="font-display text-2xl tracking-wide">
        Utrains Portal
      </Link>
      <nav className="hidden gap-8 text-xs font-semibold uppercase tracking-[0.2em] md:flex">
        {authed ? (
          <>
            <Link to="/grades" className="opacity-80 transition-opacity hover:opacity-60">
              Grades
            </Link>
            <Link to="/courses" className="opacity-80 transition-opacity hover:opacity-60">
              Courses
            </Link>
            <Link to="/assignments" className="opacity-80 transition-opacity hover:opacity-60">
              Assignments
            </Link>
            <button onClick={signOut} className="opacity-80 transition-opacity hover:opacity-60">
              Sign Out
            </button>
          </>
        ) : (
          <Link to="/login" className="opacity-80 transition-opacity hover:opacity-60">
            Sign In
          </Link>
        )}
      </nav>
    </header>
  );
}
