/**
 * PlayerMoved Plugin - Handles voice channel movement events
 */
import { PluginInterface, PluginMetadata } from '../types';
import { KazagumoPlayer } from '../Managers/KazagumoPlayer';
export declare class PlayerMoved implements PluginInterface {
    readonly metadata: PluginMetadata;
    private kazagumo;
    private config;
    constructor();
    /**
     * Initialize the plugin
     */
    initialize(kazagumo: any): Promise<void>;
    /**
     * Set up voice state update listener
     */
    private setupVoiceStateListener;
    /**
     * Handle player updates
     */
    private handlePlayerUpdate;
    /**
     * Handle voice state updates
     */
    private handleVoiceStateUpdate;
    /**
     * Handle player being moved to a different channel
     */
    private handlePlayerMoved;
    /**
     * Handle player being disconnected
     */
    private handlePlayerDisconnected;
    /**
     * Attempt to reconnect player
     */
    private attemptReconnect;
    /**
     * Handle player creation
     */
    onPlayerCreate(player: KazagumoPlayer): void;
    /**
     * Handle player destruction
     */
    onPlayerDestroy(player: KazagumoPlayer): void;
    /**
     * Handle track start
     */
    onTrackStart(player: KazagumoPlayer, track: any): void;
    /**
     * Handle track end
     */
    onTrackEnd(player: KazagumoPlayer, track: any): void;
    /**
     * Handle queue end
     */
    onQueueEnd(player: KazagumoPlayer): void;
    /**
     * Update plugin configuration
     */
    updateConfig(newConfig: Partial<typeof this.config>): void;
    /**
     * Get plugin configuration
     */
    getConfig(): typeof this.config;
    /**
     * Get plugin statistics
     */
    getStats(): {
        reconnectAttempts: number;
        successfulReconnects: number;
        failedReconnects: number;
    };
    /**
     * Utility delay function
     */
    private delay;
    /**
     * Destroy the plugin
     */
    destroy(): Promise<void>;
}
//# sourceMappingURL=PlayerMoved.d.ts.map