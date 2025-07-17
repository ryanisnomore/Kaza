# Kaza - Advanced Discord Music Bot Library

![Version](https://img.shields.io/badge/version-3.3.0-blue.svg)
![Node.js](https://img.shields.io/badge/node-%3E%3D16.5.0-brightgreen.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.4.5-blue.svg)
![License](https://img.shields.io/badge/license-ISC-green.svg)

Kaza is a professional Discord music bot library built on top of Shoukaku, designed for modern multi-platform music streaming. It provides a robust foundation for building Discord music bots with intelligent search capabilities, comprehensive error handling, and advanced queue management.

## 🚀 Features

- **Multi-Platform Support**: YouTube, YouTube Music, Spotify, Apple Music, Deezer, SoundCloud, JioSaavn, Qobuz, Tidal, Bandcamp
- **Dual Module Support**: Both CommonJS and ES Modules
- **TypeScript Ready**: Full TypeScript definitions included
- **Intelligent Search**: Smart platform detection and fallback engines
- **Plugin System**: Extensible architecture with built-in plugins
- **Error Handling**: Comprehensive error management with recovery suggestions
- **URL Parsing**: Automatic platform detection from URLs
- **Queue Management**: Advanced queue operations with shuffle, repeat, and track manipulation
- **LavaSrc Compatible**: Works with LavaSrc 4.7.2+ for enhanced platform support

## 📦 Installation

```bash
npm install kaza
```

## 🔧 Requirements

- Node.js 16.5.0 or higher
- A running Lavalink server
- Discord.js 14.0.0 or higher
- LavaSrc plugin (for multi-platform support)

## 🏗️ Quick Start

### CommonJS Usage

```javascript
const { Client, GatewayIntentBits } = require('discord.js');
const { Connectors } = require('shoukaku');
const { Kaza } = require('kaza');

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
  }
}, new Connectors.DiscordJS(client), nodes);

client.on('ready', () => {
  console.log(`${client.user.tag} is ready!`);
});

client.on('messageCreate', async (message) => {
  if (message.content.startsWith('!play ')) {
    const query = message.content.slice(6);
    
    // Create or get player
    const player = await kaza.createPlayer({
      guildId: message.guild.id,
      voiceId: message.member.voice.channel.id,
      textId: message.channel.id
    });
    
    // Search for tracks
    const result = await kaza.search(query, {
      requester: message.author
    });
    
    if (result.tracks.length) {
      player.queue.add(result.tracks[0]);
      if (!player.playing) await player.play();
      
      message.reply(`Added: ${result.tracks[0].info.title}`);
    }
  }
});

client.login('YOUR_BOT_TOKEN');
```

### ES Module Usage

```javascript
import { Client, GatewayIntentBits } from 'discord.js';
import { Connectors } from 'shoukaku';
import { Kaza } from 'kaza';

// Same implementation as above but with ES imports
```

### TypeScript Usage

```typescript
import { Client, GatewayIntentBits } from 'discord.js';
import { Connectors } from 'shoukaku';
import { Kaza, KazagumoPlayer, KazagumoTrack } from 'kaza';

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// Full type safety with TypeScript definitions
```

## 🎵 Platform Support

Kaza supports the following music platforms through LavaSrc:

| Platform | Search Engine | URL Support | Playlist Support |
|----------|---------------|-------------|------------------|
| YouTube | `ytsearch` | ✅ | ✅ |
| YouTube Music | `ytmsearch` | ✅ | ✅ |
| Spotify | `spsearch` | ✅ | ✅ |
| Apple Music | `amsearch` | ✅ | ✅ |
| Deezer | `dzsearch` | ✅ | ✅ |
| SoundCloud | `scsearch` | ✅ | ✅ |
| JioSaavn | `jiosaavn` | ✅ | ❌ |
| Qobuz | `qobuz` | ✅ | ❌ |
| Tidal | `tidal` | ✅ | ✅ |
| Bandcamp | `bandcamp` | ✅ | ❌ |

## 🔌 Advanced Configuration

```javascript
const kaza = new Kaza({
  defaultSearchEngine: 'ytsearch',
  send: (guildId, payload) => {
    const guild = client.guilds.cache.get(guildId);
    if (guild) guild.shard.send(payload);
  },
  plugins: {
    PlayerMoved: {
      enabled: true,
      config: {
        autoReconnect: true,
        reconnectDelay: 1000,
        maxReconnectAttempts: 3
      }
    }
  },
  searchOptions: {
    cacheResults: true,
    cacheTTL: 300000, // 5 minutes
    retryAttempts: 3,
    fallbackEngines: ['ytsearch', 'scsearch']
  }
}, new Connectors.DiscordJS(client), nodes);
```

## 🎯 API Reference

### Main Classes

- **Kaza/Kazagumo**: Main class for managing the music system
- **KazagumoPlayer**: Individual guild player with queue management
- **KazagumoQueue**: Advanced queue with shuffle, repeat, and manipulation
- **EnhancedSearchManager**: Intelligent search with platform detection
- **URLParser**: URL parsing and platform detection
- **ErrorHandler**: Comprehensive error management

### Search Methods

```javascript
// Basic search
const result = await kaza.search('Never Gonna Give You Up');

// Platform-specific search
const result = await kaza.search('spotify:track:4iV5W9uYEdYUVa79Axb7Rh');

// Search with options
const result = await kaza.search('Epic song', {
  source: 'spotify',
  limit: 5,
  requester: user
});

// Search with fallback
const result = await kaza.searchWithFallback('Rare song');
```

### Player Management

```javascript
// Create player
const player = await kaza.createPlayer({
  guildId: '123456789',
  voiceId: '987654321',
  textId: '456789123'
});

// Player controls
await player.play(track);
await player.pause(true);
await player.stop();
await player.setVolume(50);
await player.seek(30000); // 30 seconds

// Queue operations
player.queue.add(tracks);
player.queue.remove(0);
player.queue.shuffle();
player.queue.clear();
```

## 🔧 Error Handling

Kaza provides comprehensive error handling with recovery suggestions:

```javascript
try {
  const result = await kaza.search('invalid query');
} catch (error) {
  console.log('Error code:', error.code);
  console.log('Recoverable:', error.recoverable);
  console.log('Suggestions:', error.suggestions);
}
```

## 🧩 Plugin System

Kaza supports a powerful plugin system:

```javascript
// Built-in PlayerMoved plugin
kaza.on('playerMoved', (player, oldChannel, newChannel) => {
  console.log(`Player moved from ${oldChannel} to ${newChannel}`);
});

// Create custom plugins
class CustomPlugin {
  metadata = {
    name: 'CustomPlugin',
    version: '1.0.0',
    description: 'My custom plugin',
    author: 'Developer'
  };

  async initialize(kazagumo) {
    // Plugin initialization
  }

  async destroy() {
    // Plugin cleanup
  }
}
```

## 📝 Examples

Check the `example/` directory for comprehensive usage examples:

- `basic-usage.js`: Basic CommonJS implementation
- `advanced-usage.js`: Advanced features and configuration
- `typescript-usage.ts`: TypeScript implementation
- `test-compilation.js`: Library functionality test

## 🛠️ Development

```bash
# Install dependencies
npm install

# Build the library
npm run build

# Run tests
node example/test-compilation.js

# Test ES modules
node example/test-esm.mjs
```

## 📄 License

This project is licensed under the ISC License.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 🔗 Links

- [Shoukaku](https://github.com/Deivu/Shoukaku) - Lavalink client
- [LavaSrc](https://github.com/topi314/LavaSrc) - Multi-platform source plugin
- [Discord.js](https://discord.js.org/) - Discord API library
- [Lavalink](https://github.com/lavalink-devs/Lavalink) - Audio delivery server

---

Built with ❤️ for the Discord music bot community
