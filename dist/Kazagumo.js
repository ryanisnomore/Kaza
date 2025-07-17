"use strict";
/**
 * Kazagumo - Advanced Lavalink wrapper with intelligent multi-platform search
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.Kazagumo = void 0;
const events_1 = require("events");
const shoukaku_1 = require("shoukaku");
const KazagumoPlayer_1 = require("./Managers/KazagumoPlayer");
const EnhancedSearchManager_1 = require("./Managers/EnhancedSearchManager");
const URLParser_1 = require("./Utils/URLParser");
const ErrorHandler_1 = require("./Utils/ErrorHandler");
const PluginConfig_1 = require("./config/PluginConfig");
/**
 * Main Kazagumo class - Advanced Lavalink wrapper
 */
class Kazagumo extends events_1.EventEmitter {
    constructor(options, connector, nodes) {
        super();
        this.options = {
            defaultSearchEngine: 'ytsearch',
            ...options
        };
        this.shoukaku = new shoukaku_1.Shoukaku(connector, nodes);
        this.searchManager = new EnhancedSearchManager_1.EnhancedSearchManager(this);
        this.urlParser = new URLParser_1.URLParser();
        this.errorHandler = new ErrorHandler_1.ErrorHandler();
        this.pluginConfig = new PluginConfig_1.PluginConfig(this.options.plugins || {});
        this.players = new Map();
        this.startTime = Date.now();
        this.stats = {
            players: 0,
            playingPlayers: 0,
            nodes: 0,
            uptime: 0,
            search: {
                totalSearches: 0,
                cacheHits: 0,
                cacheHitRate: 0,
                supportedPlatforms: [
                    'youtube',
                    'youtubeMusic',
                    'spotify',
                    'appleMusic',
                    'deezer',
                    'soundcloud',
                    'jiosaavn',
                    'qobuz',
                    'tidal',
                    'bandcamp'
                ]
            }
        };
        this.initializeEventListeners();
        this.initializePlugins();
    }
    /**
     * Initialize event listeners for Shoukaku
     */
    initializeEventListeners() {
        this.shoukaku.on('ready', (name) => {
            this.emit('ready', name);
        });
        this.shoukaku.on('error', (name, error) => {
            this.emit('error', name, error);
        });
        this.shoukaku.on('close', (name, code, reason) => {
            this.emit('close', name, code, reason);
        });
        this.shoukaku.on('disconnect', (name, moved) => {
            this.emit('disconnect', name, Boolean(moved));
        });
        this.shoukaku.on('reconnecting', (name) => {
            this.emit('reconnecting', name);
        });
    }
    /**
     * Initialize configured plugins
     */
    async initializePlugins() {
        try {
            await this.pluginConfig.initializePlugins(this);
        }
        catch (error) {
            this.errorHandler.handleError(error, 'PLUGIN_INITIALIZATION_ERROR');
        }
    }
    /**
     * Create a new player for a guild
     */
    createPlayer(options) {
        const existing = this.players.get(options.guildId);
        if (existing) {
            return existing;
        }
        const player = new KazagumoPlayer_1.KazagumoPlayer(this, options);
        this.players.set(options.guildId, player);
        this.stats.players++;
        this.emit('playerCreate', player);
        return player;
    }
    /**
     * Get an existing player
     */
    getPlayer(guildId) {
        return this.players.get(guildId);
    }
    /**
     * Destroy a player
     */
    destroyPlayer(guildId) {
        const player = this.players.get(guildId);
        if (!player)
            return false;
        player.destroy();
        this.players.delete(guildId);
        this.stats.players--;
        this.emit('playerDestroy', player);
        return true;
    }
    /**
     * Search for tracks with intelligent platform detection
     */
    async search(query, options) {
        this.stats.search.totalSearches++;
        try {
            return await this.searchManager.search(query, options);
        }
        catch (error) {
            throw this.errorHandler.createError(ErrorHandler_1.ErrorCode.SEARCH_FAILED, `Search failed: ${error.message}`, true, ['Check your query format', 'Verify Lavalink server status', 'Try a different search engine']);
        }
    }
    /**
     * Auto search with intelligent platform detection and fallback
     */
    async autoSearch(query, options) {
        const urlInfo = this.urlParser.parseURL(query);
        if (urlInfo.isValid) {
            return await this.searchManager.searchByURL(query, options);
        }
        return await this.searchManager.searchWithFallback(query, options);
    }
    /**
     * Parse URL and get platform information
     */
    parseURL(url) {
        return this.urlParser.parseURL(url);
    }
    /**
     * Check if error is a Kaza error
     */
    isKazaError(error) {
        return error && typeof error.code === 'string' && typeof error.recoverable === 'boolean';
    }
    /**
     * Get current statistics
     */
    getStats() {
        this.stats.uptime = Date.now() - this.startTime;
        this.stats.playingPlayers = Array.from(this.players.values()).filter(p => p.playing).length;
        this.stats.nodes = this.shoukaku.nodes.size;
        this.stats.search.cacheHitRate = this.stats.search.totalSearches > 0
            ? (this.stats.search.cacheHits / this.stats.search.totalSearches) * 100
            : 0;
        return { ...this.stats };
    }
    /**
     * Perform health check
     */
    async healthCheck() {
        const components = {
            shoukaku: this.shoukaku.nodes.size > 0,
            search: await this.searchManager.healthCheck(),
            cache: this.searchManager.isCacheHealthy(),
            plugins: this.pluginConfig.arePluginsHealthy()
        };
        const healthyCount = Object.values(components).filter(Boolean).length;
        const totalCount = Object.keys(components).length;
        let status;
        if (healthyCount === totalCount) {
            status = 'healthy';
        }
        else if (healthyCount > totalCount / 2) {
            status = 'degraded';
        }
        else {
            status = 'unhealthy';
        }
        return {
            status,
            components,
            timestamp: Date.now()
        };
    }
    /**
     * Platform-specific search methods
     */
    async searchSpotify(query, options) {
        return await this.searchManager.searchPlatform('spotify', query, options);
    }
    async searchYouTube(query, options) {
        return await this.searchManager.searchPlatform('youtube', query, options);
    }
    async searchAppleMusic(query, options) {
        return await this.searchManager.searchPlatform('appleMusic', query, options);
    }
    async searchSoundCloud(query, options) {
        return await this.searchManager.searchPlatform('soundcloud', query, options);
    }
    /**
     * Clean up resources
     */
    async destroy() {
        // Destroy all players
        for (const [guildId] of this.players) {
            this.destroyPlayer(guildId);
        }
        // Clean up plugins
        await this.pluginConfig.destroyPlugins();
        // Clean up search manager
        this.searchManager.destroy();
        // Remove all listeners
        this.removeAllListeners();
    }
}
exports.Kazagumo = Kazagumo;
//# sourceMappingURL=Kazagumo.js.map