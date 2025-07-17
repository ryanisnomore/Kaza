"use strict";
/**
 * PluginConfig - Plugin configuration and management system
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PluginConfig = void 0;
const ErrorHandler_1 = require("../Utils/ErrorHandler");
class PluginConfig {
    constructor(pluginOptions = {}) {
        this.plugins = new Map();
        this.loadedPlugins = new Set();
        this.pluginOptions = pluginOptions;
        this.errorHandler = new ErrorHandler_1.ErrorHandler();
    }
    /**
     * Initialize all enabled plugins
     */
    async initializePlugins(kazagumo) {
        const pluginNames = Object.keys(this.pluginOptions);
        for (const pluginName of pluginNames) {
            const options = this.pluginOptions[pluginName];
            if (options?.enabled) {
                try {
                    await this.loadPlugin(pluginName, kazagumo);
                }
                catch (error) {
                    this.errorHandler.handleError(error, `Plugin initialization: ${pluginName}`);
                }
            }
        }
    }
    /**
     * Load a specific plugin
     */
    async loadPlugin(name, kazagumo) {
        if (this.loadedPlugins.has(name)) {
            return;
        }
        try {
            // Dynamic import for built-in plugins
            const PluginClass = await this.importPlugin(name);
            if (!PluginClass) {
                throw this.errorHandler.createError(ErrorHandler_1.ErrorCode.PLUGIN_NOT_FOUND, `Plugin '${name}' not found`, false, ['Check plugin name', 'Verify plugin is installed', 'Check plugin path']);
            }
            const plugin = new PluginClass();
            // Validate plugin interface
            this.validatePlugin(plugin);
            // Initialize plugin
            await plugin.initialize(kazagumo);
            this.plugins.set(name, plugin);
            this.loadedPlugins.add(name);
            console.log(`Plugin '${name}' loaded successfully`);
        }
        catch (error) {
            throw this.errorHandler.createError(ErrorHandler_1.ErrorCode.PLUGIN_INITIALIZATION_ERROR, `Failed to load plugin '${name}': ${error.message}`, true, ['Check plugin configuration', 'Verify plugin dependencies', 'Update plugin version']);
        }
    }
    /**
     * Unload a specific plugin
     */
    async unloadPlugin(name) {
        const plugin = this.plugins.get(name);
        if (!plugin) {
            throw this.errorHandler.createError(ErrorHandler_1.ErrorCode.PLUGIN_NOT_FOUND, `Plugin '${name}' is not loaded`, false);
        }
        try {
            await plugin.destroy();
            this.plugins.delete(name);
            this.loadedPlugins.delete(name);
            console.log(`Plugin '${name}' unloaded successfully`);
        }
        catch (error) {
            throw this.errorHandler.createError(ErrorHandler_1.ErrorCode.PLUGIN_EXECUTION_ERROR, `Failed to unload plugin '${name}': ${error.message}`, true);
        }
    }
    /**
     * Get loaded plugin
     */
    getPlugin(name) {
        return this.plugins.get(name) || null;
    }
    /**
     * Check if plugin is loaded
     */
    isPluginLoaded(name) {
        return this.loadedPlugins.has(name);
    }
    /**
     * Get all loaded plugins
     */
    getLoadedPlugins() {
        return Array.from(this.loadedPlugins);
    }
    /**
     * Get plugin metadata
     */
    getPluginMetadata(name) {
        const plugin = this.plugins.get(name);
        return plugin ? plugin.metadata : null;
    }
    /**
     * Get plugin options
     */
    getPluginOptions(name) {
        return this.pluginOptions[name] || null;
    }
    /**
     * Update plugin options
     */
    updatePluginOptions(name, options) {
        if (this.pluginOptions[name]) {
            if (options) {
                Object.assign(this.pluginOptions[name], options);
            }
        }
        else {
            this.pluginOptions[name] = options;
        }
    }
    /**
     * Check if all plugins are healthy
     */
    arePluginsHealthy() {
        for (const plugin of this.plugins.values()) {
            if (!plugin.metadata.enabled) {
                return false;
            }
        }
        return true;
    }
    /**
     * Get plugin execution order by priority
     */
    getPluginExecutionOrder() {
        const plugins = Array.from(this.plugins.entries());
        plugins.sort(([, a], [, b]) => {
            const priorityA = a.metadata.priority || 0;
            const priorityB = b.metadata.priority || 0;
            return priorityB - priorityA; // Higher priority first
        });
        return plugins.map(([name]) => name);
    }
    /**
     * Execute plugin hook
     */
    async executePluginHook(hookName, ...args) {
        const executionOrder = this.getPluginExecutionOrder();
        for (const pluginName of executionOrder) {
            const plugin = this.plugins.get(pluginName);
            if (!plugin || !plugin.metadata.enabled) {
                continue;
            }
            const hookFunction = plugin[hookName];
            if (typeof hookFunction === 'function') {
                try {
                    const result = hookFunction.apply(plugin, args);
                    if (result && typeof result.then === 'function') {
                        await result;
                    }
                }
                catch (error) {
                    this.errorHandler.handleError(error, `Plugin hook execution: ${pluginName}.${hookName}`);
                }
            }
        }
    }
    /**
     * Validate plugin interface
     */
    validatePlugin(plugin) {
        if (!plugin.metadata) {
            throw new Error('Plugin must have metadata property');
        }
        const required = ['name', 'version', 'description', 'author'];
        for (const field of required) {
            if (!plugin.metadata[field]) {
                throw new Error(`Plugin metadata missing required field: ${field}`);
            }
        }
        if (typeof plugin.initialize !== 'function') {
            throw new Error('Plugin must have initialize method');
        }
        if (typeof plugin.destroy !== 'function') {
            throw new Error('Plugin must have destroy method');
        }
    }
    /**
     * Import plugin dynamically
     */
    async importPlugin(name) {
        try {
            // Try to import built-in plugins first
            const builtInPlugins = {
                'PlayerMoved': () => Promise.resolve().then(() => __importStar(require('../Plugins/PlayerMoved'))).then(m => m.PlayerMoved),
            };
            if (builtInPlugins[name]) {
                return await builtInPlugins[name]();
            }
            // Try to import external plugin
            return await Promise.resolve(`${name}`).then(s => __importStar(require(s)));
        }
        catch (error) {
            return null;
        }
    }
    /**
     * Get plugin statistics
     */
    getPluginStats() {
        const totalPlugins = Object.keys(this.pluginOptions).length;
        const enabledPlugins = this.loadedPlugins.size;
        const disabledPlugins = totalPlugins - enabledPlugins;
        const pluginsByPriority = Array.from(this.plugins.entries())
            .map(([name, plugin]) => ({
            name,
            priority: plugin.metadata.priority || 0
        }))
            .sort((a, b) => b.priority - a.priority);
        return {
            totalPlugins,
            enabledPlugins,
            disabledPlugins,
            pluginsByPriority
        };
    }
    /**
     * Destroy all plugins
     */
    async destroyPlugins() {
        const pluginNames = Array.from(this.loadedPlugins);
        for (const pluginName of pluginNames) {
            try {
                await this.unloadPlugin(pluginName);
            }
            catch (error) {
                this.errorHandler.handleError(error, `Plugin destruction: ${pluginName}`);
            }
        }
    }
    /**
     * Check plugin dependencies
     */
    checkPluginDependencies(name) {
        const plugin = this.plugins.get(name);
        if (!plugin) {
            return { satisfied: false, missing: [] };
        }
        const dependencies = plugin.metadata.dependencies || [];
        const missing = dependencies.filter(dep => !this.isPluginLoaded(dep));
        return {
            satisfied: missing.length === 0,
            missing
        };
    }
    /**
     * Get plugin configuration schema
     */
    getPluginConfigSchema() {
        const schema = {};
        for (const [name, plugin] of this.plugins) {
            schema[name] = {
                enabled: { type: 'boolean', default: true },
                priority: { type: 'number', default: 0 },
                config: { type: 'object', default: {} }
            };
        }
        return schema;
    }
}
exports.PluginConfig = PluginConfig;
//# sourceMappingURL=PluginConfig.js.map