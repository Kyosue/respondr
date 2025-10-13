import { NetworkManager } from './networkUtils';
import { OfflineStorage } from './offlineStorage';

export interface CacheConfig {
  ttl: number; // Time to live in milliseconds
  maxSize: number; // Maximum cache size in bytes
  priority: 'low' | 'medium' | 'high' | 'critical';
}

export interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
  ttl: number;
  priority: string;
  size: number;
  accessCount: number;
  lastAccessed: number;
}

export class CacheManager {
  private static instance: CacheManager;
  private cache: Map<string, CacheEntry> = new Map();
  private offlineStorage: OfflineStorage;
  private networkManager: NetworkManager;
  private maxCacheSize: number = 50 * 1024 * 1024; // 50MB default
  private cleanupInterval: ReturnType<typeof setInterval> | null = null;

  private constructor() {
    this.offlineStorage = OfflineStorage.getInstance();
    this.networkManager = NetworkManager.getInstance();
    this.startCleanupInterval();
  }

  static getInstance(): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager();
    }
    return CacheManager.instance;
  }

  // Set cache entry
  async set<T>(
    key: string, 
    data: T, 
    config: Partial<CacheConfig> = {}
  ): Promise<void> {
    const ttl = config.ttl || 5 * 60 * 1000; // 5 minutes default
    const priority = config.priority || 'medium';
    const size = this.calculateSize(data);

    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl,
      priority,
      size,
      accessCount: 0,
      lastAccessed: Date.now(),
    };

    // Check if we need to make space
    await this.ensureSpace(size);

    this.cache.set(key, entry);

    // Store critical data in offline storage
    if (priority === 'critical' || priority === 'high') {
      try {
        await this.offlineStorage.saveCriticalData(key, {
          data,
          timestamp: Date.now(),
          ttl,
          priority,
        });
      } catch (error) {
        console.warn('Failed to save critical data to offline storage:', error);
      }
    }
  }

  // Get cache entry
  async get<T>(key: string): Promise<T | null> {
    const entry = this.cache.get(key);
    
    if (!entry) {
      // Try to load from offline storage for critical data
      try {
        const offlineData = await this.offlineStorage.getCriticalDataByKey(key);
        if (offlineData) {
          // Restore to cache
          await this.set(key, offlineData.data, {
            ttl: offlineData.ttl || 5 * 60 * 1000,
            priority: offlineData.priority || 'medium',
          });
          return offlineData.data;
        }
      } catch (error) {
        console.warn('Failed to load from offline storage:', error);
      }
      return null;
    }

    // Check if expired
    if (this.isExpired(entry)) {
      this.cache.delete(key);
      return null;
    }

    // Update access statistics
    entry.accessCount++;
    entry.lastAccessed = Date.now();

    return entry.data as T;
  }

  // Check if entry exists and is valid
  has(key: string): boolean {
    const entry = this.cache.get(key);
    return entry ? !this.isExpired(entry) : false;
  }

  // Delete cache entry
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  // Clear all cache
  clear(): void {
    this.cache.clear();
  }

  // Get cache statistics
  getStats(): {
    size: number;
    count: number;
    hitRate: number;
    entries: Array<{
      key: string;
      size: number;
      age: number;
      accessCount: number;
      priority: string;
    }>;
  } {
    const entries = Array.from(this.cache.entries()).map(([key, entry]) => ({
      key,
      size: entry.size,
      age: Date.now() - entry.timestamp,
      accessCount: entry.accessCount,
      priority: entry.priority,
    }));

    const totalSize = entries.reduce((sum, entry) => sum + entry.size, 0);
    const totalAccesses = entries.reduce((sum, entry) => sum + entry.accessCount, 0);

    return {
      size: totalSize,
      count: entries.length,
      hitRate: totalAccesses > 0 ? entries.reduce((sum, entry) => sum + entry.accessCount, 0) / totalAccesses : 0,
      entries: entries.sort((a, b) => b.accessCount - a.accessCount),
    };
  }

  // Cache with network-aware behavior
  async getOrFetch<T>(
    key: string,
    fetchFn: () => Promise<T>,
    config: Partial<CacheConfig> = {}
  ): Promise<T> {
    // Try to get from cache first
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    // If offline, try to get from offline storage
    if (!this.networkManager.isOnline()) {
      try {
        const offlineData = await this.offlineStorage.getCriticalDataByKey(key);
        if (offlineData && !this.isExpiredOffline(offlineData)) {
          return offlineData.data;
        }
      } catch (error) {
        console.warn('Failed to load from offline storage:', error);
      }
      
      throw new Error('No cached data available and offline');
    }

    // Fetch from network
    try {
      const data = await fetchFn();
      await this.set(key, data, config);
      return data;
    } catch (error) {
      // If network fetch fails, try to return stale data
      const staleData = await this.getStaleData<T>(key);
      if (staleData) {
        console.warn('Using stale data due to network error:', error);
        return staleData;
      }
      throw error;
    }
  }

  // Get stale data (expired but still available)
  private async getStaleData<T>(key: string): Promise<T | null> {
    try {
      const offlineData = await this.offlineStorage.getCriticalDataByKey(key);
      if (offlineData) {
        return offlineData.data;
      }
    } catch (error) {
      console.warn('Failed to get stale data:', error);
    }
    return null;
  }

  // Check if entry is expired
  private isExpired(entry: CacheEntry): boolean {
    return Date.now() - entry.timestamp > entry.ttl;
  }

  // Check if offline data is expired
  private isExpiredOffline(offlineData: any): boolean {
    const ttl = offlineData.ttl || 5 * 60 * 1000;
    return Date.now() - offlineData.timestamp > ttl;
  }

  // Calculate data size
  private calculateSize(data: any): number {
    try {
      return JSON.stringify(data).length * 2; // Rough estimate (2 bytes per char)
    } catch (error) {
      return 1024; // Default size if calculation fails
    }
  }

  // Ensure there's enough space for new entry
  private async ensureSpace(requiredSize: number): Promise<void> {
    const currentSize = this.getCurrentCacheSize();
    
    if (currentSize + requiredSize <= this.maxCacheSize) {
      return;
    }

    // Remove expired entries first
    this.removeExpiredEntries();

    // If still not enough space, remove least recently used entries
    if (this.getCurrentCacheSize() + requiredSize > this.maxCacheSize) {
      this.removeLRUEntries(requiredSize);
    }
  }

  // Get current cache size
  private getCurrentCacheSize(): number {
    return Array.from(this.cache.values()).reduce((sum, entry) => sum + entry.size, 0);
  }

  // Remove expired entries
  private removeExpiredEntries(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }
  }

  // Remove least recently used entries
  private removeLRUEntries(requiredSize: number): void {
    const entries = Array.from(this.cache.entries())
      .sort((a, b) => a[1].lastAccessed - b[1].lastAccessed);

    let freedSize = 0;
    for (const [key, entry] of entries) {
      this.cache.delete(key);
      freedSize += entry.size;
      
      if (freedSize >= requiredSize) {
        break;
      }
    }
  }

  // Start cleanup interval
  private startCleanupInterval(): void {
    this.cleanupInterval = setInterval(() => {
      this.removeExpiredEntries();
    }, 60000); // Cleanup every minute
  }

  // Stop cleanup interval
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }
}
