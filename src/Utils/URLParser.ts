/**
 * Advanced URL parser for detecting streaming platforms and extracting metadata
 */

export interface URLParseResult {
    platform: string;
    type: 'track' | 'album' | 'playlist' | 'artist' | 'unknown';
    id: string;
    url: string;
    searchPrefix: string;
    isValidUrl: boolean;
}

export class URLParser {
    private static readonly platformPatterns = {
        spotify: {
            regex: /^https?:\/\/(?:open\.)?spotify\.com\/(track|album|playlist|artist)\/([a-zA-Z0-9]+)(?:\?.*)?$/,
            searchPrefix: 'spsearch:'
        },
        applemusic: {
            regex: /^https?:\/\/music\.apple\.com\/([a-z]{2})?\/?.*\/(album|song|playlist)\/[^\/]+\/(\d+)(?:\?.*)?$/,
            searchPrefix: 'amsearch:'
        },
        youtube: {
            regex: /^https?:\/\/(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)(?:\&.*)?$/,
            searchPrefix: 'ytsearch:'
        },
        youtubeMusic: {
            regex: /^https?:\/\/music\.youtube\.com\/watch\?v=([a-zA-Z0-9_-]+)(?:\&.*)?$/,
            searchPrefix: 'ytmsearch:'
        },
        soundcloud: {
            regex: /^https?:\/\/(?:www\.)?soundcloud\.com\/[\w-]+\/[\w-]+(?:\?.*)?$/,
            searchPrefix: 'scsearch:'
        },
        deezer: {
            regex: /^https?:\/\/(?:www\.)?deezer\.com\/(?:[a-z]{2}\/)?(?:track|album|playlist)\/(\d+)(?:\?.*)?$/,
            searchPrefix: 'dzsearch:'
        },
        tidal: {
            regex: /^https?:\/\/(?:www\.)?tidal\.com\/browse\/(track|album|playlist)\/(\d+)(?:\?.*)?$/,
            searchPrefix: 'tidal:'
        },
        qobuz: {
            regex: /^https?:\/\/(?:www\.)?qobuz\.com\/(?:[a-z]{2}-[a-z]{2}\/)?(?:album|track)\/[\w-]+\/(\d+)(?:\?.*)?$/,
            searchPrefix: 'qobuz:'
        },
        bandcamp: {
            regex: /^https?:\/\/[\w-]+\.bandcamp\.com\/(?:track|album)\/[\w-]+(?:\?.*)?$/,
            searchPrefix: 'bandcamp:'
        },
        jiosaavn: {
            regex: /^https?:\/\/(?:www\.)?jiosaavn\.com\/song\/[\w-]+\/([a-zA-Z0-9]+)(?:\?.*)?$/,
            searchPrefix: 'jiosaavn:'
        }
    };

    /**
     * Parse a URL or search query to determine the platform and type
     */
    public static parse(input: string): URLParseResult {
        const trimmedInput = input.trim();
        
        // Check if it's a URL
        if (this.isURL(trimmedInput)) {
            return this.parseURL(trimmedInput);
        }

        // Default to YouTube search for non-URL queries
        return {
            platform: 'youtube',
            type: 'unknown',
            id: '',
            url: trimmedInput,
            searchPrefix: 'ytsearch:',
            isValidUrl: false
        };
    }

    /**
     * Parse a validated URL to extract platform information
     */
    private static parseURL(url: string): URLParseResult {
        for (const [platform, config] of Object.entries(this.platformPatterns)) {
            const match = url.match(config.regex);
            if (match) {
                return {
                    platform,
                    type: this.determineType(match[1] || 'track'),
                    id: match[2] || match[1] || '',
                    url,
                    searchPrefix: config.searchPrefix,
                    isValidUrl: true
                };
            }
        }

        // Unknown URL - try HTTP stream
        return {
            platform: 'http',
            type: 'track',
            id: '',
            url,
            searchPrefix: '',
            isValidUrl: this.isValidHTTPUrl(url)
        };
    }

    /**
     * Check if input is a URL
     */
    private static isURL(input: string): boolean {
        try {
            new URL(input);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Check if URL is a valid HTTP stream
     */
    private static isValidHTTPUrl(url: string): boolean {
        try {
            const parsed = new URL(url);
            return ['http:', 'https:'].includes(parsed.protocol);
        } catch {
            return false;
        }
    }

    /**
     * Determine content type from URL path segment
     */
    private static determineType(segment: string): 'track' | 'album' | 'playlist' | 'artist' | 'unknown' {
        const typeMap: Record<string, 'track' | 'album' | 'playlist' | 'artist'> = {
            'track': 'track',
            'song': 'track',
            'album': 'album',
            'playlist': 'playlist',
            'artist': 'artist'
        };

        return typeMap[segment.toLowerCase()] || 'track';
    }

    /**
     * Get search engine for platform
     */
    public static getSearchEngine(platform: string): string {
        const engines: Record<string, string> = {
            'spotify': 'spsearch',
            'applemusic': 'amsearch',
            'youtube': 'ytsearch',
            'youtubeMusic': 'ytmsearch',
            'soundcloud': 'scsearch',
            'deezer': 'dzsearch',
            'tidal': 'tidal',
            'qobuz': 'qobuz',
            'bandcamp': 'bandcamp',
            'jiosaavn': 'jiosaavn'
        };

        return engines[platform] || 'ytsearch';
    }

    /**
     * Get all supported platforms
     */
    public static getSupportedPlatforms(): string[] {
        return Object.keys(this.platformPatterns);
    }

    /**
     * Format search query with appropriate prefix
     */
    public static formatSearchQuery(query: string, platform?: string): string {
        const parseResult = this.parse(query);
        
        if (parseResult.isValidUrl) {
            return parseResult.url;
        }

        const searchEngine = platform ? this.getSearchEngine(platform) : parseResult.searchPrefix.replace(':', '');
        return `${searchEngine}:${query}`;
    }
}
