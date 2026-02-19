import * as redis from "redis";
import { getRedisClient } from "@/core/lib/redis/client";

export class RedisCacheProvider {
  static cache: redis.RedisClientType | null = null;

  static async initialize(): Promise<void> {
    if (!RedisCacheProvider.cache) {
      RedisCacheProvider.cache = await getRedisClient();
    }
  }

  //ttlMinutes -> Time to live in Minutes
  static async set(key: string, value: any, ttlMinutes: number = 5) {
    await RedisCacheProvider.initialize();
    await RedisCacheProvider.cache?.set(key, JSON.stringify(value), {
      EX: ttlMinutes * 60,
    });
  }

  static async get(key: string) {
    await RedisCacheProvider.initialize();
    const value = await RedisCacheProvider.cache?.get(key);
    return value ? JSON.parse(value) : null;
  }

  static async delete(key: string) {
    await RedisCacheProvider.initialize();
    await RedisCacheProvider.cache?.del(key);
  }
}
