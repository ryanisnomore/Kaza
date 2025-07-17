import { 
    KazagumoSearchOptions, 
    KazagumoSearchResult, 
    KazagumoTrack,
    SearchEngine 
} from '../types';
import { URLParser, URLParseResult } from '../utils/URLParser';
import { ErrorHandler, ErrorCode, KazaError } from '../utils/ErrorHandler';

export interface EnhancedSearchOptions extends KazagumoSearchOptions {
    timeout?: number;
    fallbackEngines?: SearchEngine[];
    retryAttempts?: number;
    cacheResults?: boolean;
}

export interface EnhancedSearchResult extends KazagumoSearchResult {
    platform?: string;
    query: string;
    searchEngine: string;
    searchTime?: number;
    fromCache?: boolean;
    exception?: {
        message: string;
        severity: string;
        code?: string;
        suggestions?: string[];
    };
}

export class EnhancedSearchManager {
    private kazagumo: any;
    private searchCache = new Map<string, { result: EnhancedSearchResult; timestamp: number }>();
    private readonly cacheTimeout = 300000; // 5 minutes
    private searchStats = {
        totalSearches: 0,
        cacheHits: 0,
        errors: 0,
        platformUsage: new Map<string, number>()
    };

    constructor(kazagumo: any) {
        this.kazagumo = kazagumo;
        this.startCacheCleanup();
    }

    /**
     * Enhanced search with intelligent platform detection and comprehensive error handling
     */
    public async search(
        query: string, 
        options: EnhancedSearchOptions = {}
    ): Promise<EnhancedSearchResult> {
        const startTime = Date.now();
        this.searchStats.totalSearches++;
        
        try {
            // Check cache first if enabled
            if (options.cacheResults !== false) {
                const cached = this.getCachedResult(query, options);
                if (cached) {
                    this.searchStats.cacheHits++;
                    return { ...cached, fromCache: true, searchTime: Date.now() - startTime };
                }
            }

            // Parse URL and determine platform
            const urlInfo = URLParser.parse(query);
            const searchEngine = this.determineSearchEngine(urlInfo, options.source);
            const formattedQuery = this.formatQuery(query, urlInfo, searchEngine);

            // Update platform usage stats
            this.updatePlatformStats(urlInfo.platform);

            // Get best available node with retry logic
            const result = await this.performSearchWithRetry(
                formattedQuery, 
                searchEngine, 
                options,
                startTime
            );

            // Enhance result with metadata
            const enhancedResult: EnhancedSearchResult = {
                ...result,
                platform: urlInfo.platform,
                query,
                searchEngine,
                searchTime: Date.now() - startTime,
                fromCache: false
            };

            // Cache successful results
            if (result.tracks.length > 0 && options.cacheResults !== false) {
                this.cacheResult(query, options, enhancedResult);
            }

            return enhancedResult;

        } catch (error) {
            this.searchStats.errors++;
            const kazaError = ErrorHandler.isKazaError(error) ? error : 
                ErrorHandler.createError(ErrorCode.SEARCH_FAILED, { originalError: error });

            // Try fallback engines if available
            if (options.fallbackEngines && options.fallbackEngines.length > 0) {
                for (const fallbackEngine of options.fallbackEngines) {
                    try {
                        const fallbackOptions = { 
                            ...options, 
                            source: fallbackEngine, 
                            fallbackEngines: [],
                            retryAttempts: 1
                        };
                        return await this.search(query, fallbackOptions);
                    } catch (fallbackError) {
                        continue;
                    }
                }
            }

            return this.createErrorResult(query, kazaError, Date.now() - startTime);
        }
    }

    /**
     * Perform search with retry logic
     */
    private async performSearchWithRetry(
        formattedQuery: string,
        searchEngine: string,
        options: EnhancedSearchOptions,
        startTime: number
    ): Promise<KazagumoSearchResult> {
        const maxRetries = options.retryAttempts || 2;
        const timeout = options.timeout || 10000;

        return await ErrorHandler.retry(
            async () => {
                const node = this.getBestNode();
                if (!node) {
                    throw ErrorHandler.createError(ErrorCode.NODE_UNAVAILABLE);
                }

                const searchPromise = this.performSearch(node, formattedQuery, options);
                return await ErrorHandler.withTimeout(searchPromise, timeout);
            },
            maxRetries,
            1000,
            [ErrorCode.TIMEOUT, ErrorCode.CONNECTION_FAILED]
        );
    }

