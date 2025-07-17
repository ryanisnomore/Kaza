/**
 * Basic usage example for Kaza (CommonJS)
 */

const { Client, GatewayIntentBits } = require('discord.js');
const { Connectors } = require('shoukaku');
const { Kaza } = require('../dist/index.js');

// Discord client setup
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

// Initialize Kaza
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

// Event listeners
kaza.on('ready', (name) => {
  console.log(`Lavalink node ${name} is ready!`);
});

kaza.on('error', (name, error) => {
  console.error(`Lavalink node ${name} error:`, error);
});

kaza.on('playerCreate', (player) => {
  console.log(`Player created for guild ${player.guildId}`);
});

kaza.on('trackStart', (player, track) => {
  console.log(`Now playing: ${track.info.title} by ${track.info.author}`);
});

kaza.on('queueEnd', (player) => {
  console.log(`Queue ended for guild ${player.guildId}`);
});

// Message handling
client.on('messageCreate', async (message) => {
  if (message.author.bot) return;
  
  const prefix = '!';
  if (!message.content.startsWith(prefix)) return;
  
  const args = message.content.slice(prefix.length).trim().split(/\s+/);
  const command = args.shift().toLowerCase();
  
  try {
    switch (command) {
      case 'play': {
        if (!args[0]) {
          return message.reply('Please provide a song to play!');
        }
        
        const voiceChannel = message.member.voice.channel;
        if (!voiceChannel) {
          return message.reply('You need to be in a voice channel!');
        }
        
        // Create or get player
        const player = kaza.createPlayer({
          guildId: message.guild.id,
          voiceId: voiceChannel.id,
          textId: message.channel.id
        });
        
        // Search for track
        const query = args.join(' ');
        const result = await kaza.autoSearch(query, {
          requester: message.author,
          fallbackEngines: ['ytmsearch', 'spsearch']
        });
        
        if (result.tracks.length === 0) {
          return message.reply('No tracks found!');
        }
        
        const track = result.tracks[0];
        player.queue.add(track);
        
        if (!player.playing) {
          await player.play();
        }
        
        message.reply(`Added to queue: **${track.info.title}** by **${track.info.author}**`);
        break;
      }
      
      case 'skip': {
        const player = kaza.getPlayer(message.guild.id);
        if (!player) {
          return message.reply('No player found!');
        }
        
        await player.skip();
        message.reply('Skipped the current track!');
        break;
      }
      
      case 'pause': {
        const player = kaza.getPlayer(message.guild.id);
        if (!player) {
          return message.reply('No player found!');
        }
        
        await player.pause(true);
        message.reply('Paused the player!');
        break;
      }
      
      case 'resume': {
        const player = kaza.getPlayer(message.guild.id);
        if (!player) {
          return message.reply('No player found!');
        }
        
        await player.pause(false);
        message.reply('Resumed the player!');
        break;
      }
      
      case 'stop': {
        const player = kaza.getPlayer(message.guild.id);
        if (!player) {
          return message.reply('No player found!');
        }
        
        await player.stop();
        message.reply('Stopped the player!');
        break;
      }
      
      case 'queue': {
        const player = kaza.getPlayer(message.guild.id);
        if (!player) {
          return message.reply('No player found!');
        }
        
        const queueInfo = player.getQueueInfo();
        
        if (queueInfo.queue.length === 0) {
          return message.reply('Queue is empty!');
        }
        
        const queueList = queueInfo.queue
          .slice(0, 10)
          .map((track, index) => `${index + 1}. ${track.info.title} by ${track.info.author}`)
          .join('\n');
        
        message.reply(`**Queue (${queueInfo.queue.length} tracks):**\n${queueList}`);
        break;
      }
      
      case 'nowplaying': {
        const player = kaza.getPlayer(message.guild.id);
        if (!player) {
          return message.reply('No player found!');
        }
        
        const playbackInfo = player.getPlaybackInfo();
        
        if (!playbackInfo.track) {
          return message.reply('No track is currently playing!');
        }
        
        const track = playbackInfo.track;
        const position = Math.floor(playbackInfo.position / 1000);
        const duration = Math.floor(track.info.length / 1000);
        
        message.reply(
          `**Now Playing:**\n` +
          `${track.info.title} by ${track.info.author}\n` +
          `Position: ${position}s / ${duration}s\n` +
          `Volume: ${playbackInfo.volume}%`
        );
        break;
      }
      
      case 'disconnect': {
        const player = kaza.getPlayer(message.guild.id);
        if (!player) {
          return message.reply('No player found!');
        }
        
        kaza.destroyPlayer(message.guild.id);
        message.reply('Disconnected from voice channel!');
        break;
      }
    }
  } catch (error) {
    console.error('Command error:', error);
    message.reply('An error occurred while executing the command!');
  }
});

// Bot login
client.login(process.env.DISCORD_TOKEN || 'your-bot-token');
