import { EventEmitter } from 'events';
import { Player } from 'shoukaku';
import { Kazagumo } from '../Kazagumo';
import { KazagumoQueue } from './KazagumoQueue';
import { KazagumoTrack, PlayerOptions, FilterConfig } from '../types/KazagumoTypes';
export declare class KazagumoPlayer extends EventEmitter {
    readonly kazagumo: Kazagumo;
    readonly guildId: string;
    readonly voiceId: string;
    readonly textId: string;
    readonly queue: KazagumoQueue;
    filters: FilterConfig;
    shoukaku: Player | null;
    currentTrack: KazagumoTrack | null;
    position: number;
    playing: boolean;
    paused: boolean;
    volume: number;
    ping: number;
    timestamp: number;
    isConnected: boolean;
    deaf: boolean;
    mute: boolean;
    private positionInterval;
    private readonly options;
    constructor(kazagumo: Kazagumo, options: PlayerOptions);
    /**
     * Initialize the player
     */
    private initialize;
    /**
     * Set up event listeners for the Shoukaku player
     */
    private setupEventListeners;
    /**
     * Start position tracking
     */
    private startPositionTracking;
    /**
     * Stop position tracking
     */
    private stopPositionTracking;
    /**
     * Play the current track or a specific track
     */
    play(track?: KazagumoTrack): Promise<void>;
    /**
     * Pause/resume the player
     */
    pause(pause?: boolean): Promise<void>;
    /**
     * Stop the player
     */
    stop(): Promise<void>;
    /**
     * Skip to the next track
     */
    skip(): Promise<void>;
    /**
     * Go to the next track in queue
     */
    next(): void;
    /**
     * Set volume
     */
    setVolume(volume: number): Promise<void>;
    /**
     * Set filters
     */
    setFilters(filters: FilterConfig): Promise<void>;
    /**
     * Clear all filters
     */
    clearFilters(): Promise<void>;
    /**
     * Seek to a specific position
     */
    seek(position: number): Promise<void>;
    /**
     * Move to a different voice channel
     */
    moveVoiceChannel(channelId: string): Promise<void>;
    /**
     * Get queue information
     */
    getQueueInfo(): {
        current: KazagumoTrack | null;
        queue: KazagumoTrack[];
        totalLength: number;
        repeat: number;
        shuffle: boolean;
    };
    /**
     * Get playback information
     */
    getPlaybackInfo(): {
        track: KazagumoTrack | null;
        position: number;
        volume: number;
        paused: boolean;
        playing: boolean;
        ping: number;
    };
    /**
     * Destroy the player
     */
    destroy(): Promise<void>;
}
//# sourceMappingURL=KazagumoPlayer.d.ts.map