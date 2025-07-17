/**
 * EnhancedSearchManager - Intelligent search with platform detection and fallback
 */
import { Kazagumo } from '../Kazagumo';
import { KazagumoSearchOptions, KazagumoSearchResult } from '../types';
export declare class EnhancedSearchManager {
    private readonly kazagumo;
    private readonly errorHandler;
    private readonly cache;
    private readonly cacheCleanupInterval;
    private readonly platformEngines;
    constructor(kazagumo: Kazagumo);
    /**
     * Main search method with caching and error handling
     */
    search(query: string, options?: KazagumoSearchOptions): Promise<KazagumoSearchResult>;
    /**
     * Search with automatic fallback to other engines
     */
    searchWithFallback(query: string, options?: KazagumoSearchOptions): Promise<KazagumoSearchResult>;
    /**
     * Search by URL with platform detection
     */
    searchByURL(url: string, options?: KazagumoSearchOptions): Promise<KazagumoSearchResult>;
    /**
     * Platform-specific search
     */
    searchPlatform(platform: string, query: string, options?: KazagumoSearchOptions): Promise<KazagumoSearchResult>;
    /**
     * Get search engine based on query and options
     */
    private getSearchEngine;
    /**
     * Check if query has search prefix
     */
    private hasSearchPrefix;
    /**
     * Format search query with appropriate prefix
     */
    private formatSearchQuery;
    /**
     * Get fallback engines in priority order
     */
    private getFallbackEngines;
    /**
     * Perform the actual search with retry logic
     */
    private performSearch;
    /**
     * Process and validate search result
     */
    private processSearchResult;
    /**
     * Cache management
     */
    private getCacheKey;
    private getFromCache;
    private addToCache;
    private cleanupCache;
    /**
     * Health check for search manager
     */
    healthCheck(): Promise<boolean>;
    /**
     * Check if cache is healthy
     */
    isCacheHealthy(): boolean;
    /**
     * Utility delay function
     */
    private delay;
    /**
     * Cleanup resources
     */
    destroy(): void;
}
//# sourceMappingURL=EnhancedSearchManager.d.ts.map