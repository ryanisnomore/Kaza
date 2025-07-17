"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SearchManager = void 0;
class SearchManager {
    constructor(kazagumo) {
        this.kazagumo = kazagumo;
    }
    /**
     * Search for tracks using LavaSrc 4.7.2 search engines
     * All platforms are handled through Lavalink server configuration
     */
    async search(query, options = {}) {
        const searchEngine = this.determineSearchEngine(query, options.source);
        const searchQuery = this.formatSearchQuery(query, searchEngine);
        try {
            // Use Shoukaku's search through LavaSrc
            const result = await this.kazagumo.shoukaku.getNode().rest.resolve(searchQuery);
            if (!result || !result.tracks.length) {
                return {
                    loadType: 'empty',
                    tracks: []
                };
            }
            const tracks = result.tracks
                .slice(0, options.limit || 10)
                .map((track) => ({
                track: track.encoded,
                info: {
                    identifier: track.info.identifier,
                    title: track.info.title,
                    author: track.info.author,
                    length: track.info.length,
                    artworkUrl: track.info.artworkUrl || this.getArtworkUrl(track.info),
                    uri: track.info.uri,
                    isrc: track.info.isrc || track.pluginInfo?.isrc,
                    sourceName: this.extractSourceName(track.info.uri || ''),
                    isSeekable: track.info.isSeekable ?? true,
                    isStream: track.info.isStream ?? false,
                    position: track.info.position || 0
                },
                pluginInfo: track.pluginInfo || {},
                userData: options.requester
            }));
            const searchResult = {
                loadType: result.loadType === 'PLAYLIST_LOADED' ? 'playlist' : 'search',
                tracks
            };
            if (result.playlistInfo) {
                searchResult.playlistInfo = {
                    name: result.playlistInfo.name,
                    selectedTrack: result.playlistInfo.selectedTrack
                };
            }
            return searchResult;
        }
        catch (error) {
            console.error(`Search error for query "${query}":`, error);
            return {
                loadType: 'error',
                tracks: [],
                exception: {
                    message: error instanceof Error ? error.message : 'Unknown error',
                    severity: 'common'
                }
            };
        }
    }
    /**
     * Determine the appropriate search engine based on URL pattern or explicit source
     */
    determineSearchEngine(query, explicitSource) {
        if (explicitSource) {
            return this.normalizeSearchEngine(explicitSource);
        }
        // URL pattern detection for LavaSrc 4.7.2 sources
        const urlPatterns = {
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
    formatSearchQuery(query, engine) {
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
    normalizeSearchEngine(source) {
        const engineMap = {
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
    extractSourceName(uri) {
        if (uri.includes('youtube.com') || uri.includes('youtu.be'))
            return 'YouTube';
        if (uri.includes('music.youtube.com'))
            return 'YouTube Music';
        if (uri.includes('spotify.com'))
            return 'Spotify';
        if (uri.includes('music.apple.com'))
            return 'Apple Music';
        if (uri.includes('deezer.com'))
            return 'Deezer';
        if (uri.includes('soundcloud.com'))
            return 'SoundCloud';
        if (uri.includes('jiosaavn.com') || uri.includes('saavn.com'))
            return 'JioSaavn';
        if (uri.includes('qobuz.com'))
            return 'Qobuz';
        if (uri.includes('tidal.com'))
            return 'Tidal';
        if (uri.includes('bandcamp.com'))
            return 'Bandcamp';
        if (uri.startsWith('http'))
            return 'HTTP Stream';
        return 'Unknown';
    }
    /**
     * Get artwork URL from track info
     */
    getArtworkUrl(info) {
        if (info.artworkUrl)
            return info.artworkUrl;
        // YouTube thumbnail extraction
        if (info.identifier && info.uri?.includes('youtube')) {
            return `https://img.youtube.com/vi/${info.identifier}/maxresdefault.jpg`;
        }
        return null;
    }
    /**
     * Check if string is a URL
     */
    isUrl(string) {
        try {
            new URL(string);
            return true;
        }
        catch {
            return string.startsWith('http://') || string.startsWith('https://');
        }
    }
    /**
     * Get supported search engines (LavaSrc 4.7.2)
     */
    getSupportedEngines() {
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
    async searchYouTube(query, options = {}) {
        return this.search(query, { ...options, source: 'youtube' });
    }
    async searchSpotify(query, options = {}) {
        return this.search(query, { ...options, source: 'spotify' });
    }
    async searchAppleMusic(query, options = {}) {
        return this.search(query, { ...options, source: 'applemusic' });
    }
    async searchDeezer(query, options = {}) {
        return this.search(query, { ...options, source: 'deezer' });
    }
    async searchSoundCloud(query, options = {}) {
        return this.search(query, { ...options, source: 'soundcloud' });
    }
    async searchJioSaavn(query, options = {}) {
        return this.search(query, { ...options, source: 'jiosaavn' });
    }
    async searchQobuz(query, options = {}) {
        return this.search(query, { ...options, source: 'qobuz' });
    }
    async searchTidal(query, options = {}) {
        return this.search(query, { ...options, source: 'tidal' });
    }
    async searchBandcamp(query, options = {}) {
        return this.search(query, { ...options, source: 'bandcamp' });
    }
}
exports.SearchManager = SearchManager;
//# sourceMappingURL=SearchManager.js.map