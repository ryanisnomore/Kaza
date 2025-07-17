/**
 * URLParser - Intelligent URL parsing and platform detection
 */
import { URLInfo } from '../types';
export declare class URLParser {
    private readonly platforms;
    /**
     * Parse URL and extract platform information
     */
    parseURL(url: string): URLInfo;
    /**
     * Get platform name from URL
     */
    getPlatform(url: string): string | null;
    /**
     * Check if URL is valid
     */
    isValidURL(url: string): boolean;
    /**
     * Get supported platforms
     */
    getSupportedPlatforms(): string[];
    /**
     * Get platform display name
     */
    getPlatformDisplayName(platform: string): string | null;
    /**
     * Check if platform is supported
     */
    isPlatformSupported(platform: string): boolean;
    /**
     * Extract URL type (track, playlist, album, artist)
     */
    getURLType(url: string): 'track' | 'playlist' | 'album' | 'artist' | 'unknown';
    /**
     * Clean and normalize URL
     */
    private cleanURL;
    /**
     * Check if URL matches platform patterns
     */
    private matchesPlatform;
    /**
     * Extract detailed URL information
     */
    private extractURLInfo;
    /**
     * Create invalid URL info object
     */
    private createInvalidURLInfo;
    /**
     * Generate search query from URL info
     */
    generateSearchQuery(urlInfo: URLInfo): string;
    /**
     * Validate URL format
     */
    validateURL(url: string): {
        isValid: boolean;
        error?: string;
    };
    /**
     * Get URL metadata
     */
    getURLMetadata(url: string): {
        platform: string;
        type: string;
        id: string;
        displayName: string;
        isValid: boolean;
    };
}
//# sourceMappingURL=URLParser.d.ts.map