import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Nav from "../components/Nav";
import { api } from "../api";
import { useToast } from "../components/Toast";

export default function NewTicket() {
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("medium");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const toast = useToast();

  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const ticket = await api("/tickets", {
        method: "POST",
        body: JSON.stringify({ subject, description, priority }),
      });
      toast("Ticket created");
      navigate(`/tickets/${ticket.id}`);
    } catch (err) {
      toast(err.message, "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="relative bg-anchor-slate py-10">
        <Nav dark />
      </div>
      <div className="mx-auto max-w-lg px-8 py-16">
        <h1 className="font-display text-3xl">New Ticket</h1>
        <form onSubmit={submit} className="mt-8 space-y-4">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-anchor-slate/60">Subject</label>
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              required
              className="mt-1 w-full rounded-md border border-anchor-slate/20 bg-white px-4 py-3 text-sm focus:border-anchor-teal focus:outline-none"
            />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-anchor-slate/60">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              rows={5}
              className="mt-1 w-full rounded-md border border-anchor-slate/20 bg-white px-4 py-3 text-sm focus:border-anchor-teal focus:outline-none"
            />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-anchor-slate/60">Priority</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="mt-1 w-full rounded-md border border-anchor-slate/20 bg-white px-4 py-3 text-sm focus:border-anchor-teal focus:outline-none"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
          <button type="submit" disabled={loading} className="btn-solid w-full disabled:opacity-50">
            {loading ? "Submitting..." : "Submit Ticket"}
          </button>
        </form>
      </div>
    </div>
  );
}
