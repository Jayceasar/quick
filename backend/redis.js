import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: "https://fluent-warthog-44116.upstash.io",
  token: "AaxUAAIjcDE3ZWUyYmMzZjM2NDc0NTA3OTk0ZTZiYzQ5NDhjMWUzMnAxMA",
});

await redis.set("name", "julius");
