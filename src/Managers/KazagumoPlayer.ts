import { EventEmitter } from 'events';
import { Player, TrackEndEvent, TrackStartEvent, TrackExceptionEvent, TrackStuckEvent, WebSocketClosedEvent } from 'shoukaku';
import { Kazagumo } from '../Kazagumo';
import { KazagumoQueue } from './KazagumoQueue';
import { KazagumoTrack, PlayerOptions, FilterConfig } from '../types/KazagumoTypes';

export class KazagumoPlayer extends EventEmitter {
  public readonly kazagumo: Kazagumo;
  public readonly guildId: string;
  public readonly voiceId: string;
  public readonly textId: string;
  public readonly queue: KazagumoQueue;
  public filters: FilterConfig;
  
  public shoukaku: Player | null = null;
  public currentTrack: KazagumoTrack | null = null;
  public position: number = 0;
  public playing: boolean = false;
  public paused: boolean = false;
  public volume: number = 100;
  public ping: number = 0;
  public timestamp: number = 0;
  public isConnected: boolean = false;
  public deaf: boolean = false;
  public mute: boolean = false;

  private positionInterval: NodeJS.Timeout | null = null;
  private readonly options: PlayerOptions;

  constructor(kazagumo: Kazagumo, options: PlayerOptions) {
    super();
    
    this.kazagumo = kazagumo;
    this.options = options;
    this.guildId = options.guildId;
    this.voiceId = options.voiceId;
    this.textId = options.textId || '';
    this.deaf = options.deaf || false;
    this.mute = options.mute || false;
    this.volume = options.volume || 100;
    
    this.queue = new KazagumoQueue(this);
    this.filters = {};
    
    this.initialize();
  }

  /**
   * Initialize the player
   */
  private async initialize(): Promise<void> {
    try {
      this.shoukaku = await this.kazagumo.shoukaku.joinVoiceChannel({
        guildId: this.guildId,
        channelId: this.voiceId,
        shardId: 0,
        deaf: this.deaf,
        mute: this.mute
      });

      this.isConnected = true;
      this.setupEventListeners();
      this.startPositionTracking();
    } catch (error) {
      this.emit('error', error);
    }
  }

  /**
   * Set up event listeners for the Shoukaku player
   */
  private setupEventListeners(): void {
    if (!this.shoukaku) return;

    this.shoukaku.on('start', (data: TrackStartEvent) => {
      this.playing = true;
      this.paused = false;
      this.timestamp = Date.now();
      this.emit('trackStart', this, data.track);
    });

    this.shoukaku.on('end', (data: TrackEndEvent) => {
      this.playing = false;
      this.paused = false;
      this.position = 0;
      
      const track = this.currentTrack;
      this.currentTrack = null;
      
      this.emit('trackEnd', this, track);
      
      if (data.reason !== 'replaced') {
        this.next();
      }
    });

    this.shoukaku.on('exception', (data: TrackExceptionEvent) => {
      this.emit('trackException', this, this.currentTrack, data.exception);
    });

    this.shoukaku.on('stuck', (data: TrackStuckEvent) => {
      this.emit('trackStuck', this, this.currentTrack);
    });

    this.shoukaku.on('closed', (data: WebSocketClosedEvent) => {
      this.isConnected = false;
      this.emit('playerClosed', this, data);
    });
  }

  /**
   * Start position tracking
   */
  private startPositionTracking(): void {
    if (this.positionInterval) {
      clearInterval(this.positionInterval);
    }

    this.positionInterval = setInterval(() => {
      if (this.playing && !this.paused) {
        this.position += 1000;
      }
    }, 1000);
  }

  /**
   * Stop position tracking
   */
  private stopPositionTracking(): void {
    if (this.positionInterval) {
      clearInterval(this.positionInterval);
      this.positionInterval = null;
    }
  }

  /**
   * Play the current track or a specific track
   */
  public async play(track?: KazagumoTrack): Promise<void> {
    if (!this.shoukaku || !this.isConnected) {
      throw new Error('Player is not connected');
    }

    const trackToPlay = track || this.queue.current;
    if (!trackToPlay) {
      throw new Error('No track to play');
    }

    this.currentTrack = trackToPlay;
    await this.shoukaku.playTrack({ track: { encoded: trackToPlay.track } });
  }

