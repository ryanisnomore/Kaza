/**
 * Kazagumo - Advanced Lavalink wrapper with intelligent multi-platform search
 */

import { EventEmitter } from 'events';
import { Shoukaku, Connector, Node } from 'shoukaku';
import { KazagumoPlayer } from './Managers/KazagumoPlayer';
import { EnhancedSearchManager } from './Managers/EnhancedSearchManager';
import { URLParser } from './Utils/URLParser';
import { ErrorHandler, ErrorCode } from './Utils/ErrorHandler';
import { PluginConfig } from './config/PluginConfig';
import {
  KazagumoOptions,
  KazagumoSearchOptions,
  KazagumoSearchResult,
  PlayerOptions,
  URLInfo,
  HealthCheckResult,
  KazagumoStats,
  KazagumoEvents,
  KazagumoError
} from './types';

/**
 * Main Kazagumo class - Advanced Lavalink wrapper
 */
export class Kazagumo extends EventEmitter {
  public readonly shoukaku: Shoukaku;
  public readonly searchManager: EnhancedSearchManager;
  public readonly urlParser: URLParser;
  public readonly errorHandler: ErrorHandler;
  public readonly pluginConfig: PluginConfig;
  public readonly players: Map<string, KazagumoPlayer>;
  public readonly options: KazagumoOptions;

  private readonly stats: KazagumoStats;
  private readonly startTime: number;

  constructor(options: KazagumoOptions, connector: Connector, nodes: any[]) {
    super();
    
    this.options = {
      defaultSearchEngine: 'ytsearch',
      ...options
    };

    this.shoukaku = new Shoukaku(connector, nodes);
    this.searchManager = new EnhancedSearchManager(this);
    this.urlParser = new URLParser();
    this.errorHandler = new ErrorHandler();
    this.pluginConfig = new PluginConfig(this.options.plugins || {});
    this.players = new Map();
    this.startTime = Date.now();

    this.stats = {
      players: 0,
      playingPlayers: 0,
      nodes: 0,
      uptime: 0,
      search: {
        totalSearches: 0,
        cacheHits: 0,
        cacheHitRate: 0,
        supportedPlatforms: [
          'youtube',
          'youtubeMusic',
          'spotify',
          'appleMusic',
          'deezer',
          'soundcloud',
          'jiosaavn',
          'qobuz',
          'tidal',
          'bandcamp'
        ]
      }
    };

    this.initializeEventListeners();
    this.initializePlugins();
  }

  /**
   * Initialize event listeners for Shoukaku
   */
  private initializeEventListeners(): void {
    this.shoukaku.on('ready', (name) => {
      this.emit('ready', name);
    });

    this.shoukaku.on('error', (name, error) => {
      this.emit('error', name, error);
    });

    this.shoukaku.on('close', (name, code, reason) => {
      this.emit('close', name, code, reason);
    });

    this.shoukaku.on('disconnect', (name, moved) => {
      this.emit('disconnect', name, Boolean(moved));
    });

    this.shoukaku.on('reconnecting', (name) => {
      this.emit('reconnecting', name);
    });
  }

  /**
   * Initialize configured plugins
   */
  private async initializePlugins(): Promise<void> {
    try {
      await this.pluginConfig.initializePlugins(this);
    } catch (error) {
      this.errorHandler.handleError(error as Error, 'PLUGIN_INITIALIZATION_ERROR');
    }
  }

  /**
   * Create a new player for a guild
   */
  public createPlayer(options: PlayerOptions): KazagumoPlayer {
    const existing = this.players.get(options.guildId);
    if (existing) {
      return existing;
    }

    const player = new KazagumoPlayer(this, options);
    this.players.set(options.guildId, player);
    this.stats.players++;
    
    this.emit('playerCreate', player);
    return player;
  }

  /**
   * Get an existing player
   */
  public getPlayer(guildId: string): KazagumoPlayer | undefined {
    return this.players.get(guildId);
  }

  /**
   * Destroy a player
   */
  public destroyPlayer(guildId: string): boolean {
    const player = this.players.get(guildId);
    if (!player) return false;

    player.destroy();
    this.players.delete(guildId);
    this.stats.players--;
    
    this.emit('playerDestroy', player);
    return true;
  }

