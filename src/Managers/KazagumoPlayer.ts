import { Player } from 'shoukaku';
import { EventEmitter } from 'events';
import { KazagumoQueue } from './KazagumoQueue';
import { 
    KazagumoTrack, 
    KazagumoPlayerOptions, 
    RepeatMode,
    KazagumoNode
} from '../types';

export class KazagumoPlayer extends EventEmitter {
    public shoukaku: Player;
    public guildId: string;
    public voiceId: string;
    public textId?: string;
    public queue: KazagumoQueue;
    public current: KazagumoTrack | null = null;
    public position: number = 0;
    public ping: number = 0;
    public timestamp: number = 0;
    public volume: number = 100;
    public paused: boolean = false;
    public playing: boolean = false;
    public connected: boolean = false;
    public node: KazagumoNode;
    private _deaf: boolean;
    private _mute: boolean;

    constructor(options: KazagumoPlayerOptions) {
        super();

        this.guildId = options.guildId;
        this.voiceId = options.voiceId;
        this.textId = options.textId || '';
        this.node = options.node!;
        this._deaf = options.deaf || false;
        this._mute = options.mute || false;
        this.volume = options.volume || 100;

        this.queue = new KazagumoQueue();
        // Create player through Shoukaku
        this.shoukaku = (this.node as any).joinChannel({
            guildId: this.guildId,
            channelId: this.voiceId,
            shardId: 0,
            deaf: this._deaf,
            mute: this._mute
        });

        this.setupEventListeners();
    }

    private setupEventListeners(): void {
        this.shoukaku.on('start', (data) => {
            this.playing = true;
            this.paused = false;
            this.emit('trackStart', this, this.current);
        });

        this.shoukaku.on('end', (data) => {
            this.playing = false;
            this.position = 0;
            
            if (this.current) {
                this.queue.addToPrevious(this.current);
            }

            if (data.reason === 'replaced') {
                this.emit('trackEnd', this, this.current, data.reason);
                return;
            }

            const nextTrack = this.queue.getNext();
            if (nextTrack) {
                this.current = nextTrack;
                this.play(nextTrack);
            } else {
                this.current = null;
                this.emit('queueEnd', this);
            }

            this.emit('trackEnd', this, this.current, data.reason);
        });

        this.shoukaku.on('closed', (data) => {
            this.playing = false;
            this.connected = false;
            this.emit('playerClosed', this, data);
        });

        this.shoukaku.on('exception', (data) => {
            this.playing = false;
            this.emit('playerException', this, data);
        });

        this.shoukaku.on('update', (data) => {
            this.position = data.state.position;
            this.ping = data.state.ping;
            this.timestamp = data.state.time;
            this.emit('playerUpdate', this, data);
        });

        this.shoukaku.on('stuck', (data) => {
            this.emit('playerStuck', this, data);
        });

        this.shoukaku.on('resumed', () => {
            this.paused = false;
            this.playing = true;
            this.emit('playerResumed', this);
        });
    }

    public async play(track?: KazagumoTrack): Promise<void> {
        if (track) {
            this.current = track;
        } else if (!this.current) {
            const nextTrack = this.queue.getNext();
            if (!nextTrack) {
                throw new Error('No track to play');
            }
            this.current = nextTrack;
        }

        await this.shoukaku.playTrack({ 
            track: { encoded: this.current!.encoded }
        });
        
        this.playing = true;
        this.paused = false;
    }

    public async stop(): Promise<void> {
        await this.shoukaku.stopTrack();
        this.playing = false;
        this.position = 0;
        this.current = null;
    }

    public async pause(): Promise<void> {
        await this.shoukaku.setPaused(true);
        this.paused = true;
        this.playing = false;
    }

    public async resume(): Promise<void> {
        await this.shoukaku.setPaused(false);
        this.paused = false;
        this.playing = true;
    }

    public async skip(): Promise<void> {
        await this.shoukaku.stopTrack();
    }

    public async seek(position: number): Promise<void> {
        await this.shoukaku.seekTo(position);
        this.position = position;
    }

    public async setVolume(volume: number): Promise<void> {
        if (volume < 0 || volume > 200) {
            throw new Error('Volume must be between 0 and 200');
        }
        
        await this.shoukaku.setGlobalVolume(volume);
        this.volume = volume;
    }

    public async setFilters(filters: any): Promise<void> {
        await this.shoukaku.setFilters(filters);
    }

    public async connect(voiceId?: string): Promise<void> {
        if (voiceId) {
            this.voiceId = voiceId;
        }
        this.connected = true;
    }

    public async disconnect(): Promise<void> {
        (this.shoukaku as any).connection?.disconnect();
        this.connected = false;
    }

    public async destroy(): Promise<void> {
        await this.shoukaku.destroy();
        this.connected = false;
        this.playing = false;
        this.current = null;
        this.queue.clear();
        this.emit('playerDestroy', this);
        this.removeAllListeners();
    }

    public async move(voiceId: string): Promise<void> {
        this.voiceId = voiceId;
        await this.shoukaku.move(voiceId);
    }

    public get formattedPosition(): string {
        return this.formatTime(this.position);
    }

    public get formattedDuration(): string {
        return this.current ? this.formatTime(this.current.info.length || 0) : '0:00';
    }

    private formatTime(ms: number): string {
        const minutes = Math.floor(ms / 60000);
        const seconds = Math.floor((ms % 60000) / 1000);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }

    public getStats() {
        return {
            guildId: this.guildId,
            voiceId: this.voiceId,
            textId: this.textId,
            playing: this.playing,
            paused: this.paused,
            connected: this.connected,
            position: this.position,
            volume: this.volume,
            ping: this.ping,
            current: this.current,
            queue: this.queue.getStats(),
            node: this.node.name
        };
    }
}