/**
 * Advanced usage example for Kaza with plugins and advanced features
 */

const { Client, GatewayIntentBits } = require('discord.js');
const { Connectors } = require('shoukaku');
const { Kaza } = require('../dist/index.js');

// Advanced Discord client setup
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ]
});

// Multiple Lavalink nodes for load balancing
const nodes = [
  {
    name: 'Main',
    url: 'localhost:2333',
    auth: 'youshallnotpass',
    secure: false
  },
  {
    name: 'Backup',
    url: 'localhost:2334',
    auth: 'youshallnotpass',
    secure: false
  }
];

// Advanced Kaza configuration
const kaza = new Kaza({
  defaultSearchEngine: 'ytmsearch',
  send: (guildId, payload) => {
    const guild = client.guilds.cache.get(guildId);
    if (guild) guild.shard.send(payload);
  },
  plugins: {
    'PlayerMoved': {
      enabled: true,
      priority: 100,
      config: {
        autoReconnect: true,
        reconnectDelay: 2000,
        maxReconnectAttempts: 5,
        trackMovement: true
      }
    }
  },
  searchOptions: {
    cacheResults: true,
    cacheTTL: 600000, // 10 minutes
    retryAttempts: 3,
    timeout: 20000,
    fallbackEngines: ['ytmsearch', 'ytsearch', 'spsearch', 'scsearch']
  },
  nodeOptions: {
    retryAttempts: 3,
    retryDelay: 3000,
    secure: false
  }
}, new Connectors.DiscordJS(client), nodes);

// Advanced event handling
kaza.on('ready', (name) => {
  console.log(`🌟 Lavalink node ${name} connected and ready!`);
});

kaza.on('error', (name, error) => {
  console.error(`💥 Lavalink node ${name} error:`, error);
});

kaza.on('disconnect', (name, moved) => {
  console.log(`🔌 Lavalink node ${name} disconnected (moved: ${moved})`);
});

kaza.on('reconnecting', (name) => {
  console.log(`🔄 Lavalink node ${name} is reconnecting...`);
});

kaza.on('playerCreate', (player) => {
  console.log(`🎵 Player created for guild ${player.guildId}`);
  
  // Set up player-specific event handlers
  player.on('trackStart', (player, track) => {
    const textChannel = client.channels.cache.get(player.textId);
    if (textChannel) {
      textChannel.send(`🎵 Now playing: **${track.info.title}** by **${track.info.author}**`);
    }
  });
  
  player.on('trackEnd', (player, track) => {
    console.log(`Finished playing: ${track.info.title}`);
  });
  
  player.on('trackException', (player, track, exception) => {
    console.error(`Track exception for ${track.info.title}:`, exception);
    const textChannel = client.channels.cache.get(player.textId);
    if (textChannel) {
      textChannel.send(`❌ An error occurred while playing: **${track.info.title}**`);
    }
  });
  
  player.on('queueEnd', (player) => {
    const textChannel = client.channels.cache.get(player.textId);
    if (textChannel) {
      textChannel.send('📭 Queue has ended. Add more tracks to continue!');
    }
  });
});

kaza.on('playerDestroy', (player) => {
  console.log(`🗑️ Player destroyed for guild ${player.guildId}`);
});

kaza.on('playerMoved', (player, oldChannel, newChannel) => {
  console.log(`🔄 Player moved from ${oldChannel} to ${newChannel}`);
  const textChannel = client.channels.cache.get(player.textId);
  if (textChannel) {
    textChannel.send(`🔄 Bot moved to a different voice channel`);
  }
});

// Advanced command system with error handling
const commands = new Map();

