/**
 * PlayerMoved Plugin - Handles voice channel movement events
 */

import { PluginInterface, PluginMetadata } from '../types';
import { KazagumoPlayer } from '../Managers/KazagumoPlayer';

export class PlayerMoved implements PluginInterface {
  public readonly metadata: PluginMetadata = {
    name: 'PlayerMoved',
    version: '1.0.0',
    description: 'Handles voice channel movement events and auto-reconnection',
    author: 'Kaza Team',
    dependencies: [],
    priority: 100,
    enabled: true
  };

  private kazagumo: any;
  private config: {
    autoReconnect: boolean;
    reconnectDelay: number;
    maxReconnectAttempts: number;
    trackMovement: boolean;
  };

  constructor() {
    this.config = {
      autoReconnect: true,
      reconnectDelay: 1000,
      maxReconnectAttempts: 3,
      trackMovement: true
    };
  }

  /**
   * Initialize the plugin
   */
  public async initialize(kazagumo: any): Promise<void> {
    this.kazagumo = kazagumo;
    
    // Get plugin configuration
    const pluginOptions = kazagumo.pluginConfig.getPluginOptions('PlayerMoved');
    if (pluginOptions?.config) {
      Object.assign(this.config, pluginOptions.config);
    }

    // Set up voice state update listener
    this.setupVoiceStateListener();
    
    console.log('PlayerMoved plugin initialized');
  }

  /**
   * Set up voice state update listener
   */
  private setupVoiceStateListener(): void {
    this.kazagumo.shoukaku.on('playerUpdate', (player: any, data: any) => {
      if (data.guildId) {
        this.handlePlayerUpdate(data.guildId, data);
      }
    });

    // Listen for Discord voice state updates if connector supports it
    if (this.kazagumo.shoukaku.connector.client) {
      this.kazagumo.shoukaku.connector.client.on('voiceStateUpdate', (oldState: any, newState: any) => {
        this.handleVoiceStateUpdate(oldState, newState);
      });
    }
  }

  /**
   * Handle player updates
   */
  private handlePlayerUpdate(guildId: string, data: any): void {
    const player = this.kazagumo.getPlayer(guildId);
    if (!player) return;

    // Check if player was moved
    if (data.channelId && data.channelId !== player.voiceId) {
      this.handlePlayerMoved(player, player.voiceId, data.channelId);
    }
  }

  /**
   * Handle voice state updates
   */
  private handleVoiceStateUpdate(oldState: any, newState: any): void {
    // Only handle bot's voice state updates
    if (oldState.id !== this.kazagumo.shoukaku.connector.client.user.id) {
      return;
    }

    const guildId = oldState.guild?.id || newState.guild?.id;
    if (!guildId) return;

    const player = this.kazagumo.getPlayer(guildId);
    if (!player) return;

    // Bot was moved to a different channel
    if (oldState.channelId !== newState.channelId) {
      if (newState.channelId) {
        this.handlePlayerMoved(player, oldState.channelId, newState.channelId);
      } else {
        this.handlePlayerDisconnected(player);
      }
    }
  }

  /**
   * Handle player being moved to a different channel
   */
  private async handlePlayerMoved(player: KazagumoPlayer, oldChannelId: string, newChannelId: string): Promise<void> {
    try {
      if (this.config.trackMovement) {
        console.log(`Player moved from ${oldChannelId} to ${newChannelId} in guild ${player.guildId}`);
      }

      // Update player's voice channel
      await player.moveVoiceChannel(newChannelId);
      
      // Emit player moved event
      this.kazagumo.emit('playerMoved', player, oldChannelId, newChannelId);
      
      // Auto-reconnect if enabled
      if (this.config.autoReconnect && !player.isConnected) {
        await this.attemptReconnect(player, newChannelId);
      }
    } catch (error) {
      console.error('Error handling player move:', error);
      
      if (this.config.autoReconnect) {
        await this.attemptReconnect(player, newChannelId);
      }
    }
  }

  /**
   * Handle player being disconnected
   */
  private async handlePlayerDisconnected(player: KazagumoPlayer): Promise<void> {
    try {
      console.log(`Player disconnected from voice channel in guild ${player.guildId}`);
      
      // Pause playback
      if (player.playing) {
        await player.pause(true);
      }
      
      // Emit disconnect event
      this.kazagumo.emit('playerDisconnected', player);
      
      // Auto-reconnect if enabled and there was a previous channel
      if (this.config.autoReconnect && player.voiceId) {
        await this.attemptReconnect(player, player.voiceId);
      }
    } catch (error) {
      console.error('Error handling player disconnect:', error);
    }
  }

  /**
   * Attempt to reconnect player
   */
  private async attemptReconnect(player: KazagumoPlayer, channelId: string): Promise<void> {
    let attempts = 0;
    
    while (attempts < this.config.maxReconnectAttempts) {
      try {
        attempts++;
        
        console.log(`Attempting to reconnect player (${attempts}/${this.config.maxReconnectAttempts})`);
        
        // Wait before reconnecting
        await this.delay(this.config.reconnectDelay);
        
        // Try to reconnect
        await player.moveVoiceChannel(channelId);
        
        if (player.isConnected) {
          console.log('Player reconnected successfully');
          
          // Resume playback if it was playing
          if (player.currentTrack && player.paused) {
            await player.pause(false);
          }
          
          return;
        }
      } catch (error) {
        console.error(`Reconnection attempt ${attempts} failed:`, error);
        
        if (attempts === this.config.maxReconnectAttempts) {
          console.error('Max reconnection attempts reached, giving up');
          this.kazagumo.emit('playerReconnectFailed', player);
        }
      }
    }
  }

  /**
   * Handle player creation
   */
  public onPlayerCreate(player: KazagumoPlayer): void {
    if (this.config.trackMovement) {
      console.log(`Player created for guild ${player.guildId}, voice channel ${player.voiceId}`);
    }
  }

  /**
   * Handle player destruction
   */
  public onPlayerDestroy(player: KazagumoPlayer): void {
    if (this.config.trackMovement) {
      console.log(`Player destroyed for guild ${player.guildId}`);
    }
  }

  /**
   * Handle track start
   */
  public onTrackStart(player: KazagumoPlayer, track: any): void {
    // Check if player is still connected
    if (!player.isConnected) {
      console.warn('Track started but player is not connected, attempting reconnect');
      if (this.config.autoReconnect) {
        this.attemptReconnect(player, player.voiceId);
      }
    }
  }

  /**
   * Handle track end
   */
  public onTrackEnd(player: KazagumoPlayer, track: any): void {
    // Plugin can handle track end events if needed
  }

  /**
   * Handle queue end
   */
  public onQueueEnd(player: KazagumoPlayer): void {
    // Plugin can handle queue end events if needed
  }

  /**
   * Update plugin configuration
   */
  public updateConfig(newConfig: Partial<typeof this.config>): void {
    Object.assign(this.config, newConfig);
    console.log('PlayerMoved plugin configuration updated');
  }

  /**
   * Get plugin configuration
   */
  public getConfig(): typeof this.config {
    return { ...this.config };
  }

  /**
   * Get plugin statistics
   */
  public getStats(): {
    reconnectAttempts: number;
    successfulReconnects: number;
    failedReconnects: number;
  } {
    // This would be implemented with actual tracking
    return {
      reconnectAttempts: 0,
      successfulReconnects: 0,
      failedReconnects: 0
    };
  }

  /**
   * Utility delay function
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Destroy the plugin
   */
  public async destroy(): Promise<void> {
    // Clean up any listeners or resources
    console.log('PlayerMoved plugin destroyed');
  }
}
