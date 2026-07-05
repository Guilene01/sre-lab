import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Nav from "../components/Nav";
import { LineSkeleton } from "../components/Skeleton";
import { api } from "../api";

const statuses = ["all", "open", "in_progress", "resolved", "closed"];
const priorityColor = {
  urgent: "bg-red-100 text-red-800",
  high: "bg-orange-100 text-orange-800",
  medium: "bg-amber-100 text-amber-800",
  low: "bg-slate-100 text-slate-600",
};

export default function TicketList() {
  const [tickets, setTickets] = useState(null);
  const [error, setError] = useState(null);
  const [status, setStatus] = useState("all");

  useEffect(() => {
    setTickets(null);
    const query = status === "all" ? "" : `?status=${status}`;
    api(`/tickets${query}`).then(setTickets).catch((err) => setError(err.message));
  }, [status]);

  return (
    <div>
      <div className="relative bg-anchor-slate py-16 text-center">
        <Nav dark />
        <h1 className="font-display pt-16 text-3xl text-white md:text-4xl">Ticket Queue</h1>
      </div>

      <section className="mx-auto max-w-4xl px-8 py-14 md:px-16">
        <div className="mb-8 flex flex-wrap gap-6 border-b border-anchor-slate/10 pb-4 text-xs font-semibold uppercase tracking-[0.2em]">
          {statuses.map((s) => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={`transition-opacity hover:opacity-60 ${
                status === s ? "text-anchor-teal underline underline-offset-4" : "opacity-50"
              }`}
            >
              {s.replace("_", " ")}
            </button>
          ))}
        </div>

        {error && <p className="text-sm text-red-700">Couldn&apos;t load tickets: {error}</p>}
        {!tickets && !error && (
          <div className="space-y-3">
            <LineSkeleton className="h-16 w-full" />
            <LineSkeleton className="h-16 w-full" />
          </div>
        )}
        {tickets && tickets.length === 0 && (
          <p className="py-16 text-center text-sm text-anchor-slate/50">No tickets in this view.</p>
        )}
        {tickets && tickets.length > 0 && (
          <div className="divide-y divide-anchor-slate/10">
            {tickets.map((t) => (
              <Link key={t.id} to={`/tickets/${t.id}`} className="flex items-center justify-between py-4">
                <div>
                  <p className="text-sm font-semibold">{t.subject}</p>
                  <p className="mt-1 text-xs text-anchor-slate/50">
                    #{t.id} &middot; {t.assignee || "Unassigned"} &middot;{" "}
                    {new Date(t.created_at).toLocaleDateString()}
                  </p>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${priorityColor[t.priority]}`}>
                  {t.priority}
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
