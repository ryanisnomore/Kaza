/**
 * Enhanced plugin configuration system for Kaza
 */

import { ErrorHandler, ErrorCode } from '../Utils/ErrorHandler';

export interface PluginConfigOptions {
    enabled: boolean;
    priority: number;
    autoLoad: boolean;
    dependencies?: string[];
    config?: Record<string, any>;
}

export interface PluginManifest {
    name: string;
    version: string;
    description?: string;
    author?: string;
    main: string;
    dependencies?: string[];
    kazaVersion?: string;
    config?: PluginConfigOptions;
}

export class PluginConfig {
    private static readonly defaultConfig: PluginConfigOptions = {
        enabled: true,
        priority: 10,
        autoLoad: true,
        dependencies: [],
        config: {}
    };

    private static readonly builtinPlugins: Record<string, PluginConfigOptions> = {
        'PlayerMoved': {
            enabled: true,
            priority: 100,
            autoLoad: true,
            dependencies: [],
            config: {
                autoReconnect: true,
                maxReconnectAttempts: 3,
                reconnectDelay: 5000
            }
        },
        'AutoLeave': {
            enabled: false,
            priority: 50,
            autoLoad: false,
            dependencies: [],
            config: {
                emptyChannelTimeout: 300000, // 5 minutes
                aloneTimeout: 60000, // 1 minute
                queueEndTimeout: 30000 // 30 seconds
            }
        },
        'QueueSaver': {
            enabled: false,
            priority: 30,
            autoLoad: false,
            dependencies: [],
            config: {
                saveOnShutdown: true,
                autoSaveInterval: 600000, // 10 minutes
                maxSavedQueues: 100
            }
        },
        'VolumeNormalizer': {
            enabled: false,
            priority: 20,
            autoLoad: false,
            dependencies: [],
            config: {
                targetLUFS: -16,
                maxGain: 6,
                algorithm: 'replaygain'
            }
        },
        'CrossFade': {
            enabled: false,
            priority: 15,
            autoLoad: false,
            dependencies: [],
            config: {
                duration: 3000,
                curve: 'linear',
                autoEnable: false
            }
        }
    };

    private plugins: Map<string, PluginConfigOptions> = new Map();
    private loadOrder: string[] = [];

    constructor(customConfig?: Record<string, Partial<PluginConfigOptions>>) {
        this.initializePlugins(customConfig);
    }

    /**
     * Initialize plugin configurations
     */
    private initializePlugins(customConfig?: Record<string, Partial<PluginConfigOptions>>): void {
        // Load builtin plugins with defaults
        for (const [name, config] of Object.entries(PluginConfig.builtinPlugins)) {
            const mergedConfig = this.mergeConfig(config, customConfig?.[name]);
            this.plugins.set(name, mergedConfig);
        }

        // Add custom plugins
        if (customConfig) {
            for (const [name, config] of Object.entries(customConfig)) {
                if (!PluginConfig.builtinPlugins[name]) {
                    const mergedConfig = this.mergeConfig(PluginConfig.defaultConfig, config);
                    this.plugins.set(name, mergedConfig);
                }
            }
        }

        this.calculateLoadOrder();
    }

    /**
     * Merge plugin configurations
     */
    private mergeConfig(
        defaultConfig: PluginConfigOptions,
        customConfig?: Partial<PluginConfigOptions>
    ): PluginConfigOptions {
        if (!customConfig) return { ...defaultConfig };

        return {
            enabled: customConfig.enabled ?? defaultConfig.enabled,
            priority: customConfig.priority ?? defaultConfig.priority,
            autoLoad: customConfig.autoLoad ?? defaultConfig.autoLoad,
            dependencies: customConfig.dependencies || defaultConfig.dependencies || [],
            config: { ...defaultConfig.config, ...customConfig.config }
        };
    }

