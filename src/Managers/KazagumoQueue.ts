import { KazagumoTrack, RepeatMode } from '../types';

export class KazagumoQueue {
    private tracks: KazagumoTrack[] = [];
    private previous: KazagumoTrack[] = [];
    private repeatMode: number = RepeatMode.NONE;
    private shuffled: boolean = false;

    public get length(): number {
        return this.tracks.length;
    }

    public get isEmpty(): boolean {
        return this.tracks.length === 0;
    }

    public get totalLength(): number {
        return this.tracks.reduce((acc, track) => acc + (track.info.length || 0), 0);
    }

    public get repeat(): number {
        return this.repeatMode;
    }

    public set repeat(mode: number) {
        this.repeatMode = mode;
    }

    public add(track: KazagumoTrack | KazagumoTrack[]): void {
        if (Array.isArray(track)) {
            this.tracks.push(...track);
        } else {
            this.tracks.push(track);
        }
    }

    public remove(index: number): KazagumoTrack | null {
        if (index < 0 || index >= this.tracks.length) return null;
        return this.tracks.splice(index, 1)[0] || null;
    }

    public removeFirst(): KazagumoTrack | null {
        return this.tracks.shift() || null;
    }

    public removeLast(): KazagumoTrack | null {
        return this.tracks.pop() || null;
    }

    public get(index: number): KazagumoTrack | null {
        return this.tracks[index] || null;
    }

    public indexOf(track: KazagumoTrack): number {
        return this.tracks.indexOf(track);
    }

    public clear(): void {
        this.tracks = [];
        this.previous = [];
    }

    public shuffle(): void {
        if (this.tracks.length <= 1) return;
        
        for (let i = this.tracks.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            const temp = this.tracks[i];
            if (temp && this.tracks[j]) {
                this.tracks[i] = this.tracks[j];
                this.tracks[j] = temp;
            }
        }
        this.shuffled = true;
    }

    public sort(predicate?: (a: KazagumoTrack, b: KazagumoTrack) => number): void {
        if (predicate) {
            this.tracks.sort(predicate);
        } else {
            this.tracks.sort((a, b) => (a.info.title || '').localeCompare(b.info.title || ''));
        }
    }

    public move(from: number, to: number): void {
        if (from < 0 || from >= this.tracks.length || to < 0 || to >= this.tracks.length) return;
        
        const track = this.tracks.splice(from, 1)[0];
        if (track) {
            this.tracks.splice(to, 0, track);
        }
    }

    public slice(start: number, end?: number): KazagumoTrack[] {
        return this.tracks.slice(start, end);
    }

    public splice(start: number, deleteCount?: number, ...items: KazagumoTrack[]): KazagumoTrack[] {
        return this.tracks.splice(start, deleteCount || 0, ...items);
    }

    public toArray(): KazagumoTrack[] {
        return [...this.tracks];
    }

    public [Symbol.iterator]() {
        return this.tracks[Symbol.iterator]();
    }

    // Queue management for playback
    public getNext(): KazagumoTrack | null {
        if (this.isEmpty) return null;

        // Handle repeat modes
        if (this.repeatMode === RepeatMode.TRACK) {
            // Repeat current track - return same track without removing from queue
            return this.tracks[0] || null;
        }

        // Get next track from queue
        const nextTrack = this.removeFirst();
        
        // If repeat queue mode and no more tracks, restart queue
        if (!nextTrack && this.repeatMode === RepeatMode.QUEUE && this.previous.length > 0) {
            this.tracks = [...this.previous];
            this.previous = [];
            return this.removeFirst();
        }

        return nextTrack;
    }

    public addToPrevious(track: KazagumoTrack): void {
        this.previous.push(track);
        
        // Limit previous tracks (keep last 10)
        if (this.previous.length > 10) {
            this.previous.shift();
        }
    }

    public getPrevious(): KazagumoTrack | null {
        return this.previous[this.previous.length - 1] || null;
    }

    public goBack(): KazagumoTrack | null {
        const previousTrack = this.previous.pop();
        
        if (previousTrack) {
            // Add current track back to beginning of queue
            this.tracks.unshift(previousTrack);
        }
        
        return previousTrack || null;
    }

    public peek(index: number = 0): KazagumoTrack | null {
        return this.tracks[index] || null;
    }

    public filter(predicate: (track: KazagumoTrack, index: number) => boolean): KazagumoTrack[] {
        this.tracks = this.tracks.filter(predicate);
        return this.tracks;
    }

    public find(predicate: (track: KazagumoTrack, index: number) => boolean): KazagumoTrack | undefined {
        return this.tracks.find(predicate);
    }

    public map<T>(mapper: (track: KazagumoTrack, index: number) => T): T[] {
        return this.tracks.map(mapper);
    }

    public clone(): KazagumoQueue {
        const newQueue = new KazagumoQueue();
        newQueue.tracks = [...this.tracks];
        newQueue.previous = [...this.previous];
        newQueue.repeatMode = this.repeatMode;
        newQueue.shuffled = this.shuffled;
        return newQueue;
    }

    public getFormattedDuration(): string {
        const totalMs = this.totalLength;
        const hours = Math.floor(totalMs / 3600000);
        const minutes = Math.floor((totalMs % 3600000) / 60000);
        const seconds = Math.floor((totalMs % 60000) / 1000);

        if (hours > 0) {
            return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }

    public getStats() {
        return {
            length: this.length,
            totalLength: this.totalLength,
            formattedDuration: this.getFormattedDuration(),
            repeatMode: this.repeatMode,
            shuffled: this.shuffled,
            previousCount: this.previous.length,
            isEmpty: this.isEmpty
        };
    }
}
