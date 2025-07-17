import { EventEmitter } from 'events';
import { Shoukaku, Connector, NodeOption } from 'shoukaku';
import { KazagumoPlayer } from './Managers/KazagumoPlayer';
import { EnhancedSearchManager } from './Managers/SearchManager';
import { PluginConfig } from './config/PluginConfig';
import { ErrorHandler, ErrorCode } from './Utils/ErrorHandler';
import { URLParser } from './Utils/URLParser';
import { 
    KazagumoOptions, 
    KazagumoCreatePlayerOptions,
    KazagumoSearchOptions,
    KazagumoSearchResult,
    KazagumoEvents,
    KazagumoPlugin
} from './types';

export class Kazagumo extends EventEmitter {
    public shoukaku: Shoukaku;
    public players: Map<string, KazagumoPlayer> = new Map();
    public searchManager: EnhancedSearchManager;
    public options: KazagumoOptions;
    public pluginConfig: PluginConfig;
    private plugins: Set<KazagumoPlugin> = new Set();
    private startTime: number = Date.now();
    private stats = {
        players: 0,
        playingPlayers: 0,
        connectedNodes: 0,
        totalSearches: 0,
        errors: 0
    };

    constructor(
        options: KazagumoOptions, 
        connector: Connector, 
        nodes: NodeOption[]
    ) {
        super();
        
        this.options = {
            defaultSearchEngine: 'ytsearch',
            searchLimit: 10,
            sourceForceSearch: false,
            resume: false,
            resumeByLibrary: false,
            resumeTimeout: 30000,
            reconnectTries: 3,
            reconnectTimeout: 5000,
            userAgent: 'Kaza/3.3.0',
            ...options
        };

        // Initialize plugin configuration
        this.pluginConfig = new PluginConfig(
            Array.isArray(options.plugins) ? {} : options.plugins
        );

        // Initialize Shoukaku with LavaSrc support
        this.shoukaku = new Shoukaku(connector, nodes, {
            resume: this.options.resume || false,
            resumeTimeout: this.options.resumeTimeout || 30000,
            reconnectTries: this.options.reconnectTries || 3,
            restTimeout: 60000,
            moveOnDisconnect: false,
            userAgent: this.options.userAgent || 'Kaza/3.3.0'
        });

        this.searchManager = new EnhancedSearchManager(this);
        this.setupEventListeners();
        this.loadPlugins();
    }

    private setupEventListeners(): void {
        // Shoukaku events
        this.shoukaku.on('ready', (name, reconnected) => {
            this.emit('ready', name, reconnected);
        });

        this.shoukaku.on('error', (name, error) => {
            this.emit('error', name, error);
        });

        this.shoukaku.on('close', (name, code, reason) => {
            this.emit('close', name, code, reason);
        });

        this.shoukaku.on('disconnect', (name, count) => {
            this.emit('disconnect', name, count);
            
            // Handle player cleanup on disconnect
            console.log(`Node ${name} disconnected, ${count} players affected`);
        });

        this.shoukaku.on('raw', (name, data) => {
            this.emit('raw', name, data);
        });
    }

    private loadPlugins(): void {
        if (this.options.plugins) {
            this.options.plugins.forEach(plugin => {
                this.loadPlugin(plugin);
            });
        }
    }

    public loadPlugin(plugin: KazagumoPlugin): void {
        if (this.plugins.has(plugin)) {
            throw new Error(`Plugin ${plugin.name} is already loaded`);
        }

        try {
            plugin.load(this);
            this.plugins.add(plugin);
            console.log(`Plugin ${plugin.name} loaded successfully`);
        } catch (error) {
            console.error(`Failed to load plugin ${plugin.name}:`, error);
            throw error;
        }
    }

    public unloadPlugin(plugin: KazagumoPlugin): void {
        if (!this.plugins.has(plugin)) {
            throw new Error(`Plugin ${plugin.name} is not loaded`);
        }

        try {
            if (plugin.unload) {
                plugin.unload(this);
            }
            this.plugins.delete(plugin);
            console.log(`Plugin ${plugin.name} unloaded successfully`);
        } catch (error) {
            console.error(`Failed to unload plugin ${plugin.name}:`, error);
            throw error;
        }
    }

    /**
     * Search for tracks using LavaSrc 4.7.2
     */
    public async search(
        query: string, 
        options: KazagumoSearchOptions = {}
    ): Promise<KazagumoSearchResult> {
        return this.searchManager.search(query, options);
    }

    /**
     * Platform-specific search methods
     */
    public async searchYouTube(query: string, options: KazagumoSearchOptions = {}): Promise<KazagumoSearchResult> {
        return this.searchManager.searchYouTube(query, options);
    }

    public async searchSpotify(query: string, options: KazagumoSearchOptions = {}): Promise<KazagumoSearchResult> {
        return this.searchManager.searchSpotify(query, options);
    }

