/**
 * TypeScript usage example for Kaza (ES Module)
 */

import { Client, GatewayIntentBits } from 'discord.js';
import { Connectors } from 'shoukaku';
import { Kaza, KazagumoPlayer, KazagumoTrack } from '../dist/index.js';

// Discord client setup with proper typing
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// Lavalink nodes configuration
const nodes = [{
  name: 'Main',
  url: 'localhost:2333',
  auth: 'youshallnotpass',
  secure: false
}];

// Initialize Kaza with TypeScript support
const kaza = new Kaza({
  defaultSearchEngine: 'ytsearch',
  send: (guildId: string, payload: any) => {
    const guild = client.guilds.cache.get(guildId);
    if (guild) guild.shard.send(payload);
  },
  plugins: {
    'PlayerMoved': { 
      enabled: true,
      config: {
        autoReconnect: true,
        reconnectDelay: 2000,
        maxReconnectAttempts: 5
      }
    }
  },
  searchOptions: {
    cacheResults: true,
    cacheTTL: 300000,
    retryAttempts: 3,
    timeout: 15000
  }
}, new Connectors.DiscordJS(client), nodes);

// Type-safe event listeners
kaza.on('ready', (name: string) => {
  console.log(`✅ Lavalink node ${name} is ready!`);
});

kaza.on('error', (name: string, error: Error) => {
  console.error(`❌ Lavalink node ${name} error:`, error);
});

kaza.on('playerCreate', (player: KazagumoPlayer) => {
  console.log(`🎵 Player created for guild ${player.guildId}`);
});

kaza.on('trackStart', (player: KazagumoPlayer, track: KazagumoTrack) => {
  console.log(`▶️ Now playing: ${track.info.title} by ${track.info.author}`);
});

kaza.on('trackEnd', (player: KazagumoPlayer, track: KazagumoTrack) => {
  console.log(`⏹️ Finished playing: ${track.info.title}`);
});

kaza.on('queueEnd', (player: KazagumoPlayer) => {
  console.log(`📭 Queue ended for guild ${player.guildId}`);
});

kaza.on('playerMoved', (player: KazagumoPlayer, oldChannel: string, newChannel: string) => {
  console.log(`🔄 Player moved from ${oldChannel} to ${newChannel}`);
});

