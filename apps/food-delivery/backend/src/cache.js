const Redis = require("ioredis");

const redis = new Redis({
  host: process.env.REDIS_HOST || "food-delivery-redis",
  port: Number(process.env.REDIS_PORT || 6379),
  lazyConnect: false,
  maxRetriesPerRequest: 2,
});

redis.on("error", (err) => {
  console.error("Redis error", err.message);
});

module.exports = redis;
