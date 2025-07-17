import { Player, Node } from 'shoukaku';

export interface KazagumoOptions {
    defaultSearchEngine?: string;
    searchLimit?: number;
    sourceForceSearch?: boolean;
    send: (guildId: string, payload: any) => void;
    plugins?: KazagumoPlugin[];
    resume?: boolean;
    resumeByLibrary?: boolean;
    resumeTimeout?: number;
    reconnectTries?: number;
    reconnectTimeout?: number;
    userAgent?: string;
    nodeResolver?: (nodes: Map<string, Node>, connection?: any) => Node | undefined;
}

export interface KazagumoSearchOptions {
    requester?: any;
    limit?: number;
    source?: string;
}

export interface KazagumoSearchResult {
    type: 'track' | 'playlist' | 'search' | 'error';
    tracks: KazagumoTrack[];
    playlistName?: string;
    source?: string;
}

export interface KazagumoCreatePlayerOptions {
    guildId: string;
    voiceId: string;
    textId?: string;
    deaf?: boolean;
    mute?: boolean;
    volume?: number;
}

export interface KazagumoPlayerOptions extends KazagumoCreatePlayerOptions {
    node?: KazagumoNode;
}

export interface KazagumoNode extends Node {
    // Extended properties for Kazagumo
}

export interface KazagumoTrackInfo {
    identifier: string;
    isSeekable: boolean;
    author: string;
    title: string;
    uri: string;
    sourceName?: string;
    artworkUrl?: string;
    albumName?: string;
    artistUrl?: string;
    albumUrl?: string;
    preview?: string;
    isrc?: string;
    length?: number;
}

export interface KazagumoTrack {
    encoded: string;
    info: KazagumoTrackInfo;
    pluginInfo: any;
    requester?: any;
    realUri?: string;
}

export interface KazagumoPlugin {
    name: string;
    load(kazagumo: any): void;
    unload?(kazagumo: any): void;
}

export interface KazagumoEvents {
    ready: [name: string, reconnected?: boolean];
    error: [name: string, error: Error];
    close: [name: string, code: number, reason: string];
    disconnect: [name: string, count: number];
    raw: [name: string, data: unknown];
    playerCreate: [player: any];
    playerStart: [player: any, track: KazagumoTrack];
    playerEnd: [player: any, track: KazagumoTrack, reason: string];
    playerEmpty: [player: any];
    playerClosed: [player: any, data: any];
    playerUpdate: [player: any, data: any];
    playerResumed: [player: any];
    playerDestroy: [player: any];
    playerException: [player: any, data: any];
    playerStuck: [player: any, data: any];
    trackStart: [player: any, track: KazagumoTrack];
    trackEnd: [player: any, track: KazagumoTrack, reason: string];
    trackStuck: [player: any, track: KazagumoTrack, data: any];
    trackError: [player: any, track: KazagumoTrack, data: any];
    queueEnd: [player: any];
}

// LavaSrc search engines available through Lavalink
export type SearchEngine = 
    | 'youtube' | 'ytmsearch' | 'ytsearch'
    | 'spsearch' | 'amsearch' | 'dzsearch' 
    | 'scsearch' | 'jiosaavn' | 'bandcamp'
    | 'qobuz' | 'tidal' | 'flowery';

export interface RepeatMode {
    NONE: 0;
    TRACK: 1;
    QUEUE: 2;
}

export const RepeatMode: RepeatMode = {
    NONE: 0,
    TRACK: 1,
    QUEUE: 2
};


export { KazagumoQueue } from '../managers/KazagumoQueue';