    /**
     * Perform the actual search request
     */
    private async performSearch(
        node: any, 
        query: string, 
        options: EnhancedSearchOptions
    ): Promise<KazagumoSearchResult> {
        const result = await node.rest.resolve(query);
        
        if (!result) {
            throw ErrorHandler.createError(ErrorCode.NO_RESULTS, { query });
        }

        if (result.loadType === 'LOAD_FAILED') {
            throw ErrorHandler.createError(ErrorCode.SEARCH_FAILED, { 
                query, 
                exception: result.exception 
            });
        }

        if (result.loadType === 'NO_MATCHES' || !result.tracks || result.tracks.length === 0) {
            throw ErrorHandler.createError(ErrorCode.NO_RESULTS, { query });
        }

        // Process and enhance tracks
        let tracks = result.tracks;
        if (options.limit && tracks.length > options.limit) {
            tracks = tracks.slice(0, options.limit);
        }

        const enhancedTracks: KazagumoTrack[] = tracks.map((track: any) => ({
            encoded: track.encoded,
            info: {
                ...track.info,
                sourceName: this.extractSourceName(track.info.uri || ''),
                artworkUrl: track.info.artworkUrl || this.getArtworkUrl(track.info),
                albumName: track.pluginInfo?.albumName,
                artistUrl: track.pluginInfo?.artistUrl,
                albumUrl: track.pluginInfo?.albumUrl,
                preview: track.pluginInfo?.previewUrl,
                isrc: track.pluginInfo?.isrc
            },
            pluginInfo: track.pluginInfo || {},
            requester: options.requester,
            searchQuery: query
        }));

        return {
            type: this.determineResultType(result.loadType),
            tracks: enhancedTracks,
            playlistName: result.playlistInfo?.name,
            source: this.extractSourceName(query)
        };
    }

    /**
     * Determine search engine based on URL info and options
     */
    private determineSearchEngine(urlInfo: URLParseResult, explicitSource?: string): string {
        if (explicitSource) {
            return this.normalizeSearchEngine(explicitSource);
        }

        if (urlInfo.isValidUrl) {
            return URLParser.getSearchEngine(urlInfo.platform);
        }

        return this.kazagumo.options.defaultSearchEngine || 'ytsearch';
    }

    /**
     * Format query for search
     */
    private formatQuery(query: string, urlInfo: URLParseResult, engine: string): string {
        if (urlInfo.isValidUrl) {
            return query;
        }
        return `${engine}:${query}`;
    }

    /**
     * Get best available node
     */
    private getBestNode(): any {
        const node = this.kazagumo.getLeastUsedNode();
        if (!node || !node.connected) {
            return null;
        }
        return node;
    }

    /**
     * Generate cache key
     */
    private generateCacheKey(query: string, options: EnhancedSearchOptions): string {
        const key = `${query}_${options.source || 'default'}_${options.limit || 'all'}`;
        return Buffer.from(key).toString('base64');
    }

    /**
     * Get cached result
     */
    private getCachedResult(query: string, options: EnhancedSearchOptions): EnhancedSearchResult | null {
        const cacheKey = this.generateCacheKey(query, options);
        const cached = this.searchCache.get(cacheKey);
        
        if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
            return cached.result;
        }
        