    public async searchAppleMusic(query: string, options: KazagumoSearchOptions = {}): Promise<KazagumoSearchResult> {
        return this.searchManager.searchAppleMusic(query, options);
    }

    public async searchDeezer(query: string, options: KazagumoSearchOptions = {}): Promise<KazagumoSearchResult> {
        return this.searchManager.searchDeezer(query, options);
    }

    public async searchSoundCloud(query: string, options: KazagumoSearchOptions = {}): Promise<KazagumoSearchResult> {
        return this.searchManager.searchSoundCloud(query, options);
    }

    public async searchJioSaavn(query: string, options: KazagumoSearchOptions = {}): Promise<KazagumoSearchResult> {
        return this.searchManager.searchJioSaavn(query, options);
    }

    public async searchQobuz(query: string, options: KazagumoSearchOptions = {}): Promise<KazagumoSearchResult> {
        return this.searchManager.searchQobuz(query, options);
    }

    public async searchTidal(query: string, options: KazagumoSearchOptions = {}): Promise<KazagumoSearchResult> {
        return this.searchManager.searchTidal(query, options);
    }

    public async searchBandcamp(query: string, options: KazagumoSearchOptions = {}): Promise<KazagumoSearchResult> {
        return this.searchManager.searchBandcamp(query, options);
    }

    /**
     * Create a new player
     */
    public createPlayer(options: KazagumoCreatePlayerOptions): KazagumoPlayer {
        if (this.players.has(options.guildId)) {
            throw new Error(`Player for guild ${options.guildId} already exists`);
        }

        const node = this.getLeastUsedNode();
        if (!node) {
            throw new Error('No available nodes');
        }

        const player = new KazagumoPlayer({
            ...options,
            node
        });

        this.players.set(options.guildId, player);
        
        // Forward player events
        player.on('trackStart', (player, track) => this.emit('trackStart', player, track));
        player.on('trackEnd', (player, track, reason) => this.emit('trackEnd', player, track, reason));
        player.on('queueEnd', (player) => this.emit('queueEnd', player));
        player.on('playerException', (player, data) => this.emit('playerException', player, data));
        player.on('playerUpdate', (player, data) => this.emit('playerUpdate', player, data));
        player.on('playerStuck', (player, data) => this.emit('playerStuck', player, data));
        player.on('playerClosed', (player, data) => this.emit('playerClosed', player, data));
        player.on('playerResumed', (player) => this.emit('playerResumed', player));

        this.emit('playerCreate', player);
        return player;
    }

    /**
     * Get an existing player
     */
    public getPlayer(guildId: string): KazagumoPlayer | undefined {
        return this.players.get(guildId);
    }

    /**
     * Destroy a player
     */
    public async destroyPlayer(guildId: string): Promise<boolean> {
        const player = this.players.get(guildId);
        if (!player) return false;

        await player.destroy();
        this.players.delete(guildId);
        this.emit('playerDestroy', player);
        return true;
    }

    /**
     * Get the least used node for load balancing
     */
    private getLeastUsedNode(): any {
        const nodes = [...this.shoukaku.nodes.values()];
        if (nodes.length === 0) return null;

        return nodes.reduce((prev, current) => {
            const prevCount = prev.stats?.players || 0;
            const currentCount = current.stats?.players || 0;
            return (prevCount < currentCount) ? prev : current;
        });
    }

    /**
     * Enhanced auto-search with platform detection
     */
    public async autoSearch(query: string, options: KazagumoSearchOptions = {}): Promise<KazagumoSearchResult> {
        return this.searchManager.autoSearch(query, options);
    }

    /**
     * Get supported platforms from LavaSrc 4.7.2
     */
    public getSupportedPlatforms(): string[] {
        return URLParser.getSupportedPlatforms().map(platform => {
            const nameMap: Record<string, string> = {
                'youtube': 'YouTube',
                'youtubeMusic': 'YouTube Music',
                'spotify': 'Spotify',
                'applemusic': 'Apple Music',
                'deezer': 'Deezer',
                'soundcloud': 'SoundCloud',
                'jiosaavn': 'JioSaavn',
                'qobuz': 'Qobuz',
                'tidal': 'Tidal',
                'bandcamp': 'Bandcamp'
            };
            return nameMap[platform] || platform;
        }).concat(['HTTP Streams']);
    }

    /**
     * Get supported search engines
     */
    public getSupportedEngines(): string[] {
        return this.searchManager.getSupportedEngines();
    }

    /**
     * Parse URL and get platform information
     */
    public parseURL(url: string) {
        return URLParser.parse(url);
    }

