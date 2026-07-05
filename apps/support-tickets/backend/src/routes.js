const express = require("express");
const { pool } = require("./db");

const router = express.Router();

router.get("/tickets", async (req, res, next) => {
  try {
    const { status } = req.query;
    const result = status
      ? await pool.query("SELECT * FROM tickets WHERE status = $1 ORDER BY created_at DESC", [status])
      : await pool.query("SELECT * FROM tickets ORDER BY created_at DESC");
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

router.post("/tickets", async (req, res, next) => {
  try {
    const { subject, description, priority } = req.body;
    if (!subject || !description) return res.status(400).json({ error: "subject and description required" });
    const result = await pool.query(
      "INSERT INTO tickets (subject, description, priority) VALUES ($1, $2, $3) RETURNING *",
      [subject, description, priority || "medium"]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

router.get("/tickets/:id", async (req, res, next) => {
  try {
    const ticket = await pool.query("SELECT * FROM tickets WHERE id = $1", [req.params.id]);
    if (ticket.rows.length === 0) return res.status(404).json({ error: "not found" });
    const comments = await pool.query("SELECT * FROM comments WHERE ticket_id = $1 ORDER BY created_at", [
      req.params.id,
    ]);
    res.json({ ...ticket.rows[0], comments: comments.rows });
  } catch (err) {
    next(err);
  }
});

router.patch("/tickets/:id", async (req, res, next) => {
  try {
    const { status, assignee } = req.body;
    const result = await pool.query(
      `UPDATE tickets SET
         status = COALESCE($1, status),
         assignee = COALESCE($2, assignee),
         updated_at = now()
       WHERE id = $3 RETURNING *`,
      [status, assignee, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: "not found" });
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

router.post("/tickets/:id/comments", async (req, res, next) => {
  try {
    const { author, body } = req.body;
    if (!body) return res.status(400).json({ error: "comment body required" });
    const result = await pool.query(
      "INSERT INTO comments (ticket_id, author, body) VALUES ($1, $2, $3) RETURNING *",
      [req.params.id, author || "Support Agent", body]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