  /**
   * Search for tracks with intelligent platform detection
   */
  public async search(query: string, options?: KazagumoSearchOptions): Promise<KazagumoSearchResult> {
    this.stats.search.totalSearches++;
    
    try {
      return await this.searchManager.search(query, options);
    } catch (error) {
      throw this.errorHandler.createError(
        ErrorCode.SEARCH_FAILED,
        `Search failed: ${(error as Error).message}`,
        true,
        ['Check your query format', 'Verify Lavalink server status', 'Try a different search engine']
      );
    }
  }

  /**
   * Auto search with intelligent platform detection and fallback
   */
  public async autoSearch(query: string, options?: KazagumoSearchOptions): Promise<KazagumoSearchResult> {
    const urlInfo = this.urlParser.parseURL(query);
    
    if (urlInfo.isValid) {
      return await this.searchManager.searchByURL(query, options);
    }
    
    return await this.searchManager.searchWithFallback(query, options);
  }

  /**
   * Parse URL and get platform information
   */
  public parseURL(url: string): URLInfo {
    return this.urlParser.parseURL(url);
  }

  /**
   * Check if error is a Kaza error
   */
  public isKazaError(error: any): error is KazagumoError {
    return error && typeof error.code === 'string' && typeof error.recoverable === 'boolean';
  }

  /**
   * Get current statistics
   */
  public getStats(): KazagumoStats {
    this.stats.uptime = Date.now() - this.startTime;
    this.stats.playingPlayers = Array.from(this.players.values()).filter(p => p.playing).length;
    this.stats.nodes = this.shoukaku.nodes.size;
    this.stats.search.cacheHitRate = this.stats.search.totalSearches > 0 
      ? (this.stats.search.cacheHits / this.stats.search.totalSearches) * 100 
      : 0;
    
    return { ...this.stats };
  }

  /**
   * Perform health check
   */
  public async healthCheck(): Promise<HealthCheckResult> {
    const components = {
      shoukaku: this.shoukaku.nodes.size > 0,
      search: await this.searchManager.healthCheck(),
      cache: this.searchManager.isCacheHealthy(),
      plugins: this.pluginConfig.arePluginsHealthy()
    };

    const healthyCount = Object.values(components).filter(Boolean).length;
    const totalCount = Object.keys(components).length;

    let status: 'healthy' | 'degraded' | 'unhealthy';
    if (healthyCount === totalCount) {
      status = 'healthy';
    } else if (healthyCount > totalCount / 2) {
      status = 'degraded';
    } else {
      status = 'unhealthy';
    }

    return {
      status,
      components,
      timestamp: Date.now()
    };
  }

  /**
   * Platform-specific search methods
   */
  public async searchSpotify(query: string, options?: KazagumoSearchOptions): Promise<KazagumoSearchResult> {
    return await this.searchManager.searchPlatform('spotify', query, options);
  }

  public async searchYouTube(query: string, options?: KazagumoSearchOptions): Promise<KazagumoSearchResult> {
    return await this.searchManager.searchPlatform('youtube', query, options);
  }

  public async searchAppleMusic(query: string, options?: KazagumoSearchOptions): Promise<KazagumoSearchResult> {
    return await this.searchManager.searchPlatform('appleMusic', query, options);
  }

  public async searchSoundCloud(query: string, options?: KazagumoSearchOptions): Promise<KazagumoSearchResult> {
    return await this.searchManager.searchPlatform('soundcloud', query, options);
  }

  /**
   * Clean up resources
   */
  public async destroy(): Promise<void> {
    // Destroy all players
    for (const [guildId] of this.players) {
      this.destroyPlayer(guildId);
    }

    // Clean up plugins
    await this.pluginConfig.destroyPlugins();

    // Clean up search manager
    this.searchManager.destroy();

    // Remove all listeners
    this.removeAllListeners();
  }
}

// Type the EventEmitter correctly
export interface Kazagumo {
  on<K extends keyof KazagumoEvents>(event: K, listener: (...args: KazagumoEvents[K]) => void): this;
  once<K extends keyof KazagumoEvents>(event: K, listener: (...args: KazagumoEvents[K]) => void): this;
  emit<K extends keyof KazagumoEvents>(event: K, ...args: KazagumoEvents[K]): boolean;
  off<K extends keyof KazagumoEvents>(event: K, listener: (...args: KazagumoEvents[K]) => void): this;
  removeAllListeners<K extends keyof KazagumoEvents>(event?: K): this;
}
