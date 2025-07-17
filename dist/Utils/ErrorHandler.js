"use strict";
/**
 * ErrorHandler - Comprehensive error handling with recovery suggestions
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ErrorHandler = exports.ErrorCode = void 0;
var ErrorCode;
(function (ErrorCode) {
    // Search errors
    ErrorCode["SEARCH_FAILED"] = "SEARCH_FAILED";
    ErrorCode["SEARCH_NO_RESULTS"] = "SEARCH_NO_RESULTS";
    ErrorCode["SEARCH_TIMEOUT"] = "SEARCH_TIMEOUT";
    ErrorCode["INVALID_QUERY"] = "INVALID_QUERY";
    // URL errors
    ErrorCode["INVALID_URL"] = "INVALID_URL";
    ErrorCode["URL_NOT_ACCESSIBLE"] = "URL_NOT_ACCESSIBLE";
    // Platform errors
    ErrorCode["PLATFORM_NOT_SUPPORTED"] = "PLATFORM_NOT_SUPPORTED";
    ErrorCode["PLATFORM_UNAVAILABLE"] = "PLATFORM_UNAVAILABLE";
    ErrorCode["PLATFORM_RATE_LIMITED"] = "PLATFORM_RATE_LIMITED";
    // Player errors
    ErrorCode["PLAYER_NOT_FOUND"] = "PLAYER_NOT_FOUND";
    ErrorCode["PLAYER_NOT_CONNECTED"] = "PLAYER_NOT_CONNECTED";
    ErrorCode["PLAYER_ALREADY_EXISTS"] = "PLAYER_ALREADY_EXISTS";
    ErrorCode["VOICE_CHANNEL_NOT_FOUND"] = "VOICE_CHANNEL_NOT_FOUND";
    ErrorCode["VOICE_PERMISSIONS_MISSING"] = "VOICE_PERMISSIONS_MISSING";
    // Queue errors
    ErrorCode["QUEUE_EMPTY"] = "QUEUE_EMPTY";
    ErrorCode["QUEUE_FULL"] = "QUEUE_FULL";
    ErrorCode["TRACK_NOT_FOUND"] = "TRACK_NOT_FOUND";
    ErrorCode["INVALID_TRACK_INDEX"] = "INVALID_TRACK_INDEX";
    // Node errors
    ErrorCode["NODE_NOT_AVAILABLE"] = "NODE_NOT_AVAILABLE";
    ErrorCode["NODE_CONNECTION_FAILED"] = "NODE_CONNECTION_FAILED";
    ErrorCode["NODE_DISCONNECTED"] = "NODE_DISCONNECTED";
    // Plugin errors
    ErrorCode["PLUGIN_NOT_FOUND"] = "PLUGIN_NOT_FOUND";
    ErrorCode["PLUGIN_INITIALIZATION_ERROR"] = "PLUGIN_INITIALIZATION_ERROR";
    ErrorCode["PLUGIN_EXECUTION_ERROR"] = "PLUGIN_EXECUTION_ERROR";
    // Configuration errors
    ErrorCode["INVALID_CONFIGURATION"] = "INVALID_CONFIGURATION";
    ErrorCode["MISSING_CREDENTIALS"] = "MISSING_CREDENTIALS";
    // General errors
    ErrorCode["UNKNOWN_ERROR"] = "UNKNOWN_ERROR";
    ErrorCode["NETWORK_ERROR"] = "NETWORK_ERROR";
    ErrorCode["TIMEOUT_ERROR"] = "TIMEOUT_ERROR";
    ErrorCode["PERMISSION_DENIED"] = "PERMISSION_DENIED";
})(ErrorCode || (exports.ErrorCode = ErrorCode = {}));
class ErrorHandler {
    constructor() {
        this.errorDatabase = new Map([
            [ErrorCode.SEARCH_FAILED, {
                    recoverable: true,
                    suggestions: [
                        'Check your internet connection',
                        'Verify Lavalink server is running',
                        'Try a different search query',
                        'Check if the platform is supported'
                    ],
                    severity: 'medium'
                }],
            [ErrorCode.SEARCH_NO_RESULTS, {
                    recoverable: true,
                    suggestions: [
                        'Try different keywords',
                        'Check spelling of your search query',
                        'Try searching on a different platform',
                        'Use more specific search terms'
                    ],
                    severity: 'low'
                }],
            [ErrorCode.SEARCH_TIMEOUT, {
                    recoverable: true,
                    suggestions: [
                        'Check your internet connection',
                        'Verify Lavalink server response time',
                        'Try again later',
                        'Consider increasing timeout value'
                    ],
                    severity: 'medium'
                }],
            [ErrorCode.INVALID_URL, {
                    recoverable: false,
                    suggestions: [
                        'Check URL format',
                        'Ensure URL is from a supported platform',
                        'Remove any tracking parameters',
                        'Verify URL is accessible'
                    ],
                    severity: 'low'
                }],
            [ErrorCode.PLATFORM_NOT_SUPPORTED, {
                    recoverable: false,
                    suggestions: [
                        'Check list of supported platforms',
                        'Enable platform in configuration',
                        'Request platform support from developers',
                        'Use alternative platform'
                    ],
                    severity: 'low'
                }],
            [ErrorCode.PLAYER_NOT_FOUND, {
                    recoverable: true,
                    suggestions: [
                        'Create a new player first',
                        'Check if player was destroyed',
                        'Verify guild ID is correct',
                        'Use createPlayer() method'
                    ],
                    severity: 'medium'
                }],
            [ErrorCode.PLAYER_NOT_CONNECTED, {
                    recoverable: true,
                    suggestions: [
                        'Join a voice channel first',
                        'Check voice channel permissions',
                        'Verify bot has voice permissions',
                        'Try reconnecting to voice channel'
                    ],
                    severity: 'medium'
                }],
            [ErrorCode.VOICE_PERMISSIONS_MISSING, {
                    recoverable: true,
                    suggestions: [
                        'Grant bot voice permissions',
                        'Check role hierarchy',
                        'Verify channel permissions',
                        'Contact server administrator'
                    ],
                    severity: 'high'
                }],
            [ErrorCode.QUEUE_EMPTY, {
                    recoverable: true,
                    suggestions: [
                        'Add tracks to queue first',
                        'Search for music',
                        'Check if queue was cleared',
                        'Use search commands'
                    ],
                    severity: 'low'
                }],
            [ErrorCode.NODE_NOT_AVAILABLE, {
                    recoverable: true,
                    suggestions: [
                        'Check Lavalink server status',
                        'Verify node configuration',
                        'Restart Lavalink server',
                        'Check network connectivity'
                    ],
                    severity: 'critical'
                }],
            [ErrorCode.NODE_CONNECTION_FAILED, {
                    recoverable: true,
                    suggestions: [
                        'Check Lavalink server address',
                        'Verify authentication credentials',
                        'Check firewall settings',
                        'Ensure Lavalink server is running'
                    ],
                    severity: 'critical'
                }],
            [ErrorCode.PLUGIN_INITIALIZATION_ERROR, {
                    recoverable: true,
                    suggestions: [
                        'Check plugin configuration',
                        'Verify plugin dependencies',
                        'Update plugin version',
                        'Disable problematic plugins'
                    ],
                    severity: 'medium'
                }],
            [ErrorCode.MISSING_CREDENTIALS, {
                    recoverable: true,
                    suggestions: [
                        'Add required API credentials',
                        'Check environment variables',
                        'Verify credential format',
                        'Contact platform for API access'
                    ],
                    severity: 'high'
                }]
        ]);
    }
    /**
     * Create a detailed Kazagumo error
     */
    createError(code, message, recoverable = true, suggestions = []) {
        const errorInfo = this.errorDatabase.get(code) || {};
        const error = new Error(message);
        error.code = code;
        error.recoverable = recoverable;
        error.suggestions = suggestions.length > 0 ? suggestions : (errorInfo.suggestions || []);
        error.name = 'KazagumoError';
        return error;
    }
    /**
     * Handle and log errors with context
     */
    handleError(error, context) {
        const errorContext = context ? `[${context}] ` : '';
        if (this.isKazagumoError(error)) {
            console.error(`${errorContext}Kazagumo Error [${error.code}]: ${error.message}`);
            if (error.suggestions && error.suggestions.length > 0) {
                console.error('Suggestions:');
                error.suggestions.forEach((suggestion, index) => {
                    console.error(`  ${index + 1}. ${suggestion}`);
                });
            }
            if (error.recoverable) {
                console.error('This error is recoverable. Please try the suggested solutions.');
            }
            else {
                console.error('This error is not recoverable. Manual intervention required.');
            }
        }
        else {
            console.error(`${errorContext}Unexpected Error: ${error.message}`);
            console.error(error.stack);
        }
    }
    /**
     * Check if error is a Kazagumo error
     */
    isKazagumoError(error) {
        return error &&
            typeof error.code === 'string' &&
            typeof error.recoverable === 'boolean' &&
            error.name === 'KazagumoError';
    }
    /**
     * Get error severity
     */
    getErrorSeverity(code) {
        const errorInfo = this.errorDatabase.get(code);
        return errorInfo?.severity || 'medium';
    }
    /**
     * Get error suggestions
     */
    getErrorSuggestions(code) {
        const errorInfo = this.errorDatabase.get(code);
        return errorInfo?.suggestions || [];
    }
    /**
     * Check if error is recoverable
     */
    isRecoverable(code) {
        const errorInfo = this.errorDatabase.get(code);
        return errorInfo?.recoverable !== false;
    }
    /**
     * Create network error
     */
    createNetworkError(message, originalError) {
        const error = this.createError(ErrorCode.NETWORK_ERROR, `Network error: ${message}`, true, [
            'Check internet connection',
            'Verify firewall settings',
            'Try again later',
            'Contact network administrator'
        ]);
        if (originalError) {
            error.stack = originalError.stack || '';
        }
        return error;
    }
    /**
     * Create timeout error
     */
    createTimeoutError(operation, timeout) {
        return this.createError(ErrorCode.TIMEOUT_ERROR, `Operation '${operation}' timed out after ${timeout}ms`, true, [
            'Increase timeout value',
            'Check network connection',
            'Try again later',
            'Verify server responsiveness'
        ]);
    }
    /**
     * Create permission error
     */
    createPermissionError(permission, context) {
        const contextMsg = context ? ` in ${context}` : '';
        return this.createError(ErrorCode.PERMISSION_DENIED, `Missing permission: ${permission}${contextMsg}`, true, [
            `Grant ${permission} permission`,
            'Check role hierarchy',
            'Verify bot permissions',
            'Contact server administrator'
        ]);
    }
    /**
     * Wrap unknown errors
     */
    wrapUnknownError(error, context) {
        const contextMsg = context ? ` in ${context}` : '';
        return this.createError(ErrorCode.UNKNOWN_ERROR, `Unknown error${contextMsg}: ${error.message}`, true, [
            'Check error details',
            'Report to developers',
            'Try restarting the application',
            'Check system resources'
        ]);
    }
    /**
     * Format error for user display
     */
    formatErrorForUser(error) {
        let message = `**Error:** ${error.message}\n`;
        if (error.suggestions && error.suggestions.length > 0) {
            message += `**Suggestions:**\n`;
            error.suggestions.forEach((suggestion, index) => {
                message += `${index + 1}. ${suggestion}\n`;
            });
        }
        return message.trim();
    }
    /**
     * Get error statistics
     */
    getErrorStats() {
        // This would be implemented with actual error tracking
        return {
            totalErrors: 0,
            recoverableErrors: 0,
            criticalErrors: 0,
            errorsByCode: {}
        };
    }
}
exports.ErrorHandler = ErrorHandler;
//# sourceMappingURL=ErrorHandler.js.map