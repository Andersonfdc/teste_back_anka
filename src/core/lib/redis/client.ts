import * as redis from "redis";
import { env } from "@/env";

let redisClient: redis.RedisClientType | null = null;

const getRedisClient = async () => {
  if (!env.REDIS_URL) {
    return null;
  }

  if (!redisClient) {
    redisClient = redis.createClient({
      url: env.REDIS_URL,
    });

    redisClient.on("error", (err) => {
      console.error("Redis Client Error:", err);
    });

    redisClient.on("connect", () => {
      console.log("Redis Client Connected");
    });

    redisClient.on("ready", () => {
      console.log("Redis Client Ready");
    });

    redisClient.on("reconnecting", () => {
      console.log("Redis Client Reconnecting...");
    });

    try {
      await redisClient.connect();
    } catch (error) {
      console.error("Failed to connect to Redis:", error);
      redisClient = null;
      throw error;
    }
  }

  return redisClient;
};

export { getRedisClient };