        return null;
    }

    /**
     * Cache search result
     */
    private cacheResult(query: string, options: EnhancedSearchOptions, result: EnhancedSearchResult): void {
        const cacheKey = this.generateCacheKey(query, options);
        this.searchCache.set(cacheKey, {
            result,
            timestamp: Date.now()
        });
    }

    /**
     * Update platform usage statistics
     */
    private updatePlatformStats(platform: string): void {
        const current = this.searchStats.platformUsage.get(platform) || 0;
        this.searchStats.platformUsage.set(platform, current + 1);
    }

    /**
     * Create error result
     */
    private createErrorResult(query: string, error: KazaError, searchTime: number): EnhancedSearchResult {
        return {
            type: 'error',
            tracks: [],
            query,
            searchEngine: 'unknown',
            searchTime,
            fromCache: false,
            source: 'error',
            exception: {
                message: error.message,
                severity: error.recoverable ? 'common' : 'fault',
                code: error.code,
                suggestions: error.suggestions || []
            }
        };
    }

    /**
     * Normalize search engine names
     */
    private normalizeSearchEngine(source: string): string {
        const engineMap: { [key: string]: string } = {
            'youtube': 'ytsearch',
            'yt': 'ytsearch',
            'youtubemusic': 'ytmsearch',
            'ytm': 'ytmsearch',
            'spotify': 'spsearch',
            'sp': 'spsearch',
            'applemusic': 'amsearch',
            'apple': 'amsearch',
            'am': 'amsearch',
            'deezer': 'dzsearch',
            'dz': 'dzsearch',
            'soundcloud': 'scsearch',
            'sc': 'scsearch',
            'jiosaavn': 'jiosaavn',
            'jio': 'jiosaavn',
            'qobuz': 'qobuz',
            'tidal': 'tidal',
            'bandcamp': 'bandcamp',
            'bc': 'bandcamp',
            'flowery': 'flowery'
        };

        return engineMap[source.toLowerCase()] || 'ytsearch';
    }

    /**
     * Extract source name from URI
     */
    private extractSourceName(uri: string): string {
        if (uri.includes('youtube.com') || uri.includes('youtu.be')) return 'YouTube';
        if (uri.includes('music.youtube.com')) return 'YouTube Music';
        if (uri.includes('spotify.com')) return 'Spotify';
        if (uri.includes('music.apple.com')) return 'Apple Music';
        if (uri.includes('deezer.com')) return 'Deezer';
        if (uri.includes('soundcloud.com')) return 'SoundCloud';
        if (uri.includes('jiosaavn.com') || uri.includes('saavn.com')) return 'JioSaavn';
        if (uri.includes('qobuz.com')) return 'Qobuz';
        if (uri.includes('tidal.com')) return 'Tidal';
        if (uri.includes('bandcamp.com')) return 'Bandcamp';
        if (uri.startsWith('http')) return 'HTTP Stream';
        return 'Unknown';
    }

    /**
     * Get artwork URL from track info
     */
    private getArtworkUrl(info: any): string | null {
        if (info.artworkUrl) return info.artworkUrl;
        
        if (info.identifier && info.uri?.includes('youtube')) {
            return `https://img.youtube.com/vi/${info.identifier}/maxresdefault.jpg`;
        }

        return null;
    }

    /**
     * Determine result type from load type
     */
    private determineResultType(loadType: string): 'track' | 'playlist' | 'search' | 'error' {
        switch (loadType) {
            case 'TRACK_LOADED': return 'track';
            case 'PLAYLIST_LOADED': return 'playlist';
            case 'SEARCH_RESULT': return 'search';
            default: return 'error';
        }
    }

    /**
     * Start cache cleanup interval
     */
    private startCacheCleanup(): void {
        setInterval(() => {
            const now = Date.now();
            for (const [key, value] of this.searchCache) {
                if (now - value.timestamp > this.cacheTimeout) {
                    this.searchCache.delete(key);
                }
            }
        }, 60000);
    }

    /**
     * Platform-specific search methods with enhanced features
     */
    public async searchSpotify(query: string, options: EnhancedSearchOptions = {}): Promise<EnhancedSearchResult> {
        return this.search(query, { 
            ...options, 
            source: 'spotify',
            fallbackEngines: ['ytmsearch', 'ytsearch']
        });
    }

    public async searchAppleMusic(query: string, options: EnhancedSearchOptions = {}): Promise<EnhancedSearchResult> {
        return this.search(query, { 
            ...options, 
            source: 'applemusic',
            fallbackEngines: ['ytmsearch', 'ytsearch']
        });
    }

    public async searchYouTube(query: string, options: EnhancedSearchOptions = {}): Promise<EnhancedSearchResult> {
        return this.search(query, { ...options, source: 'youtube' });
    }

    public async searchYouTubeMusic(query: string, options: EnhancedSearchOptions = {}): Promise<EnhancedSearchResult> {
        return this.search(query, { 
            ...options, 
            source: 'youtubemusic',
            fallbackEngines: ['ytsearch']
        });
    }

    public async searchSoundCloud(query: string, options: EnhancedSearchOptions = {}): Promise<EnhancedSearchResult> {
        return this.search(query, { 
            ...options, 
            source: 'soundcloud',
            fallbackEngines: ['ytsearch']
        });
    }

    public async searchDeezer(query: string, options: EnhancedSearchOptions = {}): Promise<EnhancedSearchResult> {
        return this.search(query, { 
            ...options, 
            source: 'deezer',
            fallbackEngines: ['spsearch', 'ytsearch']
        });
    }

    public async searchTidal(query: string, options: EnhancedSearchOptions = {}): Promise<EnhancedSearchResult> {
        return this.search(query, { 
            ...options, 
            source: 'tidal',
            fallbackEngines: ['spsearch', 'ytsearch']
        });
    }

    public async searchQobuz(query: string, options: EnhancedSearchOptions = {}): Promise<EnhancedSearchResult> {
        return this.search(query, { 
            ...options, 
            source: 'qobuz',
            fallbackEngines: ['spsearch', 'ytsearch']
        });
    }

    public async searchBandcamp(query: string, options: EnhancedSearchOptions = {}): Promise<EnhancedSearchResult> {
        return this.search(query, { 
            ...options, 
            source: 'bandcamp',
            fallbackEngines: ['ytsearch']
        });
    }

    public async searchJioSaavn(query: string, options: EnhancedSearchOptions = {}): Promise<EnhancedSearchResult> {
        return this.search(query, { 
            ...options, 
            source: 'jiosaavn',
            fallbackEngines: ['ytsearch']
        });
    }

    /**
     * Auto-detect platform and search with optimal settings
     */
    public async autoSearch(query: string, options: EnhancedSearchOptions = {}): Promise<EnhancedSearchResult> {
        const urlInfo = URLParser.parse(query);
        
        if (urlInfo.isValidUrl && urlInfo.platform !== 'http') {
            const searchMethod = this.getPlatformSearchMethod(urlInfo.platform);
            if (searchMethod) {
                return searchMethod.call(this, query, options);
            }
        }

        return this.search(query, {
            ...options,
            fallbackEngines: ['ytmsearch', 'spsearch', 'ytsearch'],
            retryAttempts: 3
        });
    }

    /**
     * Get platform-specific search method
     */
    private getPlatformSearchMethod(platform: string): Function | null {
        const methods: Record<string, Function> = {
            'spotify': this.searchSpotify,
            'applemusic': this.searchAppleMusic,
            'youtube': this.searchYouTube,
            'youtubeMusic': this.searchYouTubeMusic,
            'soundcloud': this.searchSoundCloud,
            'deezer': this.searchDeezer,
            'tidal': this.searchTidal,
            'qobuz': this.searchQobuz,
            'bandcamp': this.searchBandcamp,
            'jiosaavn': this.searchJioSaavn
        };

        return methods[platform] || null;
    }

    /**
     * Get comprehensive search statistics
     */
    public getStats(): {
        searches: number;
        cacheHitRate: number;
        errorRate: number;
        cacheSize: number;
        platformUsage: Record<string, number>;
        supportedPlatforms: string[];
    } {
        const hitRate = this.searchStats.totalSearches > 0 ? 
            (this.searchStats.cacheHits / this.searchStats.totalSearches) * 100 : 0;
        
        const errorRate = this.searchStats.totalSearches > 0 ? 
            (this.searchStats.errors / this.searchStats.totalSearches) * 100 : 0;

        return {
            searches: this.searchStats.totalSearches,
            cacheHitRate: Math.round(hitRate * 100) / 100,
            errorRate: Math.round(errorRate * 100) / 100,
            cacheSize: this.searchCache.size,
            platformUsage: Object.fromEntries(this.searchStats.platformUsage),
            supportedPlatforms: URLParser.getSupportedPlatforms()
        };
    }

    /**
     * Clear search cache
     */
    public clearCache(): void {
        this.searchCache.clear();
        this.searchStats.cacheHits = 0;
    }

    /**
     * Reset all statistics
     */
    public resetStats(): void {
        this.searchStats = {
            totalSearches: 0,
            cacheHits: 0,
            errors: 0,
            platformUsage: new Map<string, number>()
        };
    }

    /**
     * Get supported search engines
     */
    public getSupportedEngines(): SearchEngine[] {
        return [
            'youtube', 'ytmsearch', 'ytsearch',
            'spsearch', 'amsearch', 'dzsearch',
            'scsearch', 'jiosaavn', 'bandcamp',
            'qobuz', 'tidal', 'flowery'
        ];
    }
}