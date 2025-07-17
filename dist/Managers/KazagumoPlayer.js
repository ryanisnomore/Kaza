"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KazagumoPlayer = void 0;
const events_1 = require("events");
const KazagumoQueue_1 = require("./KazagumoQueue");
class KazagumoPlayer extends events_1.EventEmitter {
    constructor(kazagumo, options) {
        super();
        this.shoukaku = null;
        this.currentTrack = null;
        this.position = 0;
        this.playing = false;
        this.paused = false;
        this.volume = 100;
        this.ping = 0;
        this.timestamp = 0;
        this.isConnected = false;
        this.deaf = false;
        this.mute = false;
        this.positionInterval = null;
        this.kazagumo = kazagumo;
        this.options = options;
        this.guildId = options.guildId;
        this.voiceId = options.voiceId;
        this.textId = options.textId || '';
        this.deaf = options.deaf || false;
        this.mute = options.mute || false;
        this.volume = options.volume || 100;
        this.queue = new KazagumoQueue_1.KazagumoQueue(this);
        this.filters = {};
        this.initialize();
    }
    /**
     * Initialize the player
     */
    async initialize() {
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
        }
        catch (error) {
            this.emit('error', error);
        }
    }
    /**
     * Set up event listeners for the Shoukaku player
     */
    setupEventListeners() {
        if (!this.shoukaku)
            return;
        this.shoukaku.on('start', (data) => {
            this.playing = true;
            this.paused = false;
            this.timestamp = Date.now();
            this.emit('trackStart', this, data.track);
        });
        this.shoukaku.on('end', (data) => {
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
        this.shoukaku.on('exception', (data) => {
            this.emit('trackException', this, this.currentTrack, data.exception);
        });
        this.shoukaku.on('stuck', (data) => {
            this.emit('trackStuck', this, this.currentTrack);
        });
        this.shoukaku.on('closed', (data) => {
            this.isConnected = false;
            this.emit('playerClosed', this, data);
        });
    }
    /**
     * Start position tracking
     */
    startPositionTracking() {
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
    stopPositionTracking() {
        if (this.positionInterval) {
            clearInterval(this.positionInterval);
            this.positionInterval = null;
        }
    }
    /**
     * Play the current track or a specific track
     */
    async play(track) {
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
    async pause(pause = true) {
        if (!this.shoukaku || !this.isConnected) {
            throw new Error('Player is not connected');
        }
        this.paused = pause;
        await this.shoukaku.setPaused(pause);
    }
    /**
     * Stop the player
     */
    async stop() {
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
    async skip() {
        if (!this.shoukaku || !this.isConnected) {
            throw new Error('Player is not connected');
        }
        const nextTrack = this.queue.next();
        if (nextTrack) {
            await this.play(nextTrack);
        }
        else {
            await this.stop();
            this.emit('queueEnd', this);
        }
    }
    /**
     * Go to the next track in queue
     */
    next() {
        const nextTrack = this.queue.next();
        if (nextTrack) {
            this.play(nextTrack).catch(error => {
                this.emit('error', error);
            });
        }
        else {
            this.emit('queueEnd', this);
        }
    }
    /**
     * Set volume
     */
    async setVolume(volume) {
        if (!this.shoukaku || !this.isConnected) {
            throw new Error('Player is not connected');
        }
        this.volume = Math.max(0, Math.min(100, volume));
        await this.shoukaku.setGlobalVolume(this.volume);
    }
    /**
     * Set filters
     */
    async setFilters(filters) {
        if (!this.shoukaku || !this.isConnected) {
            throw new Error('Player is not connected');
        }
        this.filters = filters;
        await this.shoukaku.setFilters(filters);
    }
    /**
     * Clear all filters
     */
    async clearFilters() {
        if (!this.shoukaku || !this.isConnected) {
            throw new Error('Player is not connected');
        }
        this.filters = {};
        await this.shoukaku.setFilters({});
    }
    /**
     * Seek to a specific position
     */
    async seek(position) {
        if (!this.shoukaku || !this.isConnected) {
            throw new Error('Player is not connected');
        }
        this.position = position;
        await this.shoukaku.seekTo(position);
    }
    /**
     * Move to a different voice channel
     */
    async moveVoiceChannel(channelId) {
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
    getQueueInfo() {
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
    getPlaybackInfo() {
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
    async destroy() {
        this.stopPositionTracking();
        if (this.shoukaku && this.isConnected) {
            try {
                await this.shoukaku.stopTrack();
            }
            catch (error) {
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
exports.KazagumoPlayer = KazagumoPlayer;
//# sourceMappingURL=KazagumoPlayer.js.map