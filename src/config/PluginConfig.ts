/**
 * PluginConfig - Plugin configuration and management system
 */

import { PluginOptions, PluginInterface, PluginMetadata } from '../types';
import { ErrorHandler, ErrorCode } from '../Utils/ErrorHandler';

export class PluginConfig {
  private readonly plugins: Map<string, PluginInterface> = new Map();
  private readonly pluginOptions: Record<string, PluginOptions>;
  private readonly errorHandler: ErrorHandler;
  private readonly loadedPlugins: Set<string> = new Set();

  constructor(pluginOptions: Record<string, PluginOptions> = {}) {
    this.pluginOptions = pluginOptions;
    this.errorHandler = new ErrorHandler();
  }

  /**
   * Initialize all enabled plugins
   */
  public async initializePlugins(kazagumo: any): Promise<void> {
    const pluginNames = Object.keys(this.pluginOptions);
    
    for (const pluginName of pluginNames) {
      const options = this.pluginOptions[pluginName];
      
      if (options?.enabled) {
        try {
          await this.loadPlugin(pluginName, kazagumo);
        } catch (error) {
          this.errorHandler.handleError(
            error as Error,
            `Plugin initialization: ${pluginName}`
          );
        }
      }
    }
  }

  /**
   * Load a specific plugin
   */
  public async loadPlugin(name: string, kazagumo: any): Promise<void> {
    if (this.loadedPlugins.has(name)) {
      return;
    }

    try {
      // Dynamic import for built-in plugins
      const PluginClass = await this.importPlugin(name);
      
      if (!PluginClass) {
        throw this.errorHandler.createError(
          ErrorCode.PLUGIN_NOT_FOUND,
          `Plugin '${name}' not found`,
          false,
          ['Check plugin name', 'Verify plugin is installed', 'Check plugin path']
        );
      }

      const plugin = new PluginClass();
      
      // Validate plugin interface
      this.validatePlugin(plugin);
      
      // Initialize plugin
      await plugin.initialize(kazagumo);
      
      this.plugins.set(name, plugin);
      this.loadedPlugins.add(name);
      
      console.log(`Plugin '${name}' loaded successfully`);
    } catch (error) {
      throw this.errorHandler.createError(
        ErrorCode.PLUGIN_INITIALIZATION_ERROR,
        `Failed to load plugin '${name}': ${(error as Error).message}`,
        true,
        ['Check plugin configuration', 'Verify plugin dependencies', 'Update plugin version']
      );
    }
  }

  /**
   * Unload a specific plugin
   */
  public async unloadPlugin(name: string): Promise<void> {
    const plugin = this.plugins.get(name);
    
    if (!plugin) {
      throw this.errorHandler.createError(
        ErrorCode.PLUGIN_NOT_FOUND,
        `Plugin '${name}' is not loaded`,
        false
      );
    }

    try {
      await plugin.destroy();
      this.plugins.delete(name);
      this.loadedPlugins.delete(name);
      
      console.log(`Plugin '${name}' unloaded successfully`);
    } catch (error) {
      throw this.errorHandler.createError(
        ErrorCode.PLUGIN_EXECUTION_ERROR,
        `Failed to unload plugin '${name}': ${(error as Error).message}`,
        true
      );
    }
  }

  /**
   * Get loaded plugin
   */
  public getPlugin(name: string): PluginInterface | null {
    return this.plugins.get(name) || null;
  }

  /**
   * Check if plugin is loaded
   */
  public isPluginLoaded(name: string): boolean {
    return this.loadedPlugins.has(name);
  }

  /**
   * Get all loaded plugins
   */
  public getLoadedPlugins(): string[] {
    return Array.from(this.loadedPlugins);
  }

  /**
   * Get plugin metadata
   */
  public getPluginMetadata(name: string): PluginMetadata | null {
    const plugin = this.plugins.get(name);
    return plugin ? plugin.metadata : null;
  }

  /**
   * Get plugin options
   */
  public getPluginOptions(name: string): PluginOptions | null {
    return this.pluginOptions[name] || null;
  }

  /**
   * Update plugin options
   */
  public updatePluginOptions(name: string, options: Partial<PluginOptions>): void {
    if (this.pluginOptions[name]) {
      if (options) {
        Object.assign(this.pluginOptions[name]!, options);
      }
    } else {
      this.pluginOptions[name] = options as PluginOptions;
    }
  }

  /**
   * Check if all plugins are healthy
   */
  public arePluginsHealthy(): boolean {
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
  public getPluginExecutionOrder(): string[] {
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
  public async executePluginHook(
    hookName: keyof PluginInterface,
    ...args: any[]
  ): Promise<void> {
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
        } catch (error) {
          this.errorHandler.handleError(
            error as Error,
            `Plugin hook execution: ${pluginName}.${hookName}`
          );
        }
      }
    }
  }

  /**
   * Validate plugin interface
   */
  private validatePlugin(plugin: any): void {
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
  private async importPlugin(name: string): Promise<any> {
    try {
      // Try to import built-in plugins first
      const builtInPlugins: Record<string, () => Promise<any>> = {
        'PlayerMoved': () => import('../Plugins/PlayerMoved').then(m => m.PlayerMoved),
      };

      if (builtInPlugins[name]) {
        return await builtInPlugins[name]!();
      }

      // Try to import external plugin
      return await import(name);
    } catch (error) {
      return null;
    }
  }

  /**
   * Get plugin statistics
   */
  public getPluginStats(): {
    totalPlugins: number;
    enabledPlugins: number;
    disabledPlugins: number;
    pluginsByPriority: Array<{ name: string; priority: number }>;
  } {
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
  public async destroyPlugins(): Promise<void> {
    const pluginNames = Array.from(this.loadedPlugins);
    
    for (const pluginName of pluginNames) {
      try {
        await this.unloadPlugin(pluginName);
      } catch (error) {
        this.errorHandler.handleError(
          error as Error,
          `Plugin destruction: ${pluginName}`
        );
      }
    }
  }

  /**
   * Check plugin dependencies
   */
  public checkPluginDependencies(name: string): {
    satisfied: boolean;
    missing: string[];
  } {
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
  public getPluginConfigSchema(): Record<string, any> {
    const schema: Record<string, any> = {};
    
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
