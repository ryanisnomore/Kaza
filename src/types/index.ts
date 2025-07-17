/**
 * Type definitions for Kaza
 */

export * from './KazagumoTypes';

import { EventEmitter } from 'events';
import { Player, Node } from 'shoukaku';

// Core interfaces
export interface KazagumoOptions {
  defaultSearchEngine?: string;
  send: (guildId: string, payload: any) => void;
  plugins?: Record<string, PluginOptions>;
  searchOptions?: SearchOptions;
  nodeOptions?: NodeOptions;
}

export interface PluginOptions {
  enabled: boolean;
  priority?: number;
  config?: Record<string, any>;
}

export interface SearchOptions {
  cacheResults?: boolean;
  cacheTTL?: number;
  retryAttempts?: number;
  timeout?: number;
  fallbackEngines?: string[];
}

export interface NodeOptions {
  retryAttempts?: number;
  retryDelay?: number;
  secure?: boolean;
}

export interface KazagumoSearchOptions {
  requester?: any;
  limit?: number;
  source?: string;
  timeout?: number;
  fallbackEngines?: string[];
  retryAttempts?: number;
  cacheResults?: boolean;
}

export interface KazagumoSearchResult {
  loadType: 'track' | 'playlist' | 'search' | 'empty' | 'error';
  playlistInfo?: {
    name: string;
    selectedTrack?: number;
  };
  tracks: KazagumoTrack[];
  exception?: {
    message: string;
    severity: string;
  };
}

export interface KazagumoTrack {
  track: string;
  info: {
    identifier: string;
    title: string;
    author: string;
    length: number;
    artworkUrl?: string;
    uri?: string;
    isrc?: string;
    sourceName: string;
    isSeekable: boolean;
    isStream: boolean;
    position?: number;
  };
  pluginInfo?: Record<string, any>;
  userData?: any;
  requester?: any;
}

export interface PlayerOptions {
  guildId: string;
  voiceId: string;
  textId?: string;
  deaf?: boolean;
  mute?: boolean;
  volume?: number;
}

export interface URLInfo {
  platform: string;
  type: 'track' | 'playlist' | 'album' | 'artist' | 'unknown';
  id: string;
  url: string;
  isValid: boolean;
}

export interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy';
  components: {
    shoukaku: boolean;
    search: boolean;
    cache: boolean;
    plugins: boolean;
  };
  timestamp: number;
}

export interface KazagumoStats {
  players: number;
  playingPlayers: number;
  nodes: number;
  uptime: number;
  search: {
    totalSearches: number;
    cacheHits: number;
    cacheHitRate: number;
    supportedPlatforms: string[];
  };
}

export interface KazagumoError extends Error {
  code: string;
  recoverable: boolean;
  suggestions?: string[];
}

export type KazagumoEvents = {
  playerCreate: [player: KazagumoPlayer];
  playerDestroy: [player: KazagumoPlayer];
  playerUpdate: [player: KazagumoPlayer];
  playerEmpty: [player: KazagumoPlayer];
  playerException: [player: KazagumoPlayer, exception: any];
  trackStart: [player: KazagumoPlayer, track: KazagumoTrack];
  trackEnd: [player: KazagumoPlayer, track: KazagumoTrack];
  trackException: [player: KazagumoPlayer, track: KazagumoTrack, exception: any];
  trackStuck: [player: KazagumoPlayer, track: KazagumoTrack];
  queueEnd: [player: KazagumoPlayer];
  playerMoved: [player: KazagumoPlayer, oldChannel: string, newChannel: string];
  ready: [name: string];
  error: [name: string, error: Error];
  close: [name: string, code: number, reason: string];
  disconnect: [name: string, moved: boolean];
  reconnecting: [name: string];
};

// Re-export Shoukaku types for convenience
export { Player, Node } from 'shoukaku';

// Forward type declarations to avoid circular imports
export type KazagumoPlayer = import('../Managers/KazagumoPlayer').KazagumoPlayer;
export type KazagumoQueue = import('../Managers/KazagumoQueue').KazagumoQueue;

// Add missing exports
export type PluginMetadata = {
  name: string;
  version: string;
  description: string;
  author: string;
  priority?: number;
  enabled?: boolean;
  dependencies?: string[];
};

export interface PluginInterface {
  metadata: PluginMetadata;
  initialize(kazagumo: any): Promise<void>;
  destroy(): Promise<void>;
  [key: string]: any;
}
