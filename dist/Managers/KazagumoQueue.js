"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KazagumoQueue = void 0;
const events_1 = require("events");
class KazagumoQueue extends events_1.EventEmitter {
    constructor(player) {
        super();
        this.tracks = [];
        this.current = null;
        this.repeat = 0; // 0 = off, 1 = track, 2 = queue
        this.shuffle = false;
        this.size = 0;
        this.currentIndex = 0;
        this.originalOrder = [];
        this.player = player;
    }
    /**
     * Add track(s) to the queue
     */
    add(tracks) {
        const tracksToAdd = Array.isArray(tracks) ? tracks : [tracks];
        for (const track of tracksToAdd) {
            this.tracks.push(track);
            this.originalOrder.push(track);
        }
        this.size = this.tracks.length;
        this.emit('trackAdd', tracksToAdd);
    }
    /**
     * Remove track from queue
     */
    remove(index) {
        if (index < 0 || index >= this.tracks.length) {
            return null;
        }
        const removed = this.tracks.splice(index, 1)[0];
        if (removed) {
            this.originalOrder = this.originalOrder.filter(t => t.track !== removed.track);
            this.size = this.tracks.length;
            this.emit('trackRemove', removed);
        }
        return removed || null;
    }
    /**
     * Clear the queue
     */
    clear() {
        this.tracks = [];
        this.originalOrder = [];
        this.currentIndex = 0;
        this.size = 0;
        this.current = null;
        this.emit('queueClear');
    }
    /**
     * Get the next track
     */
    next() {
        if (this.tracks.length === 0) {
            return null;
        }
        let nextTrack = null;
        if (this.repeat === 1 && this.current) {
            // Repeat current track
            nextTrack = this.current;
        }
        else if (this.repeat === 2 && this.currentIndex >= this.tracks.length - 1) {
            // Repeat queue - go back to first track
            this.currentIndex = 0;
            nextTrack = this.tracks[0] || null;
        }
        else {
            // Normal progression
            this.currentIndex++;
            nextTrack = this.tracks[this.currentIndex] || null;
        }
        if (nextTrack) {
            this.current = nextTrack;
            this.emit('trackNext', nextTrack);
        }
        return nextTrack;
    }
    /**
     * Get the previous track
     */
    previous() {
        if (this.tracks.length === 0) {
            return null;
        }
        this.currentIndex = Math.max(0, this.currentIndex - 1);
        const prevTrack = this.tracks[this.currentIndex] || null;
        if (prevTrack) {
            this.current = prevTrack;
            this.emit('trackPrevious', prevTrack);
        }
        return prevTrack;
    }
    /**
     * Skip to a specific track
     */
    skipTo(index) {
        if (index < 0 || index >= this.tracks.length) {
            return null;
        }
        this.currentIndex = index;
        const track = this.tracks[index] || null;
        if (track) {
            this.current = track;
            this.emit('trackSkip', track);
        }
        return track;
    }
    /**
     * Move track to a different position
     */
    move(from, to) {
        if (from < 0 || from >= this.tracks.length || to < 0 || to >= this.tracks.length) {
            return false;
        }
        const track = this.tracks.splice(from, 1)[0];
        if (track) {
            this.tracks.splice(to, 0, track);
            this.emit('trackMove', track, from, to);
            return true;
        }
        return false;
    }
    /**
     * Set repeat mode
     */
    setRepeat(mode) {
        this.repeat = Math.max(0, Math.min(2, mode));
        this.emit('repeatChange', this.repeat);
    }
    /**
     * Set shuffle mode
     */
    setShuffle(enabled) {
        this.shuffle = enabled;
        if (enabled) {
            this.shuffleArray(this.tracks);
        }
        else {
            // Restore original order
            this.tracks = [...this.originalOrder];
        }
        this.emit('shuffleChange', enabled);
    }
    /**
     * Get queue information
     */
    getInfo() {
        return {
            tracks: this.tracks,
            current: this.current,
            size: this.size,
            repeat: this.repeat,
            shuffle: this.shuffle,
            currentIndex: this.currentIndex,
            totalLength: this.tracks.reduce((sum, track) => sum + track.info.length, 0)
        };
    }
    /**
     * Shuffle an array using Fisher-Yates algorithm
     */
    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            const temp = array[i];
            const itemJ = array[j];
            if (temp && itemJ) {
                array[i] = itemJ;
                array[j] = temp;
            }
        }
    }
}
exports.KazagumoQueue = KazagumoQueue;
//# sourceMappingURL=KazagumoQueue.js.map