    /**
     * Calculate plugin load order based on dependencies and priority
     */
    private calculateLoadOrder(): void {
        const sorted: string[] = [];
        const visited = new Set<string>();
        const visiting = new Set<string>();

        const visit = (pluginName: string): void => {
            if (visiting.has(pluginName)) {
                throw ErrorHandler.createError(
                    ErrorCode.PLUGIN_LOAD_FAILED,
                    { plugin: pluginName, reason: 'Circular dependency detected' }
                );
            }

            if (visited.has(pluginName)) return;

            const config = this.plugins.get(pluginName);
            if (!config || !config.enabled) return;

            visiting.add(pluginName);

            // Visit dependencies first
            for (const dependency of config.dependencies || []) {
                if (this.plugins.has(dependency)) {
                    visit(dependency);
                }
            }

            visiting.delete(pluginName);
            visited.add(pluginName);
            sorted.push(pluginName);
        };

        // Sort by priority first, then resolve dependencies
        const enabledPlugins = Array.from(this.plugins.entries())
            .filter(([_, config]) => config.enabled)
            .sort(([, a], [, b]) => b.priority - a.priority)
            .map(([name]) => name);

        for (const pluginName of enabledPlugins) {
            visit(pluginName);
        }

        this.loadOrder = sorted;
    }

    /**
     * Get plugin configuration
     */
    public getPluginConfig(name: string): PluginConfigOptions | null {
        return this.plugins.get(name) || null;
    }

    /**
     * Set plugin configuration
     */
    public setPluginConfig(name: string, config: Partial<PluginConfigOptions>): void {
        const existing = this.plugins.get(name) || PluginConfig.defaultConfig;
        const merged = this.mergeConfig(existing, config);
        this.plugins.set(name, merged);
        this.calculateLoadOrder();
    }

    /**
     * Enable/disable plugin
     */
    public setPluginEnabled(name: string, enabled: boolean): void {
        const config = this.plugins.get(name);
        if (config) {
            config.enabled = enabled;
            this.calculateLoadOrder();
        }
    }

    /**
     * Get plugins in load order
     */
    public getLoadOrder(): string[] {
        return [...this.loadOrder];
    }

    /**
     * Get enabled plugins
     */
    public getEnabledPlugins(): Map<string, PluginConfigOptions> {
        const enabled = new Map<string, PluginConfigOptions>();
        for (const [name, config] of this.plugins) {
            if (config.enabled) {
                enabled.set(name, config);
            }
        }
        return enabled;
    }

    /**
     * Validate plugin dependencies
     */
    public validateDependencies(): string[] {
        const errors: string[] = [];

        for (const [name, config] of this.plugins) {
            if (!config.enabled) continue;

            for (const dependency of config.dependencies || []) {
                const depConfig = this.plugins.get(dependency);
                if (!depConfig || !depConfig.enabled) {
                    errors.push(`Plugin "${name}" requires "${dependency}" to be enabled`);
                }
            }
        }

        return errors;
    }

    /**
     * Get plugin statistics
     */
    public getStats(): {
        total: number;
        enabled: number;
        autoLoad: number;
        builtin: number;
        custom: number;
    } {
        let enabled = 0;
        let autoLoad = 0;
        let builtin = 0;
        let custom = 0;

        for (const [name, config] of this.plugins) {
            if (config.enabled) enabled++;
            if (config.autoLoad) autoLoad++;
            if (PluginConfig.builtinPlugins[name]) {
                builtin++;
            } else {
                custom++;
            }
        }

        return {
            total: this.plugins.size,
            enabled,
            autoLoad,
            builtin,
            custom
        };
    }

    /**
     * Export configuration to JSON
     */
    public exportConfig(): Record<string, PluginConfigOptions> {
        const config: Record<string, PluginConfigOptions> = {};
        for (const [name, pluginConfig] of this.plugins) {
            config[name] = { ...pluginConfig };
        }
        return config;
    }

    /**
     * Import configuration from JSON
     */
    public importConfig(config: Record<string, Partial<PluginConfigOptions>>): void {
        this.plugins.clear();
        this.initializePlugins(config);
    }

    /**
     * Reset to default configuration
     */
    public reset(): void {
        this.plugins.clear();
        this.initializePlugins();
    }
}
