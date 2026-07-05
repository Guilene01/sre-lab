const crypto = require("crypto");
const express = require("express");
const { pool } = require("./db");

const router = express.Router();

async function requireAuth(req, res, next) {
  const token = (req.header("authorization") || "").replace(/^Bearer\s+/i, "");
  if (!token) return res.status(401).json({ error: "missing token" });
  const result = await pool.query(
    `SELECT s.id, s.full_name, s.major FROM sessions se JOIN students s ON s.id = se.student_id WHERE se.token = $1`,
    [token]
  );
  if (result.rows.length === 0) return res.status(401).json({ error: "invalid or expired token" });
  req.student = result.rows[0];
  next();
}

router.post("/auth/login", async (req, res, next) => {
  try {
    const { username, password } = req.body;
    const result = await pool.query(
      "SELECT id, full_name, major FROM students WHERE username = $1 AND password = $2",
      [username, password]
    );
    if (result.rows.length === 0) return res.status(401).json({ error: "invalid credentials" });

    const token = crypto.randomBytes(24).toString("hex");
    await pool.query("INSERT INTO sessions (token, student_id) VALUES ($1, $2)", [token, result.rows[0].id]);
    res.json({ token, student: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

router.get("/courses", requireAuth, async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT c.id, c.code, c.title, c.instructor, c.credits,
              EXISTS(SELECT 1 FROM enrollments e WHERE e.course_id = c.id AND e.student_id = $1) AS enrolled
       FROM courses c ORDER BY c.code`,
      [req.student.id]
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

router.post("/enrollments", requireAuth, async (req, res, next) => {
  try {
    const { courseId } = req.body;
    await pool.query(
      "INSERT INTO enrollments (student_id, course_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
      [req.student.id, courseId]
    );
    res.status(201).json({ ok: true });
  } catch (err) {
    next(err);
  }
});

router.get("/grades", requireAuth, async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT g.id, g.assignment_name, g.grade, g.graded_at, c.code, c.title
       FROM grades g JOIN courses c ON c.id = g.course_id
       WHERE g.student_id = $1 ORDER BY g.graded_at DESC`,
      [req.student.id]
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

router.get("/assignments", requireAuth, async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT a.id, a.title, a.due_date, c.code, c.title AS course_title,
              EXISTS(SELECT 1 FROM submissions s WHERE s.assignment_id = a.id AND s.student_id = $1) AS submitted
       FROM assignments a
       JOIN courses c ON c.id = a.course_id
       JOIN enrollments e ON e.course_id = a.course_id AND e.student_id = $1
       ORDER BY a.due_date`,
      [req.student.id]
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

router.post("/assignments/:id/submit", requireAuth, async (req, res, next) => {
  try {
    const { content } = req.body;
    if (!content) return res.status(400).json({ error: "submission content required" });
    await pool.query(
      `INSERT INTO submissions (assignment_id, student_id, content) VALUES ($1, $2, $3)
       ON CONFLICT (assignment_id, student_id) DO UPDATE SET content = $3, submitted_at = now()`,
      [req.params.id, req.student.id, content]
    );
    res.status(201).json({ ok: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
