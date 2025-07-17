# Enhanced Kazagumo

A powerful Discord music bot library built on top of Shoukaku with comprehensive multi-platform support through **LavaSrc 4.7.2** integration. This library eliminates the need for external API calls by leveraging your Lavalink server's LavaSrc configuration for all platform support.

## 🌟 Features

### Multi-Platform Support via LavaSrc 4.7.2
- **YouTube & YouTube Music** - Default search and streaming
- **Spotify** - Search and playback through LavaSrc
- **Apple Music** - Full integration via LavaSrc
- **Deezer** - High-quality audio streaming
- **SoundCloud** - Native support for tracks and playlists
- **JioSaavn** - Indian music streaming platform
- **Qobuz** - Hi-Res audio streaming
- **Tidal** - Lossless audio streaming
- **Bandcamp** - Independent artist platform
- **HTTP Streams** - Direct audio file streaming
- **Flowery TTS** - Text-to-speech support

### Simplified Architecture
- **No External APIs** - All platform integration through LavaSrc 4.7.2
- **Automatic Platform Detection** - Smart routing based on URLs and search queries
- **Clean TypeScript Implementation** - Simplified codebase with full type support
- **Plugin System** - Extensible architecture with minimal plugins
- **Queue Management** - Advanced queue operations with shuffle/repeat modes

### Performance & Reliability
- **Direct Lavalink Integration** - Uses Shoukaku's built-in search capabilities
- **Load Balancing** - Automatic node selection for optimal performance
- **Voice State Management** - Auto-disconnect and channel move handling
- **Error Handling** - Robust error handling with fallbacks
- **Memory Efficient** - No caching layers, relies on LavaSrc's built-in optimizations

## 📦 Installation

```bash
npm install enhanced-kazagumo shoukaku
```

## 🛠️ Setup Requirements

### 1. Lavalink Server with LavaSrc 4.7.2

First, set up your Lavalink server with LavaSrc 4.7.2. Copy the provided `lavalink-application.yml` configuration and add your platform API credentials:

```yaml
# Essential LavaSrc configuration
lavalink:
  plugins:
    - dependency: "com.github.topi314.lavasrc:lavasrc-plugin:4.7.2"
      repository: "https://jitpack.io"

plugins:
  lavasrc:
    sources:
      spotify:
        clientId: "YOUR_SPOTIFY_CLIENT_ID"
        clientSecret: "YOUR_SPOTIFY_CLIENT_SECRET"
      applemusic:
        mediaAPIToken: "YOUR_APPLE_MUSIC_TOKEN"
      # Add other platform credentials as needed
```

### 2. Platform API Credentials (Optional)

While YouTube works without credentials, other platforms require API keys:
- **Spotify**: Client ID & Secret from [Spotify Developer Dashboard](https://developer.spotify.com/)
- **Apple Music**: Media API Token from [Apple Developer Portal](https://developer.apple.com/)
- **Deezer**: ARL and Master Key (advanced users)
- **SoundCloud**: Client ID from SoundCloud API
- **Other platforms**: See `lavalink-application.yml` for details

## ⚡ Quick Start

```javascript
const { Client, GatewayIntentBits } = require('discord.js');
const { Connectors } = require('shoukaku');
const { Kazagumo, PlayerMoved } = require('enhanced-kazagumo');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

const kazagumo = new Kazagumo({
    defaultSearchEngine: 'ytsearch', // LavaSrc search engine
    searchLimit: 10,
    send: (guildId, payload) => {
        const guild = client.guilds.cache.get(guildId);
        if (guild) guild.shard.send(payload);
    },
    plugins: [PlayerMoved] // Optional voice state handling
}, new Connectors.DiscordJS(client), [{
    name: 'Main',
    url: 'localhost:2333',
    auth: 'youshallnotpass',
    secure: false
}]);

// Universal search - automatically detects platform from URLs
const result = await kazagumo.search('https://open.spotify.com/track/...');
const searchResult = await kazagumo.search('Never Gonna Give You Up');

// Platform-specific searches (requires LavaSrc configuration)
const spotifyResult = await kazagumo.searchSpotify('Bohemian Rhapsody');
const appleMusicResult = await kazagumo.searchAppleMusic('Imagine Dragons');
const tidalResult = await kazagumo.searchTidal('Lossless Audio Track');
