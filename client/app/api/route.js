import { Redis } from "@upstash/redis";

// Initialize Redis client
const redis = Redis.fromEnv();

export async function GET(req, res) {
  // Increment the counter
  const newCount = await redis.incr("counter");

  return Response.json({ newCount });
}
