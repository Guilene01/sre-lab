import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Nav from "../components/Nav";
import { LineSkeleton } from "../components/Skeleton";
import { api } from "../api";
import { useToast } from "../components/Toast";

const agents = ["Alex Chen", "Priya Iyer", "Jordan Blake"];
const statuses = ["open", "in_progress", "resolved", "closed"];

export default function TicketDetail() {
  const { id } = useParams();
  const [ticket, setTicket] = useState(null);
  const [error, setError] = useState(null);
  const [comment, setComment] = useState("");
  const [posting, setPosting] = useState(false);
  const toast = useToast();

  function load() {
    api(`/tickets/${id}`).then(setTicket).catch((err) => setError(err.message));
  }

  useEffect(load, [id]);

  async function updateTicket(fields) {
    try {
      await api(`/tickets/${id}`, { method: "PATCH", body: JSON.stringify(fields) });
      toast("Ticket updated");
      load();
    } catch (err) {
      toast(err.message, "error");
    }
  }

  async function addComment(e) {
    e.preventDefault();
    setPosting(true);
    try {
      await api(`/tickets/${id}/comments`, {
        method: "POST",
        body: JSON.stringify({ author: "Support Agent", body: comment }),
      });
      setComment("");
      toast("Comment added");
      load();
    } catch (err) {
      toast(err.message, "error");
    } finally {
      setPosting(false);
    }
  }

  if (error) return <p className="p-16 text-sm text-red-700">Couldn&apos;t load ticket: {error}</p>;

  return (
    <div>
      <div className="relative bg-anchor-slate py-10">
        <Nav dark />
      </div>
      <div className="mx-auto max-w-2xl px-8 py-16">
        {!ticket && (
          <div className="space-y-3">
            <LineSkeleton className="h-8 w-2/3" />
            <LineSkeleton className="h-20 w-full" />
          </div>
        )}
        {ticket && (
          <>
            <h1 className="font-display text-2xl">{ticket.subject}</h1>
            <p className="mt-3 text-sm text-anchor-slate/70">{ticket.description}</p>

            <div className="mt-6 flex flex-wrap items-center gap-4">
              <select
                value={ticket.status}
                onChange={(e) => updateTicket({ status: e.target.value })}
                className="rounded-md border border-anchor-slate/20 bg-white px-3 py-2 text-xs font-semibold uppercase tracking-wider"
              >
                {statuses.map((s) => (
                  <option key={s} value={s}>
                    {s.replace("_", " ")}
                  </option>
                ))}
              </select>
              <select
                value={ticket.assignee || ""}
                onChange={(e) => updateTicket({ assignee: e.target.value })}
                className="rounded-md border border-anchor-slate/20 bg-white px-3 py-2 text-xs font-semibold uppercase tracking-wider"
              >
                <option value="">Unassigned</option>
                {agents.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </div>

            <h2 className="font-display mt-10 text-lg">Comments</h2>
            <div className="mt-4 space-y-4">
              {ticket.comments.length === 0 && (
                <p className="text-sm text-anchor-slate/50">No comments yet.</p>
              )}
              {ticket.comments.map((c) => (
                <div key={c.id} className="rounded-md bg-white p-4 shadow-sm">
                  <p className="text-xs font-semibold text-anchor-teal">{c.author}</p>
                  <p className="mt-1 text-sm">{c.body}</p>
                </div>
              ))}
            </div>

            <form onSubmit={addComment} className="mt-6 flex gap-3">
              <input
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Add a comment..."
                required
                className="flex-1 rounded-md border border-anchor-slate/20 bg-white px-4 py-3 text-sm focus:border-anchor-teal focus:outline-none"
              />
              <button type="submit" disabled={posting} className="btn-solid disabled:opacity-50">
                {posting ? "Posting..." : "Post"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
