const express = require("express");
const { pool } = require("./db");

const router = express.Router();

function sessionId(req) {
  return req.header("x-session-id") || "anonymous";
}

router.get("/products", async (req, res, next) => {
  try {
    const { category } = req.query;
    const result = category
      ? await pool.query("SELECT * FROM products WHERE category = $1 ORDER BY id", [category])
      : await pool.query("SELECT * FROM products ORDER BY id");
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

router.get("/products/:id", async (req, res, next) => {
  try {
    const result = await pool.query("SELECT * FROM products WHERE id = $1", [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: "not found" });
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

router.get("/cart", async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT ci.id, ci.quantity, p.id AS product_id, p.name, p.price_cents, p.image_url
       FROM cart_items ci JOIN products p ON p.id = ci.product_id
       WHERE ci.session_id = $1 ORDER BY ci.id`,
      [sessionId(req)]
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

router.post("/cart/items", async (req, res, next) => {
  try {
    const { productId, quantity } = req.body;
    await pool.query(
      "INSERT INTO cart_items (session_id, product_id, quantity) VALUES ($1, $2, $3)",
      [sessionId(req), productId, quantity || 1]
    );
    res.status(201).json({ ok: true });
  } catch (err) {
    next(err);
  }
});

router.delete("/cart/items/:id", async (req, res, next) => {
  try {
    await pool.query("DELETE FROM cart_items WHERE id = $1 AND session_id = $2", [
      req.params.id,
      sessionId(req),
    ]);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

// Simulates a call to an external payment processor -- a natural place for
// students to see a downstream span in APM and to inject chaos.
async function callPaymentProcessor(totalCents) {
  await new Promise((resolve) => setTimeout(resolve, 150 + Math.random() * 200));
  return { approved: true, authCode: `AUTH-${Math.floor(Math.random() * 1e8)}`, totalCents };
}

router.post("/checkout", async (req, res, next) => {
  const client = await pool.connect();
  try {
    const sid = sessionId(req);
    const items = await client.query(
      `SELECT ci.id, ci.quantity, p.id AS product_id, p.price_cents
       FROM cart_items ci JOIN products p ON p.id = ci.product_id
       WHERE ci.session_id = $1`,
      [sid]
    );
    if (items.rows.length === 0) return res.status(400).json({ error: "cart is empty" });

    const totalCents = items.rows.reduce((sum, r) => sum + r.price_cents * r.quantity, 0);
    const payment = await callPaymentProcessor(totalCents);

    await client.query("BEGIN");
    const order = await client.query(
      "INSERT INTO orders (session_id, total_cents, status) VALUES ($1, $2, $3) RETURNING id",
      [sid, totalCents, payment.approved ? "paid" : "payment_failed"]
    );
    for (const item of items.rows) {
      await client.query(
        "INSERT INTO order_items (order_id, product_id, quantity, price_cents) VALUES ($1, $2, $3, $4)",
        [order.rows[0].id, item.product_id, item.quantity, item.price_cents]
      );
    }
    await client.query("DELETE FROM cart_items WHERE session_id = $1", [sid]);
    await client.query("COMMIT");

    res.status(201).json({ orderId: order.rows[0].id, totalCents, payment });
  } catch (err) {
    await client.query("ROLLBACK");
    next(err);
  } finally {
    client.release();
  }
});

router.get("/orders", async (req, res, next) => {
  try {
    const result = await pool.query(
      "SELECT * FROM orders WHERE session_id = $1 ORDER BY created_at DESC",
      [sessionId(req)]
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