// Type-safe message handling
client.on('messageCreate', async (message) => {
  if (message.author.bot || !message.guild) return;
  
  const prefix = '!';
  if (!message.content.startsWith(prefix)) return;
  
  const args = message.content.slice(prefix.length).trim().split(/\s+/);
  const command = args.shift()?.toLowerCase();
  
  try {
    switch (command) {
      case 'play': {
        if (!args[0]) {
          return message.reply('❌ Please provide a song to play!');
        }
        
        const voiceChannel = message.member?.voice.channel;
        if (!voiceChannel) {
          return message.reply('❌ You need to be in a voice channel!');
        }
        
        // Create or get player with type safety
        const player = kaza.createPlayer({
          guildId: message.guild.id,
          voiceId: voiceChannel.id,
          textId: message.channel.id,
          deaf: false,
          mute: false,
          volume: 80
        });
        
        // Advanced search with platform detection
        const query = args.join(' ');
        const result = await kaza.autoSearch(query, {
          requester: message.author,
          fallbackEngines: ['ytmsearch', 'spsearch', 'scsearch'],
          limit: 5,
          cacheResults: true
        });
        
        if (result.tracks.length === 0) {
          return message.reply('❌ No tracks found! Try different keywords.');
        }
        
        const track = result.tracks[0];
        player.queue.add(track);
        
        if (!player.playing) {
          await player.play();
        }
        
        const duration = Math.floor(track.info.length / 1000);
        const minutes = Math.floor(duration / 60);
        const seconds = duration % 60;
        
        message.reply(
          `✅ Added to queue: **${track.info.title}** by **${track.info.author}**\n` +
          `⏱️ Duration: ${minutes}:${seconds.toString().padStart(2, '0')}\n` +
          `🔗 Source: ${track.info.sourceName}\n` +
          `📋 Queue position: ${player.queue.size}`
        );
        break;
      }
      
      case 'search': {
        if (!args[0]) {
          return message.reply('❌ Please provide a search query!');
        }
        
        const query = args.join(' ');
        const result = await kaza.search(query, {
          requester: message.author,
          limit: 10
        });
        
        if (result.tracks.length === 0) {
          return message.reply('❌ No tracks found!');
        }
        
        const trackList = result.tracks
          .slice(0, 5)
          .map((track, index) => 
            `${index + 1}. **${track.info.title}** by **${track.info.author}** ` +
            `[${track.info.sourceName}]`
          )
          .join('\n');
        
        message.reply(`🔍 **Search Results:**\n${trackList}`);
        break;
      }
      
      case 'spotify': {
        if (!args[0]) {
          return message.reply('❌ Please provide a Spotify URL or search query!');
        }
        
        const query = args.join(' ');
        const result = await kaza.searchSpotify(query, {
          requester: message.author,
          limit: 5
        });
        
        if (result.tracks.length === 0) {
          return message.reply('❌ No Spotify tracks found!');
        }
        
        const player = kaza.getPlayer(message.guild.id);
        if (!player) {
          return message.reply('❌ No active player found! Use `!play` first.');
        }
        
        player.queue.add(result.tracks[0]);
        message.reply(`🎵 Added Spotify track: **${result.tracks[0].info.title}**`);
        break;
      }
      
      case 'queue': {
        const player = kaza.getPlayer(message.guild.id);
        if (!player) {
          return message.reply('❌ No player found!');
        }
        
        const queueInfo = player.getQueueInfo();
        
        if (queueInfo.queue.length === 0) {
          return message.reply('📭 Queue is empty!');
        }
        
        const current = queueInfo.current;
        const queueList = queueInfo.queue
          .slice(0, 10)
          .map((track, index) => 
            `${index + 1}. **${track.info.title}** by **${track.info.author}**`
          )
          .join('\n');
        
        const totalDuration = Math.floor(queueInfo.totalLength / 1000);
        const hours = Math.floor(totalDuration / 3600);
        const minutes = Math.floor((totalDuration % 3600) / 60);
        
        message.reply(
          `🎵 **Now Playing:** ${current?.info.title || 'None'}\n` +
          `📋 **Queue (${queueInfo.queue.length} tracks):**\n${queueList}\n` +
          `⏱️ **Total Duration:** ${hours}h ${minutes}m\n` +
          `🔄 **Repeat:** ${queueInfo.repeat === 0 ? 'Off' : queueInfo.repeat === 1 ? 'Track' : 'Queue'}\n` +
          `🔀 **Shuffle:** ${queueInfo.shuffle ? 'On' : 'Off'}`
        );
        break;
      }
      
      case 'shuffle': {
        const player = kaza.getPlayer(message.guild.id);
        if (!player) {
          return message.reply('❌ No player found!');
        }
        
        player.queue.setShuffle(!player.queue.shuffle);
        message.reply(`🔀 Shuffle ${player.queue.shuffle ? 'enabled' : 'disabled'}!`);
        break;
      }
      
      case 'repeat': {
        const player = kaza.getPlayer(message.guild.id);
        if (!player) {
          return message.reply('❌ No player found!');
        }
        
        const mode = args[0]?.toLowerCase();
        let repeatMode = 0;
        
        switch (mode) {
          case 'track':
          case '1':
            repeatMode = 1;
            break;
          case 'queue':
          case '2':
            repeatMode = 2;
            break;
          default:
            repeatMode = 0;
        }
        
        player.queue.setRepeat(repeatMode);
        const modeText = repeatMode === 0 ? 'Off' : repeatMode === 1 ? 'Track' : 'Queue';
        message.reply(`🔄 Repeat mode set to: ${modeText}`);
        break;
      }
      
      case 'volume': {
        const player = kaza.getPlayer(message.guild.id);
        if (!player) {
          return message.reply('❌ No player found!');
        }
        
        const volume = parseInt(args[0]);
        if (isNaN(volume) || volume < 0 || volume > 100) {
          return message.reply('❌ Volume must be between 0 and 100!');
        }
        
        await player.setVolume(volume);
        message.reply(`🔊 Volume set to ${volume}%`);
        break;
      }
      
      case 'seek': {
        const player = kaza.getPlayer(message.guild.id);
        if (!player) {
          return message.reply('❌ No player found!');
        }
        
        const timeStr = args[0];
        if (!timeStr) {
          return message.reply('❌ Please provide a time (e.g., 1:30)!');
        }
        
        const [minutes, seconds] = timeStr.split(':').map(Number);
        if (isNaN(minutes) || isNaN(seconds)) {
          return message.reply('❌ Invalid time format! Use MM:SS');
        }
        
        const position = (minutes * 60 + seconds) * 1000;
        await player.seek(position);
        message.reply(`⏩ Seeked to ${timeStr}`);
        break;
      }
      
      case 'stats': {
        const stats = kaza.getStats();
        const health = await kaza.healthCheck();
        
        message.reply(
          `📊 **Kaza Statistics:**\n` +
          `👥 Players: ${stats.players} (${stats.playingPlayers} playing)\n` +
          `🌐 Nodes: ${stats.nodes}\n` +
          `⏱️ Uptime: ${Math.floor(stats.uptime / 1000)}s\n` +
          `🔍 Searches: ${stats.search.totalSearches}\n` +
          `💾 Cache Hit Rate: ${stats.search.cacheHitRate.toFixed(1)}%\n` +
          `🏥 Health: ${health.status}\n` +
          `🎵 Platforms: ${stats.search.supportedPlatforms.join(', ')}`
        );
        break;
      }
      
      case 'health': {
        const health = await kaza.healthCheck();
        const components = Object.entries(health.components)
          .map(([name, status]) => `${name}: ${status ? '✅' : '❌'}`)
          .join('\n');
        
        message.reply(
          `🏥 **System Health:** ${health.status}\n` +
          `📊 **Components:**\n${components}\n` +
          `⏰ **Last Check:** ${new Date(health.timestamp).toLocaleString()}`
        );
        break;
      }
      
      case 'filters': {
        const player = kaza.getPlayer(message.guild.id);
        if (!player) {
          return message.reply('❌ No player found!');
        }
        
        const filterType = args[0]?.toLowerCase();
        
        switch (filterType) {
          case 'bassboost':
            await player.setFilters({
              equalizer: Array.from({ length: 15 }, (_, i) => ({
                band: i,
                gain: i < 3 ? 0.3 : 0
              }))
            });
            message.reply('🔊 Bass boost enabled!');
            break;
            
          case 'clear':
            await player.clearFilters();
            message.reply('🧹 All filters cleared!');
            break;
            
          default:
            message.reply('❌ Available filters: bassboost, clear');
        }
        break;
      }
      
      case 'disconnect': {
        const player = kaza.getPlayer(message.guild.id);
        if (!player) {
          return message.reply('❌ No player found!');
        }
        
        kaza.destroyPlayer(message.guild.id);
        message.reply('👋 Disconnected from voice channel!');
        break;
      }
    }
  } catch (error: any) {
    console.error('Command error:', error);
    
    if (kaza.isKazaError(error)) {
      const suggestions = error.suggestions?.slice(0, 3).join('\n• ') || 'No suggestions available';
      message.reply(
        `❌ **Error:** ${error.message}\n` +
        `🔧 **Suggestions:**\n• ${suggestions}`
      );
    } else {
      message.reply('❌ An unexpected error occurred while executing the command!');
    }
  }
});

// Handle process events
process.on('SIGINT', async () => {
  console.log('🔄 Shutting down gracefully...');
  await kaza.destroy();
  process.exit(0);
});

process.on('unhandledRejection', (error) => {
  console.error('Unhandled promise rejection:', error);
});

// Bot login
client.login(process.env.DISCORD_TOKEN || 'your-bot-token');
