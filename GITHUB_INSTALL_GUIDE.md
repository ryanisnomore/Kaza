# GitHub Installation Guide for Kaza

## Quick Installation

### Method 1: Direct npm install
```bash
npm install git+https://github.com/ryanisnomore/Kaza.git
```

### Method 2: Package.json dependency
```json
{
  "dependencies": {
    "kaza": "github:ryanisnomore/Kaza"
  }
}
```

### Method 3: Yarn installation
```bash
yarn add git+https://github.com/ryanisnomore/Kaza.git
```

## Usage in Your Discord Bot

### 1. Basic Setup
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

// Lavalink configuration
const nodes = [{
  name: 'Main',
  url: 'localhost:2333',
  auth: 'youshallnotpass',
  secure: false
}];

// Initialize Kaza
const kaza = new Kaza({
  defaultSearchEngine: 'ytsearch',
  send: (guildId, payload) => {
    const guild = client.guilds.cache.get(guildId);
    if (guild) guild.shard.send(payload);
  }
}, new Connectors.DiscordJS(client), nodes);
```

### 2. Basic Play Command
```javascript
client.on('messageCreate', async (message) => {
  if (message.content.startsWith('!play ')) {
    const query = message.content.slice(6);
    
    // Create player
    const player = await kaza.createPlayer({
      guildId: message.guild.id,
      voiceId: message.member.voice.channel.id,
      textId: message.channel.id
    });
    
    // Search and play
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
```

### 3. Advanced Features
```javascript
// Multi-platform search
const spotifyResult = await kaza.search('spotify:track:4iV5W9uYEdYUVa79Axb7Rh');
const youtubeResult = await kaza.search('Never Gonna Give You Up');
const appleResult = await kaza.search('https://music.apple.com/album/...', {
  source: 'applemusic'
});

// Queue management
player.queue.shuffle();
player.queue.repeat = 'queue';
player.queue.remove(0);

// Player controls
await player.pause(true);
await player.setVolume(50);
await player.seek(30000); // 30 seconds
```

## Required Dependencies

Make sure your bot has these dependencies:
```json
{
  "dependencies": {
    "discord.js": "^14.21.0",
    "shoukaku": "^4.1.1",
    "kaza": "github:ryanisnomore/Kaza"
  }
}
```

## Environment Setup

1. **Set up Lavalink server** with LavaSrc plugin
2. **Configure application.yml** for multi-platform support
3. **Get Discord bot token**
4. **Configure voice permissions**

## Platform Support

Kaza supports these music platforms:
- YouTube (`ytsearch`)
- YouTube Music (`ytmsearch`)
- Spotify (`spsearch`)
- Apple Music (`amsearch`)
- Deezer (`dzsearch`)
- SoundCloud (`scsearch`)
- And more...

## Troubleshooting

### Installation Issues
- Ensure Node.js 16.5.0 or higher
- Check GitHub repository access
- Verify git is installed

### Runtime Issues
- Confirm Lavalink server is running
- Check Discord bot permissions
- Verify voice channel access

## Complete Example Bot

See `./example/github-install-bot.js` for a complete working example.