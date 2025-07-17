# Kaza 

> Advanced Lavalink wrapper with intelligent multi-platform search and comprehensive error handling

Kaza is a powerful Discord music bot library built on top of Shoukaku, designed for modern multi-platform music streaming with **LavaSrc 4.7.2** integration. It provides intelligent URL detection, advanced search capabilities, robust error handling, and a sophisticated plugin system.

## ✨ Key Features

- **🎯 Intelligent Platform Detection** - Automatic URL parsing and platform recognition
- **🔍 Advanced Search Logic** - Smart fallback engines and caching system
- **🛡️ Comprehensive Error Handling** - Detailed error messages with recovery suggestions
- **🔧 Enhanced Plugin System** - Configurable plugins with dependency management
- **📊 Health Monitoring** - Real-time system health checks and statistics
- **⚡ Performance Optimized** - Built-in caching, retry logic, and connection pooling
- **🌐 Multi-Platform Support** - All platforms through LavaSrc configuration

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

## 📦 Installation

```bash
npm install kaza
# or
npm install git+https://github.com/ryanisnomore/Kaza.git
```

## 🔧 Prerequisites

1. **Lavalink Server** with **LavaSrc 4.7.2** plugin
2. **Discord.js v14+**
3. **Node.js 16.5.0+**

## 🚀 Quick Start

```javascript
const { Client, GatewayIntentBits } = require('discord.js');
const { Connectors } = require('shoukaku');
const { Kaza, PlayerMoved } = require('kaza');

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

// Enhanced search with auto-detection
client.on('messageCreate', async (message) => {
    if (message.content === '!play despacito') {
        const player = kaza.createPlayer({
            guildId: message.guild.id,
            voiceId: message.member.voice.channel.id,
            textId: message.channel.id
        });

        // Auto-detects best platform and search method
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

## 🎯 Advanced Usage

### Smart URL Detection

```javascript
// Automatically detects platform and optimal search method
const spotifyResult = await kaza.autoSearch('https://open.spotify.com/track/...');
const appleResult = await kaza.autoSearch('https://music.apple.com/...');
const youtubeResult = await kaza.autoSearch('https://youtube.com/watch?v=...');

// Get URL information
const urlInfo = kaza.parseURL('https://open.spotify.com/track/...');
console.log(urlInfo.platform); // 'spotify'
console.log(urlInfo.type); // 'track'
```

### Enhanced Search Options

```javascript
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

```javascript
// Search specific platforms with fallbacks
const spotifyTracks = await kaza.searchSpotify('artist - song');
const appleTracks = await kaza.searchAppleMusic('album name');
const youtubeTracks = await kaza.searchYouTube('music video');
```

### Error Handling

```javascript
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

```javascript
// Check system health
const health = await kaza.healthCheck();
console.log('Status:', health.status); // 'healthy', 'degraded', or 'unhealthy'
console.log('Components:', health.components);

// Get detailed statistics
const stats = kaza.getStats();
console.log('Players:', stats.players);
console.log('Search cache hit rate:', stats.search.cacheHitRate);
console.log('Supported platforms:', stats.search.supportedPlatforms);
```

### Plugin Configuration

```javascript
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

## 🔌 Built-in Plugins

- **PlayerMoved** - Handles voice channel changes
- **AutoLeave** - Leaves empty channels automatically
- **QueueSaver** - Saves queues on shutdown
- **VolumeNormalizer** - Normalizes audio levels
- **CrossFade** - Smooth track transitions

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
    
    # Add your API credentials here
    spotify:
      clientId: "your_spotify_client_id"
      clientSecret: "your_spotify_client_secret"
    
    applemusic:
      countryCode: "US"
      mediaAPIToken: "your_apple_music_token"
```

## 📊 Performance Features

- **Intelligent Caching** - Automatic result caching with TTL
- **Connection Pooling** - Efficient node management
- **Retry Logic** - Exponential backoff for failed requests
- **Fallback Engines** - Automatic fallback to alternative sources
- **Health Monitoring** - Real-time system health tracking

## 🛠️ API Reference

### Core Classes

- **Kaza** - Main library class
- **KazagumoPlayer** - Individual guild music player
- **KazagumoQueue** - Advanced queue management
- **SearchManager** - Intelligent search handling

### Utilities

- **URLParser** - URL detection and platform identification
- **ErrorHandler** - Comprehensive error management
- **PluginConfig** - Plugin configuration and management

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📜 License

This project is licensed under the ISC License.

## 🔗 Links

- **Documentation**: [Full API Documentation Will Ready Soon](https://discord.gg/W2GheK3F9m)
- **Examples**: [Usage Examples](./example)
- **Discord**: [Support Server](https://discord.gg/W2GheK3F9m)

---

**Kaza** - Making Discord music bots smarter, one search at a time. 🎵
