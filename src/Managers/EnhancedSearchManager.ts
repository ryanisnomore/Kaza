/**
 * EnhancedSearchManager - Intelligent search with platform detection and fallback
 */

import { Kazagumo } from '../Kazagumo';
import { 
  KazagumoSearchOptions, 
  KazagumoSearchResult, 
  KazagumoTrack,
  URLInfo 
} from '../types';
import { ErrorHandler, ErrorCode } from '../Utils/ErrorHandler';

interface SearchCache {
  [key: string]: {
    result: KazagumoSearchResult;
    timestamp: number;
    ttl: number;
  };
}

interface PlatformEngine {
  name: string;
  prefix: string;
  enabled: boolean;
  priority: number;
}

export class EnhancedSearchManager {
  private readonly kazagumo: Kazagumo;
  private readonly errorHandler: ErrorHandler;
  private readonly cache: SearchCache = {};
  private readonly cacheCleanupInterval: NodeJS.Timer;
  
  private readonly platformEngines: Record<string, PlatformEngine> = {
    youtube: { name: 'YouTube', prefix: 'ytsearch', enabled: true, priority: 1 },
    youtubeMusic: { name: 'YouTube Music', prefix: 'ytmsearch', enabled: true, priority: 2 },
    spotify: { name: 'Spotify', prefix: 'spsearch', enabled: true, priority: 3 },
    appleMusic: { name: 'Apple Music', prefix: 'amsearch', enabled: true, priority: 4 },
    deezer: { name: 'Deezer', prefix: 'dzsearch', enabled: true, priority: 5 },
    soundcloud: { name: 'SoundCloud', prefix: 'scsearch', enabled: true, priority: 6 },
    jiosaavn: { name: 'JioSaavn', prefix: 'jiosaavn', enabled: true, priority: 7 },
    qobuz: { name: 'Qobuz', prefix: 'qobuz', enabled: true, priority: 8 },
    tidal: { name: 'Tidal', prefix: 'tidal', enabled: true, priority: 9 },
    bandcamp: { name: 'Bandcamp', prefix: 'bandcamp', enabled: true, priority: 10 }
  };

  constructor(kazagumo: Kazagumo) {
    this.kazagumo = kazagumo;
    this.errorHandler = new ErrorHandler();
    
    // Clean up cache every 5 minutes
    this.cacheCleanupInterval = setInterval(() => {
      this.cleanupCache();
    }, 5 * 60 * 1000);
  }

  /**
   * Main search method with caching and error handling
   */
  public async search(query: string, options: KazagumoSearchOptions = {}): Promise<KazagumoSearchResult> {
    const cacheKey = this.getCacheKey(query, options);
    
    // Check cache first
    if (options.cacheResults !== false) {
      const cached = this.getFromCache(cacheKey);
      if (cached) {
        return cached;
      }
    }

    const searchEngine = this.getSearchEngine(query, options);
    const searchQuery = this.formatSearchQuery(query, searchEngine);

    try {
      const result = await this.performSearch(searchQuery, options);
      
      // Cache successful results
      if (options.cacheResults !== false && result.tracks.length > 0) {
        this.addToCache(cacheKey, result, options);
      }
      
      return result;
    } catch (error) {
      throw this.errorHandler.createError(
        ErrorCode.SEARCH_FAILED,
        `Search failed for query "${query}": ${(error as Error).message}`,
        true,
        ['Check your query format', 'Try a different search engine', 'Verify Lavalink server status']
      );
    }
  }

  /**
   * Search with automatic fallback to other engines
   */
  public async searchWithFallback(query: string, options: KazagumoSearchOptions = {}): Promise<KazagumoSearchResult> {
    const engines = this.getFallbackEngines(options);
    let lastError: Error | null = null;

    for (const engine of engines) {
      try {
        const searchQuery = this.formatSearchQuery(query, engine);
        const result = await this.performSearch(searchQuery, options);
        
        if (result.tracks.length > 0) {
          return result;
        }
      } catch (error) {
        lastError = error as Error;
        continue;
      }
    }

    throw this.errorHandler.createError(
      ErrorCode.SEARCH_NO_RESULTS,
      `No results found for query "${query}" after trying ${engines.length} search engines`,
      true,
      ['Try different keywords', 'Check if the content exists', 'Verify your search terms']
    );
  }

  /**
   * Search by URL with platform detection
   */
  public async searchByURL(url: string, options: KazagumoSearchOptions = {}): Promise<KazagumoSearchResult> {
    const urlInfo = this.kazagumo.urlParser.parseURL(url);
    
    if (!urlInfo.isValid) {
      throw this.errorHandler.createError(
        ErrorCode.INVALID_URL,
        `Invalid URL format: ${url}`,
        false,
        ['Check URL format', 'Ensure URL is from a supported platform']
      );
    }

    // Direct URL search
    try {
      const result = await this.performSearch(url, options);
      return result;
    } catch (error) {
      // Fallback to platform-specific search
      return await this.searchPlatform(urlInfo.platform, url, options);
    }
  }

  /**
   * Platform-specific search
   */
  public async searchPlatform(platform: string, query: string, options: KazagumoSearchOptions = {}): Promise<KazagumoSearchResult> {
    const engine = this.platformEngines[platform];
    
    if (!engine || !engine.enabled) {
      throw this.errorHandler.createError(
        ErrorCode.PLATFORM_NOT_SUPPORTED,
        `Platform "${platform}" is not supported or disabled`,
        false,
        ['Check supported platforms', 'Enable platform in configuration']
      );
    }

    const searchQuery = this.formatSearchQuery(query, engine.prefix);
    return await this.performSearch(searchQuery, options);
  }

