import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Nav from "../components/Nav";
import { LineSkeleton } from "../components/Skeleton";
import { api, getToken } from "../api";
import { useToast } from "../components/Toast";

export default function Assignments() {
  const [assignments, setAssignments] = useState(null);
  const [error, setError] = useState(null);
  const [drafts, setDrafts] = useState({});
  const [submitting, setSubmitting] = useState(null);
  const navigate = useNavigate();
  const toast = useToast();

  function load() {
    api("/assignments").then(setAssignments).catch((err) => setError(err.message));
  }

  useEffect(() => {
    if (!getToken()) {
      navigate("/login");
      return;
    }
    load();
  }, [navigate]);

  async function submit(id) {
    setSubmitting(id);
    try {
      await api(`/assignments/${id}/submit`, {
        method: "POST",
        body: JSON.stringify({ content: drafts[id] || "Submitted via student portal." }),
      });
      toast("Assignment submitted");
      load();
    } catch (err) {
      toast(err.message, "error");
    } finally {
      setSubmitting(null);
    }
  }

  return (
    <div>
      <div className="relative bg-up-navy py-10">
        <Nav dark />
      </div>
      <div className="mx-auto max-w-3xl px-8 py-16 md:px-16">
        <h1 className="font-display text-3xl">Assignments</h1>

        {error && <p className="mt-8 text-sm text-red-700">{error}</p>}
        {!assignments && !error && (
          <div className="mt-8 space-y-3">
            <LineSkeleton className="h-24 w-full" />
          </div>
        )}
        {assignments && assignments.length === 0 && (
          <p className="mt-10 text-sm text-up-navy/50">Enroll in a course to see assignments here.</p>
        )}
        {assignments && assignments.length > 0 && (
          <div className="mt-8 space-y-6">
            {assignments.map((a) => (
              <div key={a.id} className="border border-up-navy/10 p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold">{a.title}</p>
                    <p className="mt-1 text-xs text-up-navy/50">
                      {a.code} &middot; Due {new Date(a.due_date).toLocaleDateString()}
                    </p>
                  </div>
                  {a.submitted && (
                    <span className="text-xs font-semibold uppercase tracking-wider text-up-gold">Submitted</span>
                  )}
                </div>
                {!a.submitted && (
                  <div className="mt-4 flex gap-3">
                    <input
                      placeholder="Link to your work..."
                      value={drafts[a.id] || ""}
                      onChange={(e) => setDrafts((d) => ({ ...d, [a.id]: e.target.value }))}
                      className="flex-1 border border-up-navy/20 bg-white px-3 py-2 text-sm focus:border-up-navy focus:outline-none"
                    />
                    <button
                      onClick={() => submit(a.id)}
                      disabled={submitting === a.id}
                      className="btn-solid !px-4 disabled:opacity-50"
                    >
                      {submitting === a.id ? "Submitting..." : "Submit"}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
