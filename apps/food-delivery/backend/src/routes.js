const express = require("express");
const { pool } = require("./db");
const redis = require("./cache");

const router = express.Router();

function sessionId(req) {
  return req.header("x-session-id") || "anonymous";
}

function computeStatus(createdAt) {
  const elapsedSeconds = (Date.now() - new Date(createdAt).getTime()) / 1000;
  if (elapsedSeconds < 8) return "placed";
  if (elapsedSeconds < 16) return "preparing";
  if (elapsedSeconds < 24) return "out_for_delivery";
  return "delivered";
}

router.get("/restaurants", async (req, res, next) => {
  try {
    const result = await pool.query("SELECT * FROM restaurants ORDER BY id");
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

router.get("/restaurants/:id/menu", async (req, res, next) => {
  try {
    const result = await pool.query("SELECT * FROM menu_items WHERE restaurant_id = $1 ORDER BY id", [
      req.params.id,
    ]);
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

router.post("/orders", async (req, res, next) => {
  const client = await pool.connect();
  try {
    const { restaurantId, items } = req.body;
    if (!items || items.length === 0) return res.status(400).json({ error: "no items" });

    const menuItemIds = items.map((i) => i.menuItemId);
    const menuItems = await client.query("SELECT id, price_cents FROM menu_items WHERE id = ANY($1)", [
      menuItemIds,
    ]);
    const priceById = Object.fromEntries(menuItems.rows.map((r) => [r.id, r.price_cents]));
    const totalCents = items.reduce((sum, i) => sum + priceById[i.menuItemId] * i.quantity, 0);

    await client.query("BEGIN");
    const order = await client.query(
      "INSERT INTO orders (session_id, restaurant_id, total_cents) VALUES ($1, $2, $3) RETURNING id, created_at",
      [sessionId(req), restaurantId, totalCents]
    );
    for (const item of items) {
      await client.query(
        "INSERT INTO order_items (order_id, menu_item_id, quantity, price_cents) VALUES ($1, $2, $3, $4)",
        [order.rows[0].id, item.menuItemId, item.quantity, priceById[item.menuItemId]]
      );
    }
    await client.query("COMMIT");

    // Redis is a best-effort cache, not the source of truth -- an order
    // that's already committed to Postgres must still succeed even if the
    // cache write fails (e.g. Redis is down).
    try {
      await redis.set(`order:status:${order.rows[0].id}`, "placed", "EX", 5);
    } catch (cacheErr) {
      console.error("Failed to warm status cache (non-fatal):", cacheErr.message);
    }
    res.status(201).json({ orderId: order.rows[0].id, totalCents, status: "placed" });
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
      `SELECT o.id, o.total_cents, o.created_at, r.name AS restaurant_name
       FROM orders o JOIN restaurants r ON r.id = o.restaurant_id
       WHERE o.session_id = $1 ORDER BY o.created_at DESC`,
      [sessionId(req)]
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

router.get("/orders/:id/status", async (req, res, next) => {
  try {
    const cacheKey = `order:status:${req.params.id}`;

    // Cache reads/writes are best-effort: if Redis is unavailable, fall
    // back to computing the status straight from Postgres rather than
    // failing the request.
    let cached = null;
    try {
      cached = await redis.get(cacheKey);
    } catch (cacheErr) {
      console.error("Cache read failed (falling back to db):", cacheErr.message);
    }
    if (cached) {
      return res.json({ status: cached, cached: true });
    }

    const order = await pool.query("SELECT created_at FROM orders WHERE id = $1 AND session_id = $2", [
      req.params.id,
      sessionId(req),
    ]);
    if (order.rows.length === 0) return res.status(404).json({ error: "order not found" });

    const status = computeStatus(order.rows[0].created_at);
    try {
      await redis.set(cacheKey, status, "EX", 5);
    } catch (cacheErr) {
      console.error("Cache write failed (non-fatal):", cacheErr.message);
    }
    res.json({ status, cached: false });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