  /**
   * Pause/resume the player
   */
  public async pause(pause: boolean = true): Promise<void> {
    if (!this.shoukaku || !this.isConnected) {
      throw new Error('Player is not connected');
    }

    this.paused = pause;
    await this.shoukaku.setPaused(pause);
  }

  /**
   * Stop the player
   */
  public async stop(): Promise<void> {
    if (!this.shoukaku || !this.isConnected) {
      throw new Error('Player is not connected');
    }

    this.playing = false;
    this.paused = false;
    this.position = 0;
    this.currentTrack = null;
    
    await this.shoukaku.stopTrack();
  }

  /**
   * Skip to the next track
   */
  public async skip(): Promise<void> {
    if (!this.shoukaku || !this.isConnected) {
      throw new Error('Player is not connected');
    }

    const nextTrack = this.queue.next();
    if (nextTrack) {
      await this.play(nextTrack);
    } else {
      await this.stop();
      this.emit('queueEnd', this);
    }
  }

  /**
   * Go to the next track in queue
   */
  public next(): void {
    const nextTrack = this.queue.next();
    if (nextTrack) {
      this.play(nextTrack).catch(error => {
        this.emit('error', error);
      });
    } else {
      this.emit('queueEnd', this);
    }
  }

  /**
   * Set volume
   */
  public async setVolume(volume: number): Promise<void> {
    if (!this.shoukaku || !this.isConnected) {
      throw new Error('Player is not connected');
    }

    this.volume = Math.max(0, Math.min(100, volume));
    await this.shoukaku.setGlobalVolume(this.volume);
  }

  /**
   * Set filters
   */
  public async setFilters(filters: FilterConfig): Promise<void> {
    if (!this.shoukaku || !this.isConnected) {
      throw new Error('Player is not connected');
    }

    this.filters = filters;
    await this.shoukaku.setFilters(filters as any);
  }

  /**
   * Clear all filters
   */
  public async clearFilters(): Promise<void> {
    if (!this.shoukaku || !this.isConnected) {
      throw new Error('Player is not connected');
    }

    this.filters = {};
    await this.shoukaku.setFilters({});
  }

  /**
   * Seek to a specific position
   */
  public async seek(position: number): Promise<void> {
    if (!this.shoukaku || !this.isConnected) {
      throw new Error('Player is not connected');
    }

    this.position = position;
    await this.shoukaku.seekTo(position);
  }

  /**
   * Move to a different voice channel
   */
  public async moveVoiceChannel(channelId: string): Promise<void> {
    if (!this.shoukaku || !this.isConnected) {
      throw new Error('Player is not connected');
    }

    // Simple implementation - reconnect to new channel
    await this.destroy();
    const newPlayer = await this.kazagumo.shoukaku.joinVoiceChannel({
      guildId: this.guildId,
      channelId: channelId,
      shardId: 0,
      deaf: this.deaf,
      mute: this.mute
    });
    this.shoukaku = newPlayer;
    this.isConnected = true;
    this.setupEventListeners();
  }

  /**
   * Get queue information
   */
  public getQueueInfo(): {
    current: KazagumoTrack | null;
    queue: KazagumoTrack[];
    totalLength: number;
    repeat: number;
    shuffle: boolean;
  } {
    return {
      current: this.currentTrack,
      queue: this.queue.tracks,
      totalLength: this.queue.tracks.reduce((sum, track) => sum + track.info.length, 0),
      repeat: this.queue.repeat,
      shuffle: this.queue.shuffle
    };
  }

  /**
   * Get playback information
   */
  public getPlaybackInfo(): {
    track: KazagumoTrack | null;
    position: number;
    volume: number;
    paused: boolean;
    playing: boolean;
    ping: number;
  } {
    return {
      track: this.currentTrack,
      position: this.position,
      volume: this.volume,
      paused: this.paused,
      playing: this.playing,
      ping: this.ping
    };
  }

  /**
   * Destroy the player
   */
  public async destroy(): Promise<void> {
    this.stopPositionTracking();
    
    if (this.shoukaku && this.isConnected) {
      try {
        await this.shoukaku.stopTrack();
      } catch (error) {
        // Ignore errors during destruction
      }
    }
    
    this.isConnected = false;
    this.playing = false;
    this.paused = false;
    this.currentTrack = null;
    this.queue.clear();
    
    this.emit('playerDestroy', this);
    this.removeAllListeners();
  }
}