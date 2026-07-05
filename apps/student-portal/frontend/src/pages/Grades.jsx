import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Nav from "../components/Nav";
import { LineSkeleton } from "../components/Skeleton";
import { api, getToken } from "../api";

export default function Grades() {
  const [grades, setGrades] = useState(null);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!getToken()) {
      navigate("/login");
      return;
    }
    api("/grades").then(setGrades).catch((err) => setError(err.message));
  }, [navigate]);

  return (
    <div>
      <div className="relative bg-up-navy py-10">
        <Nav dark />
      </div>
      <div className="mx-auto max-w-3xl px-8 py-16 md:px-16">
        <h1 className="font-display text-3xl">Grades</h1>

        {error && <p className="mt-8 text-sm text-red-700">{error}</p>}
        {!grades && !error && (
          <div className="mt-8 space-y-3">
            <LineSkeleton className="h-12 w-full" />
            <LineSkeleton className="h-12 w-full" />
          </div>
        )}
        {grades && grades.length === 0 && <p className="mt-10 text-sm text-up-navy/50">No grades yet.</p>}
        {grades && grades.length > 0 && (
          <table className="mt-8 w-full text-left text-sm">
            <thead className="text-xs uppercase tracking-wider text-up-navy/50">
              <tr>
                <th className="pb-3">Course</th>
                <th className="pb-3">Assignment</th>
                <th className="pb-3 text-right">Grade</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-up-navy/10">
              {grades.map((g) => (
                <tr key={g.id}>
                  <td className="py-3">
                    {g.code} &middot; {g.title}
                  </td>
                  <td className="py-3">{g.assignment_name}</td>
                  <td className="py-3 text-right font-semibold">{g.grade}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
