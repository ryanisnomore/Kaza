import { KazagumoSearchOptions, KazagumoSearchResult, SearchEngine } from '../types';
export declare class SearchManager {
    private kazagumo;
    constructor(kazagumo: any);
    /**
     * Search for tracks using LavaSrc 4.7.2 search engines
     * All platforms are handled through Lavalink server configuration
     */
    search(query: string, options?: KazagumoSearchOptions): Promise<KazagumoSearchResult>;
    /**
     * Determine the appropriate search engine based on URL pattern or explicit source
     */
    private determineSearchEngine;
    /**
     * Format search query for LavaSrc engines
     */
    private formatSearchQuery;
    /**
     * Normalize search engine names to LavaSrc 4.7.2 format
     */
    private normalizeSearchEngine;
    /**
     * Extract source name from URI
     */
    private extractSourceName;
    /**
     * Get artwork URL from track info
     */
    private getArtworkUrl;
    /**
     * Check if string is a URL
     */
    private isUrl;
    /**
     * Get supported search engines (LavaSrc 4.7.2)
     */
    getSupportedEngines(): SearchEngine[];
    /**
     * Get platform-specific search methods
     */
    searchYouTube(query: string, options?: KazagumoSearchOptions): Promise<KazagumoSearchResult>;
    searchSpotify(query: string, options?: KazagumoSearchOptions): Promise<KazagumoSearchResult>;
    searchAppleMusic(query: string, options?: KazagumoSearchOptions): Promise<KazagumoSearchResult>;
    searchDeezer(query: string, options?: KazagumoSearchOptions): Promise<KazagumoSearchResult>;
    searchSoundCloud(query: string, options?: KazagumoSearchOptions): Promise<KazagumoSearchResult>;
    searchJioSaavn(query: string, options?: KazagumoSearchOptions): Promise<KazagumoSearchResult>;
    searchQobuz(query: string, options?: KazagumoSearchOptions): Promise<KazagumoSearchResult>;
    searchTidal(query: string, options?: KazagumoSearchOptions): Promise<KazagumoSearchResult>;
    searchBandcamp(query: string, options?: KazagumoSearchOptions): Promise<KazagumoSearchResult>;
}
//# sourceMappingURL=SearchManager.d.ts.map