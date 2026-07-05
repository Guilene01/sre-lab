import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Nav from "../components/Nav";
import { api, setToken } from "../api";
import { useToast } from "../components/Toast";

export default function Login() {
  const [username, setUsername] = useState("amara.osei");
  const [password, setPassword] = useState("demo123");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const toast = useToast();

  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await api("/auth/login", { method: "POST", body: JSON.stringify({ username, password }) });
      setToken(result.token);
      toast(`Welcome back, ${result.user.fullName.split(" ")[0]}`);
      navigate("/dashboard");
    } catch (err) {
      toast(err.message, "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="relative bg-meridian-navy py-10">
        <Nav dark />
      </div>
      <div className="mx-auto max-w-sm px-8 py-20">
        <h1 className="font-display text-3xl">Sign in</h1>
        <p className="mt-2 text-sm text-meridian-navy/60">Demo accounts use password "demo123".</p>
        <form onSubmit={submit} className="mt-8 space-y-4">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-meridian-navy/60">
              Username
            </label>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="mt-1 w-full border border-meridian-navy/20 bg-white px-4 py-3 text-sm focus:border-meridian-navy focus:outline-none"
            />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-meridian-navy/60">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full border border-meridian-navy/20 bg-white px-4 py-3 text-sm focus:border-meridian-navy focus:outline-none"
            />
          </div>
          <button type="submit" disabled={loading} className="btn-solid w-full disabled:opacity-50">
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}
