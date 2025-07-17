/**
 * Comprehensive error handling system for Kaza
 */

export enum ErrorCode {
    // Connection Errors
    CONNECTION_FAILED = 'CONNECTION_FAILED',
    NODE_UNAVAILABLE = 'NODE_UNAVAILABLE',
    LAVALINK_ERROR = 'LAVALINK_ERROR',
    
    // Player Errors
    PLAYER_NOT_FOUND = 'PLAYER_NOT_FOUND',
    VOICE_CONNECTION_FAILED = 'VOICE_CONNECTION_FAILED',
    TRACK_FAILED = 'TRACK_FAILED',
    
    // Search Errors
    NO_RESULTS = 'NO_RESULTS',
    SEARCH_FAILED = 'SEARCH_FAILED',
    INVALID_URL = 'INVALID_URL',
    PLATFORM_UNAVAILABLE = 'PLATFORM_UNAVAILABLE',
    
    // Configuration Errors
    MISSING_CREDENTIALS = 'MISSING_CREDENTIALS',
    INVALID_CONFIG = 'INVALID_CONFIG',
    PLUGIN_LOAD_FAILED = 'PLUGIN_LOAD_FAILED',
    
    // Queue Errors
    QUEUE_EMPTY = 'QUEUE_EMPTY',
    TRACK_NOT_FOUND = 'TRACK_NOT_FOUND',
    INVALID_INDEX = 'INVALID_INDEX',
    
    // General Errors
    UNKNOWN_ERROR = 'UNKNOWN_ERROR',
    TIMEOUT = 'TIMEOUT',
    RATE_LIMITED = 'RATE_LIMITED'
}

export interface KazaError {
    code: ErrorCode;
    message: string;
    details?: any;
    timestamp: Date;
    recoverable: boolean;
    suggestions?: string[];
}

export class ErrorHandler {
    private static readonly errorMessages: Record<ErrorCode, string> = {
        [ErrorCode.CONNECTION_FAILED]: 'Failed to connect to Lavalink server',
        [ErrorCode.NODE_UNAVAILABLE]: 'No available Lavalink nodes',
        [ErrorCode.LAVALINK_ERROR]: 'Lavalink server encountered an error',
        [ErrorCode.PLAYER_NOT_FOUND]: 'Music player not found for this server',
        [ErrorCode.VOICE_CONNECTION_FAILED]: 'Failed to connect to voice channel',
        [ErrorCode.TRACK_FAILED]: 'Track playback failed',
        [ErrorCode.NO_RESULTS]: 'No search results found',
        [ErrorCode.SEARCH_FAILED]: 'Search request failed',
        [ErrorCode.INVALID_URL]: 'Invalid or unsupported URL format',
        [ErrorCode.PLATFORM_UNAVAILABLE]: 'Platform not available or configured',
        [ErrorCode.MISSING_CREDENTIALS]: 'Missing required API credentials',
        [ErrorCode.INVALID_CONFIG]: 'Invalid configuration provided',
        [ErrorCode.PLUGIN_LOAD_FAILED]: 'Failed to load plugin',
        [ErrorCode.QUEUE_EMPTY]: 'Queue is empty',
        [ErrorCode.TRACK_NOT_FOUND]: 'Track not found in queue',
        [ErrorCode.INVALID_INDEX]: 'Invalid queue index',
        [ErrorCode.UNKNOWN_ERROR]: 'An unknown error occurred',
        [ErrorCode.TIMEOUT]: 'Operation timed out',
        [ErrorCode.RATE_LIMITED]: 'Rate limited by service'
    };

    private static readonly recoverableCodes: Set<ErrorCode> = new Set([
        ErrorCode.NO_RESULTS,
        ErrorCode.SEARCH_FAILED,
        ErrorCode.TRACK_FAILED,
        ErrorCode.TIMEOUT,
        ErrorCode.RATE_LIMITED,
        ErrorCode.QUEUE_EMPTY,
        ErrorCode.TRACK_NOT_FOUND,
        ErrorCode.INVALID_INDEX
    ]);

