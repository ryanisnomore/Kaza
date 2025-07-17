/**
 * Kaza - Advanced Lavalink wrapper with intelligent multi-platform search
 * @version 3.3.0
 * @author RY4N
 * @license MIT
 */
export { Kazagumo } from './Kazagumo';
export { Kazagumo as Kaza } from './Kazagumo';
export { KazagumoPlayer } from './Managers/KazagumoPlayer';
export { KazagumoQueue } from './Managers/KazagumoQueue';
export { EnhancedSearchManager } from './Managers/EnhancedSearchManager';
export { URLParser } from './Utils/URLParser';
export { ErrorHandler, ErrorCode } from './Utils/ErrorHandler';
export { PluginConfig } from './config/PluginConfig';
export { PlayerMoved } from './Plugins/PlayerMoved';
export * from './types';
export declare const version = "3.3.0";
export declare const libraryName = "Kaza";
import { Kazagumo } from './Kazagumo';
import { KazagumoPlayer } from './Managers/KazagumoPlayer';
import { KazagumoQueue } from './Managers/KazagumoQueue';
import { EnhancedSearchManager } from './Managers/EnhancedSearchManager';
import { URLParser } from './Utils/URLParser';
import { ErrorHandler, ErrorCode } from './Utils/ErrorHandler';
import { PluginConfig } from './config/PluginConfig';
import { PlayerMoved } from './Plugins/PlayerMoved';
declare const _default: {
    Kazagumo: typeof Kazagumo;
    Kaza: typeof Kazagumo;
    KazagumoPlayer: typeof KazagumoPlayer;
    KazagumoQueue: typeof KazagumoQueue;
    EnhancedSearchManager: typeof EnhancedSearchManager;
    URLParser: typeof URLParser;
    ErrorHandler: typeof ErrorHandler;
    ErrorCode: typeof ErrorCode;
    PluginConfig: typeof PluginConfig;
    PlayerMoved: typeof PlayerMoved;
    version: string;
    libraryName: string;
};
export default _default;
//# sourceMappingURL=index.d.ts.map