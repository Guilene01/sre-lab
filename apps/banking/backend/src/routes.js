const crypto = require("crypto");
const express = require("express");
const { pool } = require("./db");

const router = express.Router();

async function requireAuth(req, res, next) {
  const token = (req.header("authorization") || "").replace(/^Bearer\s+/i, "");
  if (!token) return res.status(401).json({ error: "missing token" });
  const result = await pool.query(
    `SELECT u.id, u.full_name FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token = $1`,
    [token]
  );
  if (result.rows.length === 0) return res.status(401).json({ error: "invalid or expired token" });
  req.user = result.rows[0];
  next();
}

router.post("/auth/login", async (req, res, next) => {
  try {
    const { username, password } = req.body;
    const result = await pool.query(
      "SELECT id, full_name FROM users WHERE username = $1 AND password = $2",
      [username, password]
    );
    if (result.rows.length === 0) return res.status(401).json({ error: "invalid credentials" });

    const token = crypto.randomBytes(24).toString("hex");
    await pool.query("INSERT INTO sessions (token, user_id) VALUES ($1, $2)", [token, result.rows[0].id]);
    res.json({ token, user: { id: result.rows[0].id, fullName: result.rows[0].full_name } });
  } catch (err) {
    next(err);
  }
});

router.get("/accounts/me", requireAuth, async (req, res, next) => {
  try {
    const result = await pool.query(
      "SELECT account_number, balance_cents FROM accounts WHERE user_id = $1",
      [req.user.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: "no account found" });
    res.json({ fullName: req.user.full_name, ...result.rows[0] });
  } catch (err) {
    next(err);
  }
});

router.get("/accounts/me/transactions", requireAuth, async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT t.id, t.type, t.amount_cents, t.counterparty, t.created_at
       FROM transactions t JOIN accounts a ON a.id = t.account_id
       WHERE a.user_id = $1 ORDER BY t.created_at DESC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

router.post("/transfer", requireAuth, async (req, res, next) => {
  const client = await pool.connect();
  try {
    const { toAccountNumber, amountCents } = req.body;
    if (!amountCents || amountCents <= 0) return res.status(400).json({ error: "invalid amount" });

    await client.query("BEGIN");
    const fromAccount = await client.query(
      "SELECT id, account_number, balance_cents FROM accounts WHERE user_id = $1 FOR UPDATE",
      [req.user.id]
    );
    const from = fromAccount.rows[0];
    if (from.balance_cents < amountCents) {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "insufficient funds" });
    }

    const toAccount = await client.query(
      "SELECT id FROM accounts WHERE account_number = $1 FOR UPDATE",
      [toAccountNumber]
    );
    if (toAccount.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "recipient account not found" });
    }

    await client.query("UPDATE accounts SET balance_cents = balance_cents - $1 WHERE id = $2", [
      amountCents,
      from.id,
    ]);
    await client.query("UPDATE accounts SET balance_cents = balance_cents + $1 WHERE id = $2", [
      amountCents,
      toAccount.rows[0].id,
    ]);
    await client.query(
      "INSERT INTO transactions (account_id, type, amount_cents, counterparty) VALUES ($1, 'debit', $2, $3)",
      [from.id, amountCents, toAccountNumber]
    );
    await client.query(
      "INSERT INTO transactions (account_id, type, amount_cents, counterparty) VALUES ($1, 'credit', $2, $3)",
      [toAccount.rows[0].id, amountCents, from.account_number]
    );
    await client.query("COMMIT");
    res.json({ ok: true });
  } catch (err) {
    await client.query("ROLLBACK");
    next(err);
  } finally {
    client.release();
  }
});

module.exports = router;
