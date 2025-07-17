"use strict";
/**
 * URLParser - Intelligent URL parsing and platform detection
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.URLParser = void 0;
class URLParser {
    constructor() {
        this.platforms = {
            youtube: {
                name: 'YouTube',
                patterns: [
                    /^https?:\/\/(www\.)?(youtube\.com|youtu\.be)/i,
                    /^https?:\/\/(www\.)?music\.youtube\.com/i
                ],
                extractors: {
                    track: /(?:watch\?v=|\/embed\/|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
                    playlist: /[?&]list=([a-zA-Z0-9_-]+)/,
                    album: /browse\/MPREb_[a-zA-Z0-9_-]+/,
                    artist: /channel\/([a-zA-Z0-9_-]+)/
                }
            },
            youtubeMusic: {
                name: 'YouTube Music',
                patterns: [
                    /^https?:\/\/(www\.)?music\.youtube\.com/i
                ],
                extractors: {
                    track: /watch\?v=([a-zA-Z0-9_-]{11})/,
                    playlist: /[?&]list=([a-zA-Z0-9_-]+)/,
                    album: /browse\/MPREb_[a-zA-Z0-9_-]+/,
                    artist: /channel\/([a-zA-Z0-9_-]+)/
                }
            },
            spotify: {
                name: 'Spotify',
                patterns: [
                    /^https?:\/\/(open\.)?spotify\.com/i,
                    /^spotify:/i
                ],
                extractors: {
                    track: /(?:track[\/:]|track\/)([a-zA-Z0-9]+)/,
                    playlist: /(?:playlist[\/:]|playlist\/)([a-zA-Z0-9]+)/,
                    album: /(?:album[\/:]|album\/)([a-zA-Z0-9]+)/,
                    artist: /(?:artist[\/:]|artist\/)([a-zA-Z0-9]+)/
                }
            },
            appleMusic: {
                name: 'Apple Music',
                patterns: [
                    /^https?:\/\/(www\.)?music\.apple\.com/i
                ],
                extractors: {
                    track: /\/song\/[^\/]+\/(\d+)/,
                    playlist: /\/playlist\/[^\/]+\/pl\.([a-zA-Z0-9]+)/,
                    album: /\/album\/[^\/]+\/(\d+)/,
                    artist: /\/artist\/[^\/]+\/(\d+)/
                }
            },
            deezer: {
                name: 'Deezer',
                patterns: [
                    /^https?:\/\/(www\.)?deezer\.com/i
                ],
                extractors: {
                    track: /\/track\/(\d+)/,
                    playlist: /\/playlist\/(\d+)/,
                    album: /\/album\/(\d+)/,
                    artist: /\/artist\/(\d+)/
                }
            },
            soundcloud: {
                name: 'SoundCloud',
                patterns: [
                    /^https?:\/\/(www\.)?soundcloud\.com/i
                ],
                extractors: {
                    track: /\/([a-zA-Z0-9_-]+)\/([a-zA-Z0-9_-]+)$/,
                    playlist: /\/([a-zA-Z0-9_-]+)\/sets\/([a-zA-Z0-9_-]+)/,
                    artist: /\/([a-zA-Z0-9_-]+)$/
                }
            },
            jiosaavn: {
                name: 'JioSaavn',
                patterns: [
                    /^https?:\/\/(www\.)?jiosaavn\.com/i
                ],
                extractors: {
                    track: /\/song\/[^\/]+\/([a-zA-Z0-9_-]+)/,
                    album: /\/album\/[^\/]+\/([a-zA-Z0-9_-]+)/,
                    artist: /\/artist\/[^\/]+\/([a-zA-Z0-9_-]+)/
                }
            },
            qobuz: {
                name: 'Qobuz',
                patterns: [
                    /^https?:\/\/(www\.)?qobuz\.com/i
                ],
                extractors: {
                    track: /\/track\/(\d+)/,
                    album: /\/album\/([a-zA-Z0-9_-]+)\/(\d+)/,
                    artist: /\/artist\/([a-zA-Z0-9_-]+)\/(\d+)/
                }
            },
            tidal: {
                name: 'Tidal',
                patterns: [
                    /^https?:\/\/(www\.)?tidal\.com/i
                ],
                extractors: {
                    track: /\/track\/(\d+)/,
                    album: /\/album\/(\d+)/,
                    artist: /\/artist\/(\d+)/,
                    playlist: /\/playlist\/([a-zA-Z0-9_-]+)/
                }
            },
            bandcamp: {
                name: 'Bandcamp',
                patterns: [
                    /^https?:\/\/[a-zA-Z0-9_-]+\.bandcamp\.com/i
                ],
                extractors: {
                    track: /\/track\/([a-zA-Z0-9_-]+)/,
                    album: /\/album\/([a-zA-Z0-9_-]+)/
                }
            }
        };
    }
    /**
     * Parse URL and extract platform information
     */
    parseURL(url) {
        if (!url || typeof url !== 'string') {
            return this.createInvalidURLInfo(url);
        }
        // Clean and normalize URL
        const cleanUrl = this.cleanURL(url);
        // Check each platform
        for (const [platformKey, platform] of Object.entries(this.platforms)) {
            if (this.matchesPlatform(cleanUrl, platform)) {
                const urlInfo = this.extractURLInfo(cleanUrl, platformKey, platform);
                if (urlInfo.isValid) {
                    return urlInfo;
                }
            }
        }
        return this.createInvalidURLInfo(url);
    }
    /**
     * Get platform name from URL
     */
    getPlatform(url) {
        const urlInfo = this.parseURL(url);
        return urlInfo.isValid ? urlInfo.platform : null;
    }
    /**
     * Check if URL is valid
     */
    isValidURL(url) {
        return this.parseURL(url).isValid;
    }
    /**
     * Get supported platforms
     */
    getSupportedPlatforms() {
        return Object.keys(this.platforms);
    }
    /**
     * Get platform display name
     */
    getPlatformDisplayName(platform) {
        const platformInfo = this.platforms[platform];
        return platformInfo ? platformInfo.name : null;
    }
    /**
     * Check if platform is supported
     */
    isPlatformSupported(platform) {
        return platform in this.platforms;
    }
    /**
     * Extract URL type (track, playlist, album, artist)
     */
    getURLType(url) {
        const urlInfo = this.parseURL(url);
        return urlInfo.type;
    }
    /**
     * Clean and normalize URL
     */
    cleanURL(url) {
        // Remove common tracking parameters
        const cleanUrl = url.replace(/[?&](utm_[^&]*|si=[^&]*|feature=[^&]*)/g, '');
        // Convert spotify: URIs to HTTPS URLs
        if (cleanUrl.startsWith('spotify:')) {
            return cleanUrl.replace(/^spotify:/, 'https://open.spotify.com/').replace(/:/g, '/');
        }
        return cleanUrl;
    }
    /**
     * Check if URL matches platform patterns
     */
    matchesPlatform(url, platform) {
        return platform.patterns.some(pattern => pattern.test(url));
    }
    /**
     * Extract detailed URL information
     */
    extractURLInfo(url, platformKey, platform) {
        const urlInfo = {
            platform: platformKey,
            type: 'unknown',
            id: '',
            url: url,
            isValid: false
        };
        // Try to extract information for each type
        for (const [type, extractor] of Object.entries(platform.extractors)) {
            const match = url.match(extractor);
            if (match) {
                urlInfo.type = type;
                urlInfo.id = match[1] || match[2] || match[0];
                urlInfo.isValid = true;
                break;
            }
        }
        return urlInfo;
    }
    /**
     * Create invalid URL info object
     */
    createInvalidURLInfo(url) {
        return {
            platform: 'unknown',
            type: 'unknown',
            id: '',
            url: url || '',
            isValid: false
        };
    }
    /**
     * Generate search query from URL info
     */
    generateSearchQuery(urlInfo) {
        if (!urlInfo.isValid) {
            return '';
        }
        const prefixMap = {
            youtube: 'ytsearch',
            youtubeMusic: 'ytmsearch',
            spotify: 'spsearch',
            appleMusic: 'amsearch',
            deezer: 'dzsearch',
            soundcloud: 'scsearch',
            jiosaavn: 'jiosaavn',
            qobuz: 'qobuz',
            tidal: 'tidal',
            bandcamp: 'bandcamp'
        };
        const prefix = prefixMap[urlInfo.platform];
        return prefix ? `${prefix}:${urlInfo.url}` : urlInfo.url;
    }
    /**
     * Validate URL format
     */
    validateURL(url) {
        if (!url || typeof url !== 'string') {
            return { isValid: false, error: 'URL is required and must be a string' };
        }
        if (url.length > 2048) {
            return { isValid: false, error: 'URL is too long' };
        }
        try {
            new URL(url);
            return { isValid: true };
        }
        catch {
            // Check if it's a Spotify URI
            if (url.startsWith('spotify:')) {
                const uriPattern = /^spotify:[a-zA-Z]+:[a-zA-Z0-9]+$/;
                if (uriPattern.test(url)) {
                    return { isValid: true };
                }
            }
            return { isValid: false, error: 'Invalid URL format' };
        }
    }
    /**
     * Get URL metadata
     */
    getURLMetadata(url) {
        const urlInfo = this.parseURL(url);
        return {
            platform: urlInfo.platform,
            type: urlInfo.type,
            id: urlInfo.id,
            displayName: this.getPlatformDisplayName(urlInfo.platform) || 'Unknown',
            isValid: urlInfo.isValid
        };
    }
}
exports.URLParser = URLParser;
//# sourceMappingURL=URLParser.js.map