// Play command with advanced features
commands.set('play', async (message, args) => {
  if (!args[0]) {
    return message.reply('❌ Please provide a song to play!');
  }
  
  const voiceChannel = message.member.voice.channel;
  if (!voiceChannel) {
    return message.reply('❌ You need to be in a voice channel!');
  }
  
  // Check bot permissions
  const permissions = voiceChannel.permissionsFor(message.guild.members.me);
  if (!permissions.has('CONNECT') || !permissions.has('SPEAK')) {
    return message.reply('❌ I need CONNECT and SPEAK permissions in your voice channel!');
  }
  
  try {
    const player = kaza.createPlayer({
      guildId: message.guild.id,
      voiceId: voiceChannel.id,
      textId: message.channel.id,
      deaf: true,
      mute: false,
      volume: 75
    });
    
    const query = args.join(' ');
    
    // Check if it's a URL
    const urlInfo = kaza.parseURL(query);
    let result;
    
    if (urlInfo.isValid) {
      message.reply(`🔍 Detected ${urlInfo.platform} ${urlInfo.type}, searching...`);
      result = await kaza.searchByURL(query, {
        requester: message.author,
        limit: 1
      });
    } else {
      result = await kaza.autoSearch(query, {
        requester: message.author,
        fallbackEngines: ['ytmsearch', 'ytsearch', 'spsearch', 'scsearch'],
        limit: 1,
        cacheResults: true
      });
    }
    
    if (result.tracks.length === 0) {
      return message.reply('❌ No tracks found! Try different keywords or check the URL.');
    }
    
    const track = result.tracks[0];
    
    // Check track length (max 10 minutes for this example)
    if (track.info.length > 600000) {
      return message.reply('❌ Track is too long! Maximum length is 10 minutes.');
    }
    
    player.queue.add(track);
    
    if (!player.playing) {
      await player.play();
    }
    
    const duration = Math.floor(track.info.length / 1000);
    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;
    
    message.reply({
      embeds: [{
        title: '✅ Track Added',
        description: `**${track.info.title}**\nby **${track.info.author}**`,
        color: 0x00ff00,
        fields: [
          {
            name: '⏱️ Duration',
            value: `${minutes}:${seconds.toString().padStart(2, '0')}`,
            inline: true
          },
          {
            name: '🔗 Source',
            value: track.info.sourceName,
            inline: true
          },
          {
            name: '📋 Queue Position',
            value: `${player.queue.size}`,
            inline: true
          }
        ],
        footer: {
          text: `Requested by ${message.author.username}`,
          icon_url: message.author.displayAvatarURL()
        }
      }]
    });
    
  } catch (error) {
    console.error('Play command error:', error);
    
    if (kaza.isKazaError(error)) {
      const suggestions = error.suggestions.slice(0, 3).join('\n• ');
      message.reply(
        `❌ **Error:** ${error.message}\n` +
        `🔧 **Suggestions:**\n• ${suggestions}`
      );
    } else {
      message.reply('❌ An unexpected error occurred while trying to play the track!');
    }
  }
});

// Playlist command
commands.set('playlist', async (message, args) => {
  if (!args[0]) {
    return message.reply('❌ Please provide a playlist URL!');
  }
  
  const voiceChannel = message.member.voice.channel;
  if (!voiceChannel) {
    return message.reply('❌ You need to be in a voice channel!');
  }
  
  try {
    const player = kaza.createPlayer({
      guildId: message.guild.id,
      voiceId: voiceChannel.id,
      textId: message.channel.id
    });
    
    const query = args.join(' ');
    const urlInfo = kaza.parseURL(query);
    
    if (!urlInfo.isValid || urlInfo.type !== 'playlist') {
      return message.reply('❌ Please provide a valid playlist URL!');
    }
    
    const loadingMessage = await message.reply('🔄 Loading playlist...');
    
    const result = await kaza.searchByURL(query, {
      requester: message.author,
      limit: 100 // Load up to 100 tracks
    });
    
    if (result.tracks.length === 0) {
      return loadingMessage.edit('❌ No tracks found in the playlist!');
    }
    
    // Add tracks to queue
    const addedTracks = result.tracks.slice(0, 50); // Limit to 50 tracks
    player.queue.add(addedTracks);
    
    if (!player.playing) {
      await player.play();
    }
    
    const totalDuration = addedTracks.reduce((sum, track) => sum + track.info.length, 0);
    const hours = Math.floor(totalDuration / 3600000);
    const minutes = Math.floor((totalDuration % 3600000) / 60000);
    
    loadingMessage.edit({
      embeds: [{
        title: '📋 Playlist Added',
        description: result.playlistInfo ? `**${result.playlistInfo.name}**` : 'Unknown Playlist',
        color: 0x00ff00,
        fields: [
          {
            name: '🎵 Tracks Added',
            value: `${addedTracks.length}`,
            inline: true
          },
          {
            name: '⏱️ Total Duration',
            value: `${hours}h ${minutes}m`,
            inline: true
          },
          {
            name: '🔗 Source',
            value: urlInfo.platform,
            inline: true
          }
        ],
        footer: {
          text: `Requested by ${message.author.username}`,
          icon_url: message.author.displayAvatarURL()
        }
      }]
    });
    
  } catch (error) {
    console.error('Playlist command error:', error);
    message.reply('❌ An error occurred while loading the playlist!');
  }
});

