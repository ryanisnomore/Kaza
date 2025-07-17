# Kaza

![Downloads](https://img.shields.io/npm/dm/kaza)
![GitHub contributors](https://img.shields.io/github/contributors/ryanisnomore/Kaza)
![GitHub release](https://img.shields.io/github/v/release/ryanisnomore/Kaza)
![GitHub commit activity](https://img.shields.io/github/commit-activity/y/ryanisnomore/Kaza)
![License](https://img.shields.io/github/license/ryanisnomore/Kaza)
![TypeScript](https://img.shields.io/badge/language-Typescript-blue.svg)

---

## 🚀 Latest Release

**Version:** [3.3.0](https://github.com/ryanisnomore/Kaza/releases/tag/kaza)  
**Published:** 2025-07-17

**Release Notes:**
✨ Key Features  
🎯 Intelligent Platform Detection - Automatic URL parsing and platform recognition  
🔍 Advanced Search Logic - Smart fallback engines and caching system  
🛡️ Comprehensive Error Handling - Detailed error messages with recovery suggestions  
🔧 Enhanced Plugin System - Configurable plugins with dependency management  
📊 Health Monitoring - Real-time system health checks and statistics  
⚡ Performance Optimized - Built-in caching, retry logic, and connection pooling  
🌐 Multi-Platform Support - All platforms through LavaSrc configuration

---

## 📦 About

**Kaza** is a professional Discord music bot library built on top of [Shoukaku](https://github.com/Deivu/Shoukaku), fully rewritten for modern multi-platform music streaming. It features advanced queue management, intelligent multi-platform search, robust error handling, and full TypeScript support. Kaza is ideal for developers seeking a comprehensive, extensible, and high-performance solution for Discord music bots.

> **Project Description:**  
> _A Rewrite Kazagumo, A Shoukaku wrapper that has built-in queue system._

---

## ✨ Key Features

- **🎯 Intelligent Platform Detection:** Automatic URL parsing and platform recognition.
- **🔍 Advanced Search Logic:** Smart fallback engines and intelligent caching system.
- **🛡️ Comprehensive Error Handling:** Detailed error messages and recovery suggestions.
- **🔧 Enhanced Plugin System:** Configurable plugins with dependency management.
- **📊 Health Monitoring:** Real-time system health checks and statistics.
- **⚡ Performance Optimized:** Built-in caching, retry logic, and connection pooling.
- **🌐 Multi-Platform Support:** All platforms through LavaSrc configuration.

---

## 🚀 Supported Platforms

- **YouTube** & **YouTube Music**
- **Spotify** (with credentials)
- **Apple Music** (with credentials)
- **Deezer** (with credentials)
- **SoundCloud** (with credentials)
- **JioSaavn** (no credentials required)
- **Qobuz** (with credentials)
- **Tidal** (with credentials)
- **Bandcamp** (no credentials required)
- **HTTP Streams**

---

## 📦 Installation

```bash
npm install kaza
# or
npm install git+https://github.com/ryanisnomore/Kaza.git
```

---

## 🔧 Prerequisites

- **Lavalink Server** with **LavaSrc 4.7.2** plugin
- **Discord.js v14+**
- **Node.js 16.5.0+**

---

## 🚀 Quick Start

```typescript
import { Client, GatewayIntentBits } from 'discord.js';
import { Connectors } from 'shoukaku';
import { Kaza, PlayerMoved } from 'kaza';

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

const nodes = [{
    name: 'Main',
    url: 'localhost:2333',
    auth: 'youshallnotpass',
    secure: false
}];

const kaza = new Kaza({
    defaultSearchEngine: 'ytsearch',
    send: (guildId, payload) => {
        const guild = client.guilds.cache.get(guildId);
        if (guild) guild.shard.send(payload);
    },
    plugins: {
        'PlayerMoved': { enabled: true }
    }
}, new Connectors.DiscordJS(client), nodes);

client.on('messageCreate', async (message) => {
    if (message.content === '!play despacito') {
        const player = kaza.createPlayer({
            guildId: message.guild.id,
            voiceId: message.member.voice.channel.id,
            textId: message.channel.id
        });

        const result = await kaza.autoSearch('despacito', {
            requester: message.author,
            fallbackEngines: ['ytmsearch', 'spsearch']
        });

        if (result.tracks.length) {
            player.queue.add(result.tracks[0]);
            if (!player.playing) player.play();
        }
    }
});

client.login('your-bot-token');
```

---

## 🎯 Advanced Usage

### Smart URL Detection

```typescript
// Detect platform and optimal search method
const spotifyResult = await kaza.autoSearch('https://open.spotify.com/track/...');
const appleResult = await kaza.autoSearch('https://music.apple.com/...');
const youtubeResult = await kaza.autoSearch('https://youtube.com/watch?v=...');

// Get URL information
const urlInfo = kaza.parseURL('https://open.spotify.com/track/...');
console.log(urlInfo.platform); // 'spotify'
console.log(urlInfo.type); // 'track'
```

### Enhanced Search Options

```typescript
const result = await kaza.search('my favorite song', {
    requester: message.author,
    limit: 5,
    timeout: 15000,
    fallbackEngines: ['ytmsearch', 'spsearch', 'ytsearch'],
    retryAttempts: 3,
    cacheResults: true
});
```

### Platform-Specific Searches

```typescript
const spotifyTracks = await kaza.searchSpotify('artist - song');
const appleTracks = await kaza.searchAppleMusic('album name');
const youtubeTracks = await kaza.searchYouTube('music video');
```

### Error Handling

```typescript
try {
    const result = await kaza.search('invalid query');
} catch (error) {
    if (kaza.isKazaError(error)) {
        console.log('Error code:', error.code);
        console.log('Suggestions:', error.suggestions);
        console.log('Recoverable:', error.recoverable);
    }
}
```

### Health Monitoring

```typescript
const health = await kaza.healthCheck();
console.log('Status:', health.status); // 'healthy', 'degraded', or 'unhealthy'
console.log('Components:', health.components);

const stats = kaza.getStats();
console.log('Players:', stats.players);
console.log('Search cache hit rate:', stats.search.cacheHitRate);
console.log('Supported platforms:', stats.search.supportedPlatforms);
```

### Plugin Configuration

```typescript
const kaza = new Kaza({
    plugins: {
        'PlayerMoved': { 
            enabled: true, 
            priority: 100,
            config: { autoReconnect: true }
        },
        'AutoLeave': { 
            enabled: true,
            config: { emptyChannelTimeout: 300000 }
        }
    }
}, connector, nodes);
```

---

## 🔌 Built-in Plugins

- **PlayerMoved** — Handles voice channel changes
- **AutoLeave** — Leaves empty channels automatically
- **QueueSaver** — Saves queues on shutdown
- **VolumeNormalizer** — Normalizes audio levels
- **CrossFade** — Smooth track transitions

---

## ⚙️ Lavalink Configuration

Add this to your Lavalink `application.yml`:

```yaml
lavalink:
  plugins:
    - dependency: "com.github.topi314.lavasrc:lavasrc-plugin:4.7.2"
      repository: "https://jitpack.io"

plugins:
  lavasrc:
    providers:
      - "ytmsearch:%ISRC%"
      - "ytmsearch:%QUERY%"
      - "spsearch:%QUERY%"
      - "amsearch:%QUERY%"
      - "dzsearch:%QUERY%"
      - "scsearch:%QUERY%"
      - "jiosaavn:%QUERY%"
      - "qobuz:%QUERY%"
      - "tidal:%QUERY%"
      - "bandcamp:%QUERY%"
    
    spotify:
      clientId: "your_spotify_client_id"
      clientSecret: "your_spotify_client_secret"
    
    applemusic:
      countryCode: "US"
      mediaAPIToken: "your_apple_music_token"
```

---

## 📊 Performance Features

- **Intelligent Caching:** Automatic result caching with TTL
- **Connection Pooling:** Efficient node management
- **Retry Logic:** Exponential backoff for failed requests
- **Fallback Engines:** Automatic fallback to alternative sources
- **Health Monitoring:** Real-time system health tracking

---

## 🛠️ API Reference

### Core Classes

- **Kaza** — Main library class
- **KazagumoPlayer** — Individual guild music player
- **KazagumoQueue** — Advanced queue management
- **SearchManager** — Intelligent search handling

### Utilities

- **URLParser** — URL detection and platform identification
- **ErrorHandler** — Comprehensive error management
- **PluginConfig** — Plugin configuration and management

---

## 🤝 Contributing

Contributions are welcome! Please open an issue or submit a pull request.  
See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

---

## 📜 License

This project is licensed under the ISC License.

---

## 🔗 Links

- **Documentation:** [API Docs (Coming Soon)](https://discord.gg/W2GheK3F9m)
- **Examples:** [Usage Examples](./example)
- **Discord:** [Support Server](https://discord.gg/W2GheK3F9m)
- **Latest Release:** [v3.3.0](https://github.com/ryanisnomore/Kaza/releases/tag/kaza)

---

**Kaza** — Making Discord music bots smarter, one search at a time. 🎵
