/**
 * Kaza - Advanced Lavalink wrapper with intelligent multi-platform search
 * @version 3.3.0
 * @author RY4N
 * @license MIT
 */

// Core exports
export { Kazagumo } from './Kazagumo';
export { Kazagumo as Kaza } from './Kazagumo'; // Alias for the new name

// Core managers
export { KazagumoPlayer } from './Managers/KazagumoPlayer';
export { KazagumoQueue } from './Managers/KazagumoQueue';
export { EnhancedSearchManager } from './Managers/EnhancedSearchManager';

// Enhanced utilities
export { URLParser } from './Utils/URLParser';
export { ErrorHandler, ErrorCode } from './Utils/ErrorHandler';
export { PluginConfig } from './config/PluginConfig';

// Plugins
export { PlayerMoved } from './Plugins/PlayerMoved';

// Types
export * from './types';

// Version info
export const version = '3.3.0';
export const libraryName = 'Kaza';

// Default export for convenience
import { Kazagumo } from './Kazagumo';
import { KazagumoPlayer } from './Managers/KazagumoPlayer';
import { KazagumoQueue } from './Managers/KazagumoQueue';
import { EnhancedSearchManager } from './Managers/EnhancedSearchManager';
import { URLParser } from './Utils/URLParser';
import { ErrorHandler, ErrorCode } from './Utils/ErrorHandler';
import { PluginConfig } from './config/PluginConfig';
import { PlayerMoved } from './Plugins/PlayerMoved';

export default {
  Kazagumo,
  Kaza: Kazagumo,
  KazagumoPlayer,
  KazagumoQueue,
  EnhancedSearchManager,
  URLParser,
  ErrorHandler,
  ErrorCode,
  PluginConfig,
  PlayerMoved,
  version,
  libraryName
};