// Advanced queue management command
commands.set('queue', async (message, args) => {
  const player = kaza.getPlayer(message.guild.id);
  if (!player) {
    return message.reply('❌ No player found!');
  }
  
  const subcommand = args[0]?.toLowerCase();
  
  switch (subcommand) {
    case 'clear':
      player.queue.clear();
      message.reply('🧹 Queue cleared!');
      break;
      
    case 'remove': {
      const index = parseInt(args[1]) - 1;
      const removed = player.queue.remove(index);
      if (removed) {
        message.reply(`🗑️ Removed: **${removed.info.title}**`);
      } else {
        message.reply('❌ Invalid queue position!');
      }
      break;
    }
    
    case 'move': {
      const from = parseInt(args[1]) - 1;
      const to = parseInt(args[2]) - 1;
      const moved = player.queue.move(from, to);
      if (moved) {
        message.reply(`🔄 Moved track from position ${from + 1} to ${to + 1}`);
      } else {
        message.reply('❌ Invalid queue positions!');
      }
      break;
    }
    
    case 'skipto': {
      const index = parseInt(args[1]) - 1;
      const track = player.queue.skipTo(index);
      if (track) {
        await player.play(track);
        message.reply(`⏭️ Skipped to: **${track.info.title}**`);
      } else {
        message.reply('❌ Invalid queue position!');
      }
      break;
    }
    
    default: {
      const queueInfo = player.getQueueInfo();
      
      if (queueInfo.queue.length === 0) {
        return message.reply('📭 Queue is empty!');
      }
      
      const page = parseInt(args[0]) || 1;
      const itemsPerPage = 10;
      const startIndex = (page - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      
      const queueList = queueInfo.queue
        .slice(startIndex, endIndex)
        .map((track, index) => {
          const duration = Math.floor(track.info.length / 1000);
          const minutes = Math.floor(duration / 60);
          const seconds = duration % 60;
          return `${startIndex + index + 1}. **${track.info.title}** by **${track.info.author}** [${minutes}:${seconds.toString().padStart(2, '0')}]`;
        })
        .join('\n');
      
      const totalPages = Math.ceil(queueInfo.queue.length / itemsPerPage);
      
      message.reply({
        embeds: [{
          title: '📋 Queue',
          description: queueList,
          color: 0x0099ff,
          fields: [
            {
              name: '🎵 Now Playing',
              value: queueInfo.current ? `**${queueInfo.current.info.title}** by **${queueInfo.current.info.author}**` : 'None',
              inline: false
            },
            {
              name: '📊 Stats',
              value: `Total: ${queueInfo.queue.length} tracks\nPage: ${page}/${totalPages}`,
              inline: true
            },
            {
              name: '⚙️ Settings',
              value: `Repeat: ${queueInfo.repeat === 0 ? 'Off' : queueInfo.repeat === 1 ? 'Track' : 'Queue'}\nShuffle: ${queueInfo.shuffle ? 'On' : 'Off'}`,
              inline: true
            }
          ]
        }]
      });
    }
  }
});

// Health monitoring command
commands.set('health', async (message) => {
  try {
    const health = await kaza.healthCheck();
    const stats = kaza.getStats();
    
    const components = Object.entries(health.components)
      .map(([name, status]) => `${name}: ${status ? '✅' : '❌'}`)
      .join('\n');
    
    message.reply({
      embeds: [{
        title: '🏥 System Health',
        color: health.status === 'healthy' ? 0x00ff00 : 
               health.status === 'degraded' ? 0xffff00 : 0xff0000,
        fields: [
          {
            name: '📊 Overall Status',
            value: health.status.toUpperCase(),
            inline: true
          },
          {
            name: '⚙️ Components',
            value: components,
            inline: true
          },
          {
            name: '📈 Statistics',
            value: `Players: ${stats.players}\nUptime: ${Math.floor(stats.uptime / 1000)}s\nSearches: ${stats.search.totalSearches}`,
            inline: true
          }
        ],
        footer: {
          text: `Last check: ${new Date(health.timestamp).toLocaleString()}`
        }
      }]
    });
  } catch (error) {
    console.error('Health command error:', error);
    message.reply('❌ Failed to get system health status!');
  }
});

// Message handling with advanced command system
client.on('messageCreate', async (message) => {
  if (message.author.bot || !message.guild) return;
  
  const prefix = process.env.PREFIX || '!';
  if (!message.content.startsWith(prefix)) return;
  
  const args = message.content.slice(prefix.length).trim().split(/\s+/);
  const commandName = args.shift().toLowerCase();
  
  const command = commands.get(commandName);
  if (!command) return;
  
  try {
    await command(message, args);
  } catch (error) {
    console.error(`Command ${commandName} error:`, error);
    message.reply('❌ An error occurred while executing the command!');
  }
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('🔄 Shutting down gracefully...');
  
  try {
    await kaza.destroy();
    console.log('✅ Kaza destroyed successfully');
    
    client.destroy();
    console.log('✅ Discord client destroyed');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during shutdown:', error);
    process.exit(1);
  }
});

// Error handling
process.on('unhandledRejection', (error) => {
  console.error('Unhandled promise rejection:', error);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
  process.exit(1);
});

// Bot login
client.login(process.env.DISCORD_TOKEN);