    private static readonly errorSuggestions: Partial<Record<ErrorCode, string[]>> = {
        [ErrorCode.CONNECTION_FAILED]: [
            'Check if Lavalink server is running',
            'Verify server address and port',
            'Check firewall settings'
        ],
        [ErrorCode.NODE_UNAVAILABLE]: [
            'Add more Lavalink nodes',
            'Check node health status',
            'Verify node configuration'
        ],
        [ErrorCode.PLATFORM_UNAVAILABLE]: [
            'Configure LavaSrc plugin in Lavalink',
            'Add required API credentials',
            'Check platform-specific settings'
        ],
        [ErrorCode.MISSING_CREDENTIALS]: [
            'Add API keys to Lavalink configuration',
            'Verify credential validity',
            'Check credential permissions'
        ],
        [ErrorCode.INVALID_URL]: [
            'Check URL format',
            'Ensure platform is supported',
            'Try a different URL from the platform'
        ],
        [ErrorCode.VOICE_CONNECTION_FAILED]: [
            'Check bot permissions in voice channel',
            'Verify user is in a voice channel',
            'Try rejoining the voice channel'
        ],
        [ErrorCode.NO_RESULTS]: [
            'Try a different search term',
            'Check spelling and formatting',
            'Use platform-specific search'
        ]
    };

    /**
     * Create a standardized error object
     */
    public static createError(
        code: ErrorCode,
        details?: any,
        customMessage?: string
    ): KazaError {
        return {
            code,
            message: customMessage || this.errorMessages[code],
            details,
            timestamp: new Date(),
            recoverable: this.recoverableCodes.has(code),
            suggestions: this.errorSuggestions[code] || []
        };
    }

    /**
     * Handle and format errors for user display
     */
    public static formatError(error: KazaError | Error | any): string {
        if (error instanceof Error) {
            return `Error: ${error.message}`;
        }

        if (this.isKazaError(error)) {
            let message = `[${error.code}] ${error.message}`;
            
            if (error.suggestions && error.suggestions.length > 0) {
                message += '\n\nSuggestions:\n• ' + error.suggestions.join('\n• ');
            }

            return message;
        }

        return `Unknown error: ${String(error)}`;
    }

    /**
     * Check if error is a KazaError
     */
    public static isKazaError(error: any): error is KazaError {
        return error && 
               typeof error.code === 'string' && 
               typeof error.message === 'string' && 
               error.timestamp instanceof Date;
    }

    /**
     * Log error with appropriate level
     */
    public static logError(error: KazaError | Error | any, context?: string): void {
        const prefix = context ? `[${context}]` : '[Kaza]';
        
        if (this.isKazaError(error)) {
            const level = error.recoverable ? 'warn' : 'error';
            console[level](`${prefix} ${error.code}: ${error.message}`, error.details);
        } else if (error instanceof Error) {
            console.error(`${prefix} ${error.name}: ${error.message}`, error.stack);
        } else {
            console.error(`${prefix} Unknown error:`, error);
        }
    }

    /**
     * Wrap async operations with error handling
     */
    public static async handleAsync<T>(
        operation: () => Promise<T>,
        fallbackCode: ErrorCode,
        context?: string
    ): Promise<T> {
        try {
            return await operation();
        } catch (error) {
            const kazaError = error instanceof Error 
                ? this.createError(fallbackCode, { originalError: error.message })
                : this.createError(fallbackCode, { error });
            
            this.logError(kazaError, context);
            throw kazaError;
        }
    }

    /**
     * Create timeout wrapper for operations
     */
    public static withTimeout<T>(
        promise: Promise<T>,
        timeoutMs: number,
        timeoutCode: ErrorCode = ErrorCode.TIMEOUT
    ): Promise<T> {
        return Promise.race([
            promise,
            new Promise<never>((_, reject) => {
                setTimeout(() => {
                    reject(this.createError(timeoutCode, { timeout: timeoutMs }));
                }, timeoutMs);
            })
        ]);
    }

    /**
     * Retry logic with exponential backoff
     */
    public static async retry<T>(
        operation: () => Promise<T>,
        maxRetries: number = 3,
        baseDelay: number = 1000,
        retryableErrors: ErrorCode[] = [ErrorCode.TIMEOUT, ErrorCode.CONNECTION_FAILED]
    ): Promise<T> {
        let lastError: any;

        for (let attempt = 0; attempt <= maxRetries; attempt++) {
            try {
                return await operation();
            } catch (error) {
                lastError = error;

                if (attempt === maxRetries) break;

                const isRetryable = this.isKazaError(error) && 
                                  retryableErrors.includes(error.code);
                
                if (!isRetryable) break;

                const delay = baseDelay * Math.pow(2, attempt);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }

        throw lastError;
    }
}