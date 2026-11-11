import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';

@Injectable()
export class CacheService implements OnModuleDestroy {
  private readonly logger = new Logger(CacheService.name);
  private client: Redis | null = null;
  private ready = false;

  constructor(private readonly config: ConfigService) {
    const url = this.config.get<string>('REDIS_URL') || process.env.REDIS_URL;
    if (!url) {
      this.logger.warn('REDIS_URL not set — cache disabled');
      return;
    }
    try {
      this.client = new Redis(url, {
        lazyConnect: true,
        maxRetriesPerRequest: 1,
        enableOfflineQueue: false,
        connectTimeout: 1500,
      });
      this.client.on('connect', () => { this.ready = true; this.logger.log('Redis connected'); });
      this.client.on('error', (e: Error) => { this.ready = false; this.logger.warn(`Redis error: ${e.message}`); });
      this.client.on('end', () => { this.ready = false; });
      this.client.connect().catch((e: Error) => this.logger.warn(`Redis connect failed: ${e.message}`));
    } catch (e: any) {
      this.logger.warn(`Redis init failed: ${e?.message || e}`);
      this.client = null;
    }
  }

  async get<T = unknown>(key: string): Promise<T | null> {
    if (!this.client || !this.ready) return null;
    try {
      const v = await this.client.get(key);
      return v ? (JSON.parse(v) as T) : null;
    } catch {
      return null;
    }
  }

  async set(key: string, value: unknown, ttlSeconds = 30): Promise<void> {
    if (!this.client || !this.ready) return;
    try {
      await this.client.set(key, JSON.stringify(value), 'EX', ttlSeconds);
    } catch {
      // ignore cache write errors
    }
  }

  async del(...keys: string[]): Promise<void> {
    if (!this.client || !this.ready || keys.length === 0) return;
    try {
      await this.client.del(...keys);
    } catch {
      // ignore
    }
  }

  async delByPattern(pattern: string): Promise<void> {
    if (!this.client || !this.ready) return;
    try {
      const keys = await this.client.keys(pattern);
      if (keys.length) await this.client.del(...keys);
    } catch {
      // ignore
    }
  }

  async onModuleDestroy() {
    if (this.client) {
      try { await this.client.quit(); } catch {}
    }
  }
}

