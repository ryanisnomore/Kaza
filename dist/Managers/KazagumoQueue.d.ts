import { EventEmitter } from 'events';
import { KazagumoTrack } from '../types/KazagumoTypes';
import { KazagumoPlayer } from './KazagumoPlayer';
export declare class KazagumoQueue extends EventEmitter {
    tracks: KazagumoTrack[];
    current: KazagumoTrack | null;
    repeat: number;
    shuffle: boolean;
    size: number;
    private currentIndex;
    private originalOrder;
    private readonly player;
    constructor(player: KazagumoPlayer);
    /**
     * Add track(s) to the queue
     */
    add(tracks: KazagumoTrack | KazagumoTrack[]): void;
    /**
     * Remove track from queue
     */
    remove(index: number): KazagumoTrack | null;
    /**
     * Clear the queue
     */
    clear(): void;
    /**
     * Get the next track
     */
    next(): KazagumoTrack | null;
    /**
     * Get the previous track
     */
    previous(): KazagumoTrack | null;
    /**
     * Skip to a specific track
     */
    skipTo(index: number): KazagumoTrack | null;
    /**
     * Move track to a different position
     */
    move(from: number, to: number): boolean;
    /**
     * Set repeat mode
     */
    setRepeat(mode: number): void;
    /**
     * Set shuffle mode
     */
    setShuffle(enabled: boolean): void;
    /**
     * Get queue information
     */
    getInfo(): {
        tracks: KazagumoTrack[];
        current: KazagumoTrack | null;
        size: number;
        repeat: number;
        shuffle: boolean;
        currentIndex: number;
        totalLength: number;
    };
    /**
     * Shuffle an array using Fisher-Yates algorithm
     */
    private shuffleArray;
}
//# sourceMappingURL=KazagumoQueue.d.ts.map