export interface KazagumoTrack {
    track: string;
    info: {
        identifier: string;
        title: string;
        author: string;
        length: number;
        artworkUrl?: string;
        uri?: string;
        sourceName: string;
        isSeekable: boolean;
        isStream: boolean;
        position?: number;
    };
    pluginInfo?: any;
    userData?: any;
}
export interface PlayerOptions {
    guildId: string;
    voiceId: string;
    textId?: string;
    deaf?: boolean;
    mute?: boolean;
    volume?: number;
}
export interface FilterConfig {
    volume?: number;
    equalizer?: Array<{
        band: number;
        gain: number;
    }>;
    karaoke?: {
        level?: number;
        monoLevel?: number;
        filterBand?: number;
        filterWidth?: number;
    };
    timescale?: {
        speed?: number;
        pitch?: number;
        rate?: number;
    };
    tremolo?: {
        frequency?: number;
        depth?: number;
    };
    vibrato?: {
        frequency?: number;
        depth?: number;
    };
    rotation?: {
        rotationHz?: number;
    };
    distortion?: {
        sinOffset?: number;
        sinScale?: number;
        cosOffset?: number;
        cosScale?: number;
        tanOffset?: number;
        tanScale?: number;
        offset?: number;
        scale?: number;
    };
    channelMix?: {
        leftToLeft?: number;
        leftToRight?: number;
        rightToLeft?: number;
        rightToRight?: number;
    };
    lowPass?: {
        smoothing?: number;
    };
}
export interface KazagumoSearchOptions {
    requester?: any;
    limit?: number;
    offset?: number;
    source?: string;
    cacheResults?: boolean;
    fallbackEngines?: string[];
    timeout?: number;
}
export interface KazagumoSearchResult {
    tracks: KazagumoTrack[];
    playlistInfo?: {
        name: string;
        selectedTrack?: number;
    };
    loadType: 'track' | 'playlist' | 'search' | 'empty' | 'error';
    exception?: {
        message: string;
        severity: string;
    };
}
export type SearchEngine = 'ytsearch' | 'ytmsearch' | 'spsearch' | 'amsearch' | 'dzsearch' | 'scsearch' | 'jiosaavn' | 'bandcamp' | 'qobuz' | 'tidal' | 'flowery' | 'youtube' | 'youtubeMusic' | 'spotify' | 'appleMusic' | 'deezer' | 'soundcloud';
export interface SearchEngineConfig {
    name: string;
    prefix: string;
    enabled: boolean;
    priority: number;
    supportedPlatforms: string[];
}
export interface KazagumoConfig {
    defaultSearchEngine?: string;
    send: (guildId: string, payload: any) => void;
    plugins?: {
        [key: string]: {
            enabled: boolean;
            priority?: number;
            config?: any;
        };
    };
    searchOptions?: {
        cacheResults?: boolean;
        cacheTTL?: number;
        retryAttempts?: number;
        timeout?: number;
        fallbackEngines?: string[];
    };
    nodeOptions?: {
        retryAttempts?: number;
        retryDelay?: number;
        secure?: boolean;
    };
}
export interface URLInfo {
    isValid: boolean;
    platform: string;
    type: 'track' | 'playlist' | 'album' | 'artist' | 'unknown';
    id?: string;
    url: string;
}
export interface PlatformEngine {
    name: string;
    prefix: string;
    enabled: boolean;
    priority: number;
    supportedFormats: string[];
}
export interface CacheEntry {
    result: KazagumoSearchResult;
    timestamp: number;
    ttl: number;
}
export interface PluginOptions {
    enabled: boolean;
    priority?: number;
    config?: any;
}
export interface PluginInterface {
    metadata: {
        name: string;
        version: string;
        description: string;
        author: string;
        priority?: number;
        enabled?: boolean;
        dependencies?: string[];
    };
    initialize(kazagumo: any): Promise<void>;
    destroy(): Promise<void>;
    [key: string]: any;
}
export interface KazagumoHealthCheck {
    status: 'healthy' | 'degraded' | 'unhealthy';
    components: {
        shoukaku: boolean;
        search: boolean;
        cache: boolean;
        plugins: boolean;
    };
    timestamp: number;
}
export interface KazagumoStats {
    players: number;
    playingPlayers: number;
    nodes: number;
    uptime: number;
    search: {
        totalSearches: number;
        cacheHits: number;
        cacheHitRate: number;
        supportedPlatforms: string[];
    };
}
export interface KazagumoError extends Error {
    code: string;
    recoverable: boolean;
    suggestions?: string[];
}
export interface KazagumoEvents {
    playerCreate: [player: any];
    playerDestroy: [player: any];
    playerUpdate: [player: any];
    playerEmpty: [player: any];
    playerException: [player: any, exception: any];
    trackStart: [player: any, track: KazagumoTrack];
    trackEnd: [player: any, track: KazagumoTrack];
    trackException: [player: any, track: KazagumoTrack, exception: any];
    trackStuck: [player: any, track: KazagumoTrack];
    queueEnd: [player: any];
    playerMoved: [player: any, oldChannel: string, newChannel: string];
    ready: [name: string];
    error: [name: string, error: Error];
    close: [name: string, code: number, reason: string];
    disconnect: [name: string, moved: boolean];
    reconnecting: [name: string];
}
//# sourceMappingURL=KazagumoTypes.d.ts.map