  /**
   * Get search engine based on query and options
   */
  private getSearchEngine(query: string, options: KazagumoSearchOptions): string {
    // If query already has a prefix, use it
    if (this.hasSearchPrefix(query)) {
      return query.split(':')[0] || 'unknown';
    }

    // Use default search engine
    return this.kazagumo.options.defaultSearchEngine || 'ytsearch';
  }

  /**
   * Check if query has search prefix
   */
  private hasSearchPrefix(query: string): boolean {
    const prefixes = Object.values(this.platformEngines).map(e => e.prefix);
    return prefixes.some(prefix => query.startsWith(prefix + ':'));
  }

  /**
   * Format search query with appropriate prefix
   */
  private formatSearchQuery(query: string, engine: string): string {
    if (this.hasSearchPrefix(query)) {
      return query;
    }

    return `${engine}:${query}`;
  }

  /**
   * Get fallback engines in priority order
   */
  private getFallbackEngines(options: KazagumoSearchOptions): string[] {
    const fallbacks = options.fallbackEngines || [
      'ytsearch',
      'ytmsearch',
      'spsearch',
      'scsearch'
    ];

    return fallbacks.filter(engine => {
      const platform = Object.values(this.platformEngines).find(p => p.prefix === engine);
      return platform?.enabled;
    });
  }

  /**
   * Perform the actual search with retry logic
   */
  private async performSearch(query: string, options: KazagumoSearchOptions): Promise<KazagumoSearchResult> {
    const retryAttempts = options.retryAttempts || 3;
    const timeout = options.timeout || 15000;
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= retryAttempts; attempt++) {
      try {
        const node = this.kazagumo.shoukaku.getIdealNode();
        if (!node) {
          throw new Error('No available nodes');
        }

        const result = await Promise.race([
          node.rest.resolve(query),
          new Promise<never>((_, reject) => {
            setTimeout(() => reject(new Error('Search timeout')), timeout);
          })
        ]);

        return this.processSearchResult(result, options);
      } catch (error) {
        lastError = error as Error;
        
        if (attempt < retryAttempts) {
          await this.delay(1000 * attempt); // Exponential backoff
        }
      }
    }

    throw lastError || new Error('Search failed after all retry attempts');
  }

  /**
   * Process and validate search result
   */
  private processSearchResult(result: any, options: KazagumoSearchOptions): KazagumoSearchResult {
    const processedResult: KazagumoSearchResult = {
      loadType: result.loadType,
      tracks: [],
      playlistInfo: result.playlistInfo,
      exception: result.exception
    };

    if (result.tracks && Array.isArray(result.tracks)) {
      const limit = options.limit || 10;
      processedResult.tracks = result.tracks.slice(0, limit).map((track: any) => {
        const kazagumoTrack: KazagumoTrack = {
          track: track.encoded,
          info: {
            identifier: track.info.identifier,
            title: track.info.title,
            author: track.info.author,
            length: track.info.length,
            artworkUrl: track.info.artworkUrl,
            uri: track.info.uri,
            isrc: track.info.isrc,
            sourceName: track.info.sourceName || 'Unknown',
            isSeekable: track.info.isSeekable || true,
            isStream: track.info.isStream || false,
            position: track.info.position || 0
          },
          pluginInfo: track.pluginInfo,
          userData: options.requester
        };
        return kazagumoTrack;
      });
    }

    return processedResult;
  }

  /**
   * Cache management
   */
  private getCacheKey(query: string, options: KazagumoSearchOptions): string {
    return `${query}_${JSON.stringify(options)}`;
  }

  private getFromCache(key: string): KazagumoSearchResult | null {
    const cached = this.cache[key];
    if (!cached) return null;

    if (Date.now() > cached.timestamp + cached.ttl) {
      delete this.cache[key];
      return null;
    }

    return cached.result;
  }

  private addToCache(key: string, result: KazagumoSearchResult, options: KazagumoSearchOptions): void {
    const ttl = 5 * 60 * 1000; // 5 minutes default
    this.cache[key] = {
      result,
      timestamp: Date.now(),
      ttl
    };
  }

  private cleanupCache(): void {
    const now = Date.now();
    Object.keys(this.cache).forEach(key => {
      const cached = this.cache[key];
      if (cached && now > cached.timestamp + cached.ttl) {
        delete this.cache[key];
      }
    });
  }

  /**
   * Health check for search manager
   */
  public async healthCheck(): Promise<boolean> {
    try {
      const node = this.kazagumo.shoukaku.getIdealNode();
      if (!node) return false;

      // Try a simple search to test connectivity
      await node.rest.resolve('ytsearch:test');
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Check if cache is healthy
   */
  public isCacheHealthy(): boolean {
    return Object.keys(this.cache).length < 10000; // Arbitrary limit
  }

  /**
   * Utility delay function
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Cleanup resources
   */
  public destroy(): void {
    if (this.cacheCleanupInterval) {
      clearInterval(this.cacheCleanupInterval as NodeJS.Timeout);
    }
    
    Object.keys(this.cache).forEach(key => {
      delete this.cache[key];
    });
  }
}
