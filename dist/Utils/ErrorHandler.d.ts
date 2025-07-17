/**
 * ErrorHandler - Comprehensive error handling with recovery suggestions
 */
import { KazagumoError } from '../types';
export declare enum ErrorCode {
    SEARCH_FAILED = "SEARCH_FAILED",
    SEARCH_NO_RESULTS = "SEARCH_NO_RESULTS",
    SEARCH_TIMEOUT = "SEARCH_TIMEOUT",
    INVALID_QUERY = "INVALID_QUERY",
    INVALID_URL = "INVALID_URL",
    URL_NOT_ACCESSIBLE = "URL_NOT_ACCESSIBLE",
    PLATFORM_NOT_SUPPORTED = "PLATFORM_NOT_SUPPORTED",
    PLATFORM_UNAVAILABLE = "PLATFORM_UNAVAILABLE",
    PLATFORM_RATE_LIMITED = "PLATFORM_RATE_LIMITED",
    PLAYER_NOT_FOUND = "PLAYER_NOT_FOUND",
    PLAYER_NOT_CONNECTED = "PLAYER_NOT_CONNECTED",
    PLAYER_ALREADY_EXISTS = "PLAYER_ALREADY_EXISTS",
    VOICE_CHANNEL_NOT_FOUND = "VOICE_CHANNEL_NOT_FOUND",
    VOICE_PERMISSIONS_MISSING = "VOICE_PERMISSIONS_MISSING",
    QUEUE_EMPTY = "QUEUE_EMPTY",
    QUEUE_FULL = "QUEUE_FULL",
    TRACK_NOT_FOUND = "TRACK_NOT_FOUND",
    INVALID_TRACK_INDEX = "INVALID_TRACK_INDEX",
    NODE_NOT_AVAILABLE = "NODE_NOT_AVAILABLE",
    NODE_CONNECTION_FAILED = "NODE_CONNECTION_FAILED",
    NODE_DISCONNECTED = "NODE_DISCONNECTED",
    PLUGIN_NOT_FOUND = "PLUGIN_NOT_FOUND",
    PLUGIN_INITIALIZATION_ERROR = "PLUGIN_INITIALIZATION_ERROR",
    PLUGIN_EXECUTION_ERROR = "PLUGIN_EXECUTION_ERROR",
    INVALID_CONFIGURATION = "INVALID_CONFIGURATION",
    MISSING_CREDENTIALS = "MISSING_CREDENTIALS",
    UNKNOWN_ERROR = "UNKNOWN_ERROR",
    NETWORK_ERROR = "NETWORK_ERROR",
    TIMEOUT_ERROR = "TIMEOUT_ERROR",
    PERMISSION_DENIED = "PERMISSION_DENIED"
}
export declare class ErrorHandler {
    private readonly errorDatabase;
    /**
     * Create a detailed Kazagumo error
     */
    createError(code: ErrorCode, message: string, recoverable?: boolean, suggestions?: string[]): KazagumoError;
    /**
     * Handle and log errors with context
     */
    handleError(error: Error, context?: string): void;
    /**
     * Check if error is a Kazagumo error
     */
    isKazagumoError(error: any): error is KazagumoError;
    /**
     * Get error severity
     */
    getErrorSeverity(code: ErrorCode): 'low' | 'medium' | 'high' | 'critical';
    /**
     * Get error suggestions
     */
    getErrorSuggestions(code: ErrorCode): string[];
    /**
     * Check if error is recoverable
     */
    isRecoverable(code: ErrorCode): boolean;
    /**
     * Create network error
     */
    createNetworkError(message: string, originalError?: Error): KazagumoError;
    /**
     * Create timeout error
     */
    createTimeoutError(operation: string, timeout: number): KazagumoError;
    /**
     * Create permission error
     */
    createPermissionError(permission: string, context?: string): KazagumoError;
    /**
     * Wrap unknown errors
     */
    wrapUnknownError(error: Error, context?: string): KazagumoError;
    /**
     * Format error for user display
     */
    formatErrorForUser(error: KazagumoError): string;
    /**
     * Get error statistics
     */
    getErrorStats(): {
        totalErrors: number;
        recoverableErrors: number;
        criticalErrors: number;
        errorsByCode: Record<string, number>;
    };
}
//# sourceMappingURL=ErrorHandler.d.ts.map