"use strict";
/**
 * Kaza - Advanced Lavalink wrapper with intelligent multi-platform search
 * @version 3.3.0
 * @author RY4N
 * @license MIT
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.libraryName = exports.version = exports.PlayerMoved = exports.PluginConfig = exports.ErrorCode = exports.ErrorHandler = exports.URLParser = exports.EnhancedSearchManager = exports.KazagumoQueue = exports.KazagumoPlayer = exports.Kaza = exports.Kazagumo = void 0;
const tslib_1 = require("tslib");
// Core exports
var Kazagumo_1 = require("./Kazagumo");
Object.defineProperty(exports, "Kazagumo", { enumerable: true, get: function () { return Kazagumo_1.Kazagumo; } });
var Kazagumo_2 = require("./Kazagumo"); // Alias for the new name
Object.defineProperty(exports, "Kaza", { enumerable: true, get: function () { return Kazagumo_2.Kazagumo; } });
// Core managers
var KazagumoPlayer_1 = require("./Managers/KazagumoPlayer");
Object.defineProperty(exports, "KazagumoPlayer", { enumerable: true, get: function () { return KazagumoPlayer_1.KazagumoPlayer; } });
var KazagumoQueue_1 = require("./Managers/KazagumoQueue");
Object.defineProperty(exports, "KazagumoQueue", { enumerable: true, get: function () { return KazagumoQueue_1.KazagumoQueue; } });
var EnhancedSearchManager_1 = require("./Managers/EnhancedSearchManager");
Object.defineProperty(exports, "EnhancedSearchManager", { enumerable: true, get: function () { return EnhancedSearchManager_1.EnhancedSearchManager; } });
// Enhanced utilities
var URLParser_1 = require("./Utils/URLParser");
Object.defineProperty(exports, "URLParser", { enumerable: true, get: function () { return URLParser_1.URLParser; } });
var ErrorHandler_1 = require("./Utils/ErrorHandler");
Object.defineProperty(exports, "ErrorHandler", { enumerable: true, get: function () { return ErrorHandler_1.ErrorHandler; } });
Object.defineProperty(exports, "ErrorCode", { enumerable: true, get: function () { return ErrorHandler_1.ErrorCode; } });
var PluginConfig_1 = require("./config/PluginConfig");
Object.defineProperty(exports, "PluginConfig", { enumerable: true, get: function () { return PluginConfig_1.PluginConfig; } });
// Plugins
var PlayerMoved_1 = require("./Plugins/PlayerMoved");
Object.defineProperty(exports, "PlayerMoved", { enumerable: true, get: function () { return PlayerMoved_1.PlayerMoved; } });
// Types
tslib_1.__exportStar(require("./types"), exports);
// Version info
exports.version = '3.3.0';
exports.libraryName = 'Kaza';
// Default export for convenience
const Kazagumo_3 = require("./Kazagumo");
const KazagumoPlayer_2 = require("./Managers/KazagumoPlayer");
const KazagumoQueue_2 = require("./Managers/KazagumoQueue");
const EnhancedSearchManager_2 = require("./Managers/EnhancedSearchManager");
const URLParser_2 = require("./Utils/URLParser");
const ErrorHandler_2 = require("./Utils/ErrorHandler");
const PluginConfig_2 = require("./config/PluginConfig");
const PlayerMoved_2 = require("./Plugins/PlayerMoved");
exports.default = {
    Kazagumo: Kazagumo_3.Kazagumo,
    Kaza: Kazagumo_3.Kazagumo,
    KazagumoPlayer: KazagumoPlayer_2.KazagumoPlayer,
    KazagumoQueue: KazagumoQueue_2.KazagumoQueue,
    EnhancedSearchManager: EnhancedSearchManager_2.EnhancedSearchManager,
    URLParser: URLParser_2.URLParser,
    ErrorHandler: ErrorHandler_2.ErrorHandler,
    ErrorCode: ErrorHandler_2.ErrorCode,
    PluginConfig: PluginConfig_2.PluginConfig,
    PlayerMoved: PlayerMoved_2.PlayerMoved,
    version: exports.version,
    libraryName: exports.libraryName
};
//# sourceMappingURL=index.js.map