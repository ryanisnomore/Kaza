import { 
    KazagumoSearchOptions, 
    KazagumoSearchResult, 
    KazagumoTrack,
    SearchEngine 
} from '../types';

export class SearchManager {
    private kazagumo: any;

    constructor(kazagumo: any) {
        this.kazagumo = kazagumo;
    }

    /**
     * Search for tracks using LavaSrc 4.7.2 search engines
     * All platforms are handled through Lavalink server configuration
     */
    public async search(
        query: string, 
        options: KazagumoSearchOptions = {}
    ): Promise<KazagumoSearchResult> {
        const searchEngine = this.determineSearchEngine(query, options.source);
        const searchQuery = this.formatSearchQuery(query, searchEngine);
        
        try {
            // Use Shoukaku's search through LavaSrc
            const result = await this.kazagumo.shoukaku.getNode().rest.resolve(searchQuery);
            
            if (!result || !result.tracks.length) {
                return {
                    type: 'track',
                    tracks: [],
                    source: searchEngine
                };
            }

            const tracks: KazagumoTrack[] = result.tracks
                .slice(0, options.limit || 10)
                .map((track: any) => ({
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
                    requester: options.requester
                }));

            return {
                type: result.loadType === 'playlist' ? 'playlist' : 'track',
                tracks,
                playlistName: result.playlistInfo?.name,
                source: searchEngine
            };

        } catch (error) {
            console.error(`Search error for query "${query}":`, error);
            return {
                type: 'track',
                tracks: [],
                source: searchEngine
            };
        }
    }

    /**
     * Determine the appropriate search engine based on URL pattern or explicit source
     */
    private determineSearchEngine(query: string, explicitSource?: string): SearchEngine {
        if (explicitSource) {
            return this.normalizeSearchEngine(explicitSource);
        }

        // URL pattern detection for LavaSrc 4.7.2 sources
        const urlPatterns: { [key: string]: SearchEngine } = {
            'youtube.com': 'ytsearch',
            'youtu.be': 'ytsearch',
            'music.youtube.com': 'ytmsearch',
            'spotify.com': 'spsearch',
            'music.apple.com': 'amsearch',
            'deezer.com': 'dzsearch',
            'soundcloud.com': 'scsearch',
            'jiosaavn.com': 'jiosaavn',
            'saavn.com': 'jiosaavn',
            'qobuz.com': 'qobuz',
            'tidal.com': 'tidal',
            'bandcamp.com': 'bandcamp'
        };

        for (const [domain, engine] of Object.entries(urlPatterns)) {
            if (query.includes(domain)) {
                return engine;
            }
        }

        // Default to YouTube search
        return this.kazagumo.options.defaultSearchEngine || 'ytsearch';
    }

    /**
     * Format search query for LavaSrc engines
     */
    private formatSearchQuery(query: string, engine: SearchEngine): string {
        // If it's already a URL, return as-is
        if (this.isUrl(query)) {
            return query;
        }

        // For search terms, prefix with search engine
        return `${engine}:${query}`;
    }

    /**
     * Normalize search engine names to LavaSrc 4.7.2 format
     */
    private normalizeSearchEngine(source: string): SearchEngine {
        const engineMap: { [key: string]: SearchEngine } = {
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
        
        // YouTube thumbnail extraction
        if (info.identifier && info.uri?.includes('youtube')) {
            return `https://img.youtube.com/vi/${info.identifier}/maxresdefault.jpg`;
        }

        return null;
    }

    /**
     * Check if string is a URL
     */
    private isUrl(string: string): boolean {
        try {
            new URL(string);
            return true;
        } catch {
            return string.startsWith('http://') || string.startsWith('https://');
        }
    }

    /**
     * Get supported search engines (LavaSrc 4.7.2)
     */
    public getSupportedEngines(): SearchEngine[] {
        return [
            'youtube', 'ytmsearch', 'ytsearch',
            'spsearch', 'amsearch', 'dzsearch',
            'scsearch', 'jiosaavn', 'bandcamp',
            'qobuz', 'tidal', 'flowery'
        ];
    }

    /**
     * Get platform-specific search methods
     */
    public async searchYouTube(query: string, options: KazagumoSearchOptions = {}): Promise<KazagumoSearchResult> {
        return this.search(query, { ...options, source: 'youtube' });
    }

    public async searchSpotify(query: string, options: KazagumoSearchOptions = {}): Promise<KazagumoSearchResult> {
        return this.search(query, { ...options, source: 'spotify' });
    }

    public async searchAppleMusic(query: string, options: KazagumoSearchOptions = {}): Promise<KazagumoSearchResult> {
        return this.search(query, { ...options, source: 'applemusic' });
    }

    public async searchDeezer(query: string, options: KazagumoSearchOptions = {}): Promise<KazagumoSearchResult> {
        return this.search(query, { ...options, source: 'deezer' });
    }

    public async searchSoundCloud(query: string, options: KazagumoSearchOptions = {}): Promise<KazagumoSearchResult> {
        return this.search(query, { ...options, source: 'soundcloud' });
    }

    public async searchJioSaavn(query: string, options: KazagumoSearchOptions = {}): Promise<KazagumoSearchResult> {
        return this.search(query, { ...options, source: 'jiosaavn' });
    }

    public async searchQobuz(query: string, options: KazagumoSearchOptions = {}): Promise<KazagumoSearchResult> {
        return this.search(query, { ...options, source: 'qobuz' });
    }

    public async searchTidal(query: string, options: KazagumoSearchOptions = {}): Promise<KazagumoSearchResult> {
        return this.search(query, { ...options, source: 'tidal' });
    }

    public async searchBandcamp(query: string, options: KazagumoSearchOptions = {}): Promise<KazagumoSearchResult> {
        return this.search(query, { ...options, source: 'bandcamp' });
    }
}