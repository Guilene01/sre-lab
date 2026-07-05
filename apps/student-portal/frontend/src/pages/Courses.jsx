import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Nav from "../components/Nav";
import { LineSkeleton } from "../components/Skeleton";
import { api, getToken } from "../api";
import { useToast } from "../components/Toast";

export default function Courses() {
  const [courses, setCourses] = useState(null);
  const [error, setError] = useState(null);
  const [enrolling, setEnrolling] = useState(null);
  const navigate = useNavigate();
  const toast = useToast();

  function load() {
    api("/courses").then(setCourses).catch((err) => setError(err.message));
  }

  useEffect(() => {
    if (!getToken()) {
      navigate("/login");
      return;
    }
    load();
  }, [navigate]);

  async function enroll(courseId) {
    setEnrolling(courseId);
    try {
      await api("/enrollments", { method: "POST", body: JSON.stringify({ courseId }) });
      toast("Enrolled successfully");
      load();
    } catch (err) {
      toast(err.message, "error");
    } finally {
      setEnrolling(null);
    }
  }

  return (
    <div>
      <div className="relative bg-up-navy py-10">
        <Nav dark />
      </div>
      <div className="mx-auto max-w-3xl px-8 py-16 md:px-16">
        <h1 className="font-display text-3xl">Courses</h1>

        {error && <p className="mt-8 text-sm text-red-700">{error}</p>}
        {!courses && !error && (
          <div className="mt-8 space-y-3">
            <LineSkeleton className="h-16 w-full" />
            <LineSkeleton className="h-16 w-full" />
          </div>
        )}
        {courses && (
          <div className="mt-8 divide-y divide-up-navy/10 border-y border-up-navy/10">
            {courses.map((c) => (
              <div key={c.id} className="flex items-center justify-between py-4">
                <div>
                  <p className="text-sm font-semibold">
                    {c.code} &middot; {c.title}
                  </p>
                  <p className="mt-1 text-xs text-up-navy/50">
                    {c.instructor} &middot; {c.credits} credits
                  </p>
                </div>
                {c.enrolled ? (
                  <span className="text-xs font-semibold uppercase tracking-wider text-up-gold">Enrolled</span>
                ) : (
                  <button
                    onClick={() => enroll(c.id)}
                    disabled={enrolling === c.id}
                    className="btn-ghost !px-4 !py-2 disabled:opacity-50"
                  >
                    {enrolling === c.id ? "Enrolling..." : "Enroll"}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
