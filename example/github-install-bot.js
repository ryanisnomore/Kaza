/**
 * Example Discord bot using Kaza from GitHub installation
 * 
 * Installation:
 * npm install git+https://github.com/ryanisnomore/Kaza.git
 * 
 * Or in package.json:
 * "kaza": "github:ryanisnomore/Kaza"
 */

const { Client, GatewayIntentBits } = require('discord.js');
const { Connectors } = require('shoukaku');
const { Kaza } = require('kaza');

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
  }
}, new Connectors.DiscordJS(client), nodes);

// Event handlers
client.on('ready', () => {
  console.log(`✅ ${client.user.tag} is ready with Kaza!`);
});

kaza.on('ready', (name) => {
  console.log(`✅ Lavalink node ${name} is ready!`);
});

// Basic play command
client.on('messageCreate', async (message) => {
  if (message.author.bot) return;
  
  if (message.content.startsWith('!play ')) {
    const query = message.content.slice(6);
    
    if (!message.member.voice.channel) {
      return message.reply('You need to be in a voice channel!');
    }
    
    try {
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
      
      if (!result.tracks.length) {
        return message.reply('No tracks found!');
      }
      
      // Add to queue and play
      player.queue.add(result.tracks[0]);
      if (!player.playing && !player.paused) {
        await player.play();
      }
      
      message.reply(`Added: **${result.tracks[0].info.title}**`);
      
    } catch (error) {
      console.error('Play error:', error);
      message.reply('An error occurred while playing the track.');
    }
  }
});

// Start the bot
client.login(process.env.DISCORD_TOKEN);