    /**
     * Enhanced plugin management with configuration
     */
    public loadPluginWithConfig(plugin: KazagumoPlugin, config?: any): void {
        try {
            // Set plugin configuration if provided
            if (config) {
                this.pluginConfig.setPluginConfig(plugin.name, config);
            }

            // Check if plugin should be loaded based on configuration
            const pluginConfig = this.pluginConfig.getPluginConfig(plugin.name);
            if (!pluginConfig || !pluginConfig.enabled) {
                console.log(`Plugin ${plugin.name} is disabled, skipping load`);
                return;
            }

            // Validate dependencies
            const errors = this.pluginConfig.validateDependencies();
            if (errors.length > 0) {
                throw ErrorHandler.createError(ErrorCode.PLUGIN_LOAD_FAILED, {
                    plugin: plugin.name,
                    dependencyErrors: errors
                });
            }

            this.loadPlugin(plugin);
        } catch (error) {
            ErrorHandler.logError(error, 'PluginManager');
            throw error;
        }
    }

    /**
     * Get plugin configuration and statistics
     */
    public getPluginStats() {
        return {
            ...this.pluginConfig.getStats(),
            loadOrder: this.pluginConfig.getLoadOrder(),
            errors: this.pluginConfig.validateDependencies()
        };
    }

    /**
     * Get comprehensive statistics
     */
    public getStats() {
        const nodes = [...this.shoukaku.nodes.values()];
        const players = [...this.players.values()];
        
        return {
            players: this.players.size,
            playingPlayers: players.filter(p => p.playing).length,
            nodes: nodes.length,
            connectedNodes: nodes.filter(n => n.state === 2).length, // 2 = CONNECTED
            uptime: Date.now() - this.startTime,
            memory: process.memoryUsage(),
            search: this.searchManager.getStats(),
            plugins: this.getPluginStats(),
            version: '3.3.0',
            library: 'Kaza'
        };
    }

    /**
     * Enhanced error handling wrapper for operations
     */
    public async safeOperation<T>(
        operation: () => Promise<T>,
        errorCode: ErrorCode,
        context?: string
    ): Promise<T> {
        return ErrorHandler.handleAsync(operation, errorCode, context);
    }

    /**
     * Health check for all components
     */
    public async healthCheck(): Promise<{
        status: 'healthy' | 'degraded' | 'unhealthy';
        components: Record<string, any>;
    }> {
        const components: Record<string, any> = {};

        // Check nodes
        const nodes = [...this.shoukaku.nodes.values()];
        components.nodes = {
            total: nodes.length,
            connected: nodes.filter(n => n.state === 2).length,
            status: nodes.length > 0 && nodes.some(n => n.state === 2) ? 'healthy' : 'unhealthy'
        };

        // Check players
        components.players = {
            total: this.players.size,
            playing: [...this.players.values()].filter(p => p.playing).length,
            status: 'healthy'
        };

        // Check search cache
        const searchStats = this.searchManager.getStats();
        components.search = {
            cacheSize: searchStats.cacheSize,
            platforms: searchStats.supportedPlatforms.length,
            status: 'healthy'
        };

        // Check plugins
        const pluginStats = this.getPluginStats();
        components.plugins = {
            loaded: pluginStats.enabled,
            errors: pluginStats.errors.length,
            status: pluginStats.errors.length === 0 ? 'healthy' : 'degraded'
        };

        // Overall status
        const allHealthy = Object.values(components).every(c => c.status === 'healthy');
        const anyUnhealthy = Object.values(components).some(c => c.status === 'unhealthy');
        
        const status = anyUnhealthy ? 'unhealthy' : allHealthy ? 'healthy' : 'degraded';

        return { status, components };
    }

    /**
     * Get node statistics
     */
    public async getNodeStats(): Promise<any[]> {
        const nodes = [...this.shoukaku.nodes.values()];
        const stats = await Promise.all(
            nodes.map(async (node) => {
                try {
                    const nodeStats = await node.rest.stats();
                    return {
                        name: node.name,
                        state: node.state,
                        stats: nodeStats
                    };
                } catch (error) {
                    return {
                        name: node.name,
                        state: node.state,
                        error: error instanceof Error ? error.message : 'Unknown error'
                    };
                }
            })
        );
        return stats;
    }

    /**
     * Clean up and destroy the Kazagumo instance
     */
    public async destroy(): Promise<void> {
        // Destroy all players
        await Promise.all(
            [...this.players.keys()].map(guildId => this.destroyPlayer(guildId))
        );

        // Unload all plugins
        [...this.plugins].forEach(plugin => {
            try {
                this.unloadPlugin(plugin);
            } catch (error) {
                console.error(`Error unloading plugin ${plugin.name}:`, error);
            }
        });

        // Disconnect all nodes
        for (const [name, node] of this.shoukaku.nodes.entries()) {
            node.disconnect(1000, 'Kazagumo shutdown');
        }
        
        // Remove all listeners
        this.removeAllListeners();
    }
}
