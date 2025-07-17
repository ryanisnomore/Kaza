/**
 * Kazagumo - Advanced Lavalink wrapper with intelligent multi-platform search
 */
import { EventEmitter } from 'events';
import { Shoukaku, Connector } from 'shoukaku';
import { KazagumoPlayer } from './Managers/KazagumoPlayer';
import { EnhancedSearchManager } from './Managers/EnhancedSearchManager';
import { URLParser } from './Utils/URLParser';
import { ErrorHandler } from './Utils/ErrorHandler';
import { PluginConfig } from './config/PluginConfig';
import { KazagumoOptions, KazagumoSearchOptions, KazagumoSearchResult, PlayerOptions, URLInfo, HealthCheckResult, KazagumoStats, KazagumoEvents, KazagumoError } from './types';
/**
 * Main Kazagumo class - Advanced Lavalink wrapper
 */
export declare class Kazagumo extends EventEmitter {
    readonly shoukaku: Shoukaku;
    readonly searchManager: EnhancedSearchManager;
    readonly urlParser: URLParser;
    readonly errorHandler: ErrorHandler;
    readonly pluginConfig: PluginConfig;
    readonly players: Map<string, KazagumoPlayer>;
    readonly options: KazagumoOptions;
    private readonly stats;
    private readonly startTime;
    constructor(options: KazagumoOptions, connector: Connector, nodes: any[]);
    /**
     * Initialize event listeners for Shoukaku
     */
    private initializeEventListeners;
    /**
     * Initialize configured plugins
     */
    private initializePlugins;
    /**
     * Create a new player for a guild
     */
    createPlayer(options: PlayerOptions): KazagumoPlayer;
    /**
     * Get an existing player
     */
    getPlayer(guildId: string): KazagumoPlayer | undefined;
    /**
     * Destroy a player
     */
    destroyPlayer(guildId: string): boolean;
    /**
     * Search for tracks with intelligent platform detection
     */
    search(query: string, options?: KazagumoSearchOptions): Promise<KazagumoSearchResult>;
    /**
     * Auto search with intelligent platform detection and fallback
     */
    autoSearch(query: string, options?: KazagumoSearchOptions): Promise<KazagumoSearchResult>;
    /**
     * Parse URL and get platform information
     */
    parseURL(url: string): URLInfo;
    /**
     * Check if error is a Kaza error
     */
    isKazaError(error: any): error is KazagumoError;
    /**
     * Get current statistics
     */
    getStats(): KazagumoStats;
    /**
     * Perform health check
     */
    healthCheck(): Promise<HealthCheckResult>;
    /**
     * Platform-specific search methods
     */
    searchSpotify(query: string, options?: KazagumoSearchOptions): Promise<KazagumoSearchResult>;
    searchYouTube(query: string, options?: KazagumoSearchOptions): Promise<KazagumoSearchResult>;
    searchAppleMusic(query: string, options?: KazagumoSearchOptions): Promise<KazagumoSearchResult>;
    searchSoundCloud(query: string, options?: KazagumoSearchOptions): Promise<KazagumoSearchResult>;
    /**
     * Clean up resources
     */
    destroy(): Promise<void>;
}
export interface Kazagumo {
    on<K extends keyof KazagumoEvents>(event: K, listener: (...args: KazagumoEvents[K]) => void): this;
    once<K extends keyof KazagumoEvents>(event: K, listener: (...args: KazagumoEvents[K]) => void): this;
    emit<K extends keyof KazagumoEvents>(event: K, ...args: KazagumoEvents[K]): boolean;
    off<K extends keyof KazagumoEvents>(event: K, listener: (...args: KazagumoEvents[K]) => void): this;
    removeAllListeners<K extends keyof KazagumoEvents>(event?: K): this;
}
//# sourceMappingURL=Kazagumo.d.ts.map