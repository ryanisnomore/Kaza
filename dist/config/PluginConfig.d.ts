/**
 * PluginConfig - Plugin configuration and management system
 */
import { PluginOptions, PluginInterface, PluginMetadata } from '../types';
export declare class PluginConfig {
    private readonly plugins;
    private readonly pluginOptions;
    private readonly errorHandler;
    private readonly loadedPlugins;
    constructor(pluginOptions?: Record<string, PluginOptions>);
    /**
     * Initialize all enabled plugins
     */
    initializePlugins(kazagumo: any): Promise<void>;
    /**
     * Load a specific plugin
     */
    loadPlugin(name: string, kazagumo: any): Promise<void>;
    /**
     * Unload a specific plugin
     */
    unloadPlugin(name: string): Promise<void>;
    /**
     * Get loaded plugin
     */
    getPlugin(name: string): PluginInterface | null;
    /**
     * Check if plugin is loaded
     */
    isPluginLoaded(name: string): boolean;
    /**
     * Get all loaded plugins
     */
    getLoadedPlugins(): string[];
    /**
     * Get plugin metadata
     */
    getPluginMetadata(name: string): PluginMetadata | null;
    /**
     * Get plugin options
     */
    getPluginOptions(name: string): PluginOptions | null;
    /**
     * Update plugin options
     */
    updatePluginOptions(name: string, options: Partial<PluginOptions>): void;
    /**
     * Check if all plugins are healthy
     */
    arePluginsHealthy(): boolean;
    /**
     * Get plugin execution order by priority
     */
    getPluginExecutionOrder(): string[];
    /**
     * Execute plugin hook
     */
    executePluginHook(hookName: keyof PluginInterface, ...args: any[]): Promise<void>;
    /**
     * Validate plugin interface
     */
    private validatePlugin;
    /**
     * Import plugin dynamically
     */
    private importPlugin;
    /**
     * Get plugin statistics
     */
    getPluginStats(): {
        totalPlugins: number;
        enabledPlugins: number;
        disabledPlugins: number;
        pluginsByPriority: Array<{
            name: string;
            priority: number;
        }>;
    };
    /**
     * Destroy all plugins
     */
    destroyPlugins(): Promise<void>;
    /**
     * Check plugin dependencies
     */
    checkPluginDependencies(name: string): {
        satisfied: boolean;
        missing: string[];
    };
    /**
     * Get plugin configuration schema
     */
    getPluginConfigSchema(): Record<string, any>;
}
//# sourceMappingURL=PluginConfig.d.ts.map