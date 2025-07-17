const { Client, GatewayIntentBits } = require('discord.js');
const { Connectors } = require('shoukaku');
const { Kazagumo, PlayerMoved } = require('../dist');

// Create Discord client
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

// Enhanced Lavalink nodes configuration
const nodes = [{
    name: 'Main',
    url: 'localhost:2333',
    auth: 'youshallnotpass',
    secure: false
}, {
    name: 'Backup',
    url: 'localhost:2334',
    auth: 'youshallnotpass',
    secure: false
}];

// Initialize Kaza with enhanced configuration
const kaza = new Kazagumo({
    defaultSearchEngine: 'ytsearch',
    searchLimit: 15,
    send: (guildId, payload) => {
        const guild = client.guilds.cache.get(guildId);
        if (guild) guild.shard.send(payload);
    },
    plugins: {
        'PlayerMoved': { enabled: true, priority: 100 },
        'AutoLeave': { enabled: true, priority: 50, config: { emptyChannelTimeout: 300000 } }
    },
    errorHandling: {
        retryAttempts: 3,
        timeout: 10000,
        fallbackEngines: ['ytmsearch', 'ytsearch']
    },
    cache: {
        enabled: true,
        ttl: 300000,
        maxSize: 1000
    },
    resume: false,
    resumeByLibrary: false,
    userAgent: 'MyBot-Kaza/1.0.0'
}, new Connectors.DiscordJS(client), nodes);

// Enhanced event handlers
kaza.on('ready', async (name) => {
    console.log(`Lavalink node ${name} is ready!`);
    
    // Get comprehensive stats
    const stats = kaza.getStats();
    console.log(`Kaza Stats:`, stats);
    
    // Show supported platforms
    const platforms = kaza.getSupportedPlatforms();
    console.log(`Supported platforms: ${platforms.join(', ')}`);
    
    // Health check
    const health = await kaza.healthCheck();
    console.log(`Health Status: ${health.status}`, health.components);
});

kaza.on('error', (name, error) => {
    console.error(`Lavalink node ${name} error:`, error);
});

kaza.on('trackStart', (player, track) => {
    const channel = client.channels.cache.get(player.textId);
    if (channel) {
        const source = track.info.sourceName || 'Unknown';
        const duration = formatTime(track.info.length || 0);
        channel.send(`**Now playing:** ${track.info.title} by ${track.info.author}\n` +
                    `Duration: ${duration} | Source: ${source}\n` +
                    `${track.info.artworkUrl ? `${track.info.artworkUrl}` : ''}`);
    }
});

kaza.on('trackEnd', (player, track, reason) => {
    console.log(`Track ended: ${track.info.title} - Reason: ${reason}`);
});

kaza.on('queueEnd', (player) => {
    const channel = client.channels.cache.get(player.textId);
    if (channel) {
        channel.send('Queue finished! Use `!play` to add more songs.');
    }
});

kaza.on('playerException', (player, data) => {
    console.error('Player exception:', data);
    const channel = client.channels.cache.get(player.textId);
    if (channel) {
        channel.send('An error occurred during playback. Skipping to next track...');
    }
});

// Discord bot events
client.on('ready', () => {
    console.log(`${client.user.tag} is ready with enhanced Kaza!`);
});

client.on('messageCreate', async (message) => {
    if (message.author.bot || !message.content.startsWith('!')) return;

    const args = message.content.slice(1).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    // Enhanced play command with auto-detection
    if (command === 'play') {
        if (!args.length) {
            return message.reply('Please provide a song to search for!\n' +
                'Examples:\n' +
                '• `!play song name` - Auto-detect best platform\n' +
                '• `!play https://open.spotify.com/track/...` - Direct URL\n' +
                '• `!play https://music.apple.com/...` - Apple Music URL');
        }

        const member = message.member;
        if (!member?.voice.channel) {
            return message.reply('You need to join a voice channel first!');
        }

        try {
            let player = kaza.getPlayer(message.guild.id);
            
            if (!player) {
                player = kaza.createPlayer({
                    guildId: message.guild.id,
                    voiceId: member.voice.channel.id,
                    textId: message.channel.id,
                    deaf: true
                });
            }

            const query = args.join(' ');
            
            // Use enhanced auto-search with platform detection
            const result = await kaza.autoSearch(query, { 
                requester: message.author,
                limit: 1,
                timeout: 15000,
                cacheResults: true
            });

            if (!result.tracks.length) {
                let errorMsg = 'No results found!';
                if (result.exception) {
                    errorMsg += `\nReason: ${result.exception.message}`;
                    if (result.exception.suggestions) {
                        errorMsg += '\n\nSuggestions:\n• ' + result.exception.suggestions.join('\n• ');
                    }
                }
                return message.reply(errorMsg);
            }

            // Enhanced response with metadata
            if (result.type === 'playlist') {
                player.queue.add(result.tracks);
                message.reply(`**Added playlist:** ${result.playlistName}\n` +
                            `**${result.tracks.length}** tracks added | Source: ${result.platform || 'Unknown'}\n` +
                            `Search time: ${result.searchTime}ms${result.fromCache ? ' (cached)' : ''}`);
            } else {
                const track = result.tracks[0];
                player.queue.add(track);
                const duration = formatTime(track.info.length || 0);
                message.reply(`**Added:** ${track.info.title} by ${track.info.author}\n` +
                            `⏱Duration: ${duration} | Source: ${track.info.sourceName || 'Unknown'}\n` +
                            `Search time: ${result.searchTime}ms${result.fromCache ? ' (cached)' : ''}`);
            }

            if (!player.playing && !player.paused) {
                await player.play();
            }

        } catch (error) {
            console.error('Enhanced play command error:', error);
            message.reply('An error occurred while processing your request!');
        }
    }

    // Platform-specific search commands
    if (command === 'spotify') {
        if (!args.length) return message.reply('Please provide a Spotify search query!');
        
        try {
            const result = await kaza.searchSpotify(args.join(' '), { 
                requester: message.author,
                limit: 5
            });
            
            if (result.tracks.length) {
                const trackList = result.tracks.slice(0, 5).map((track, i) => 
                    `${i + 1}. **${track.info.title}** by **${track.info.author}**`
                ).join('\n');
                
                message.reply(`**Spotify Results for "${args.join(' ')}":**\n${trackList}\n` +
                            `Search time: ${result.searchTime}ms`);
            } else {
                message.reply('No Spotify results found.');
            }
        } catch (error) {
            message.reply('Spotify search failed. Make sure LavaSrc is configured properly.');
        }
    }

    if (command === 'apple') {
        if (!args.length) return message.reply('Please provide an Apple Music search query!');
        
        try {
            const result = await kaza.searchAppleMusic(args.join(' '), { 
                requester: message.author,
                limit: 5
            });
            
            if (result.tracks.length) {
                const trackList = result.tracks.slice(0, 5).map((track, i) => 
                    `${i + 1}. **${track.info.title}** by **${track.info.author}**`
                ).join('\n');
                
                message.reply(`**Apple Music Results for "${args.join(' ')}":**\n${trackList}\n` +
                            `Search time: ${result.searchTime}ms`);
            } else {
                message.reply('No Apple Music results found.');
            }
        } catch (error) {
            message.reply('Apple Music search failed. Make sure LavaSrc is configured properly.');
        }
    }

    // Enhanced URL parsing command
    if (command === 'parse') {
        if (!args.length) return message.reply('Please provide a URL to parse!');
        
        const url = args[0];
        const parseResult = kaza.parseURL(url);
        
        message.reply(`**URL Analysis:**\n` +
                    `Platform: ${parseResult.platform}\n` +
                    `Type: ${parseResult.type}\n` +
                    `Valid URL: ${parseResult.isValidUrl ? '✅' : '❌'}\n` +
                    `Search Engine: ${parseResult.searchPrefix}`);
    }

    // Enhanced stats command
    if (command === 'stats') {
        const stats = kaza.getStats();
        const health = await kaza.healthCheck();
        
        message.reply(`**Kaza Statistics:**\n` +
                    `**Players:** ${stats.players} (${stats.playingPlayers} playing)\n` +
                    `**Nodes:** ${stats.connectedNodes}/${stats.nodes} connected\n` +
                    `**Search Cache:** ${stats.search.cacheSize} entries (${stats.search.cacheHitRate}% hit rate)\n` +
                    `**Plugins:** ${stats.plugins.enabled}/${stats.plugins.total} loaded\n` +
                    `**Platforms:** ${stats.search.supportedPlatforms.length} supported\n` +
                    `**Uptime:** ${formatTime(stats.uptime)}\n` +
                    `**Health:** ${health.status.toUpperCase()}\n` +
                    `**Library:** ${stats.library} v${stats.version}`);
    }

    // Health check command
    if (command === 'health') {
        const health = await kaza.healthCheck();
        let healthMsg = `**System Health: ${health.status.toUpperCase()}**\n\n`;
        
        for (const [component, data] of Object.entries(health.components)) {
            const statusEmoji = data.status === 'healthy' ? '✅' : 
                              data.status === 'degraded' ? '⚠️' : '❌';
            healthMsg += `${statusEmoji} **${component}:** ${data.status}\n`;
            
            Object.entries(data).forEach(([key, value]) => {
                if (key !== 'status') {
                    healthMsg += `   • ${key}: ${value}\n`;
                }
            });
        }
        
        message.reply(healthMsg);
    }

    // Enhanced platforms command
    if (command === 'platforms') {
        const platforms = kaza.getSupportedPlatforms();
        const engines = kaza.getSupportedEngines();
        
        message.reply(`**Supported Platforms (${platforms.length}):**\n${platforms.map(p => `• ${p}`).join('\n')}\n\n` +
                    `**Search Engines (${engines.length}):**\n${engines.map(e => `• ${e}`).join('\n')}`);
    }

    // Clear cache command
    if (command === 'clearcache') {
        kaza.searchManager.clearCache();
        message.reply('Search cache cleared successfully!');
    }

    // Standard player commands
    if (command === 'skip') {
        const player = kaza.getPlayer(message.guild.id);
        if (!player) return message.reply('No player found!');

        try {
            await player.skip();
            message.reply('Skipped the current track!');
        } catch (error) {
            message.reply('Failed to skip the track!');
        }
    }

    if (command === 'stop') {
        const player = kaza.getPlayer(message.guild.id);
        if (!player) return message.reply('No player found!');

        try {
            await player.stop();
            player.queue.clear();
            message.reply('Stopped playback and cleared the queue!');
        } catch (error) {
            message.reply('Failed to stop playback!');
        }
    }

    if (command === 'queue') {
        const player = kaza.getPlayer(message.guild.id);
        if (!player || player.queue.isEmpty) {
            return message.reply('The queue is empty!');
        }

        const current = player.current;
        const queue = player.queue.toArray().slice(0, 10);
        let queueString = '';
        
        if (current) {
            const source = current.info.sourceName || 'Unknown';
            const duration = formatTime(current.info.length || 0);
            queueString += `**Now Playing:**\n${current.info.title} by ${current.info.author}\n` +
                          `${duration} | ${source}\n\n`;
        }
        
        if (queue.length > 0) {
            queueString += `**Queue (${player.queue.length} total):**\n`;
            queueString += queue.map((track, index) => {
                const source = track.info.sourceName || 'Unknown';
                const duration = formatTime(track.info.length || 0);
                return `${index + 1}. **${track.info.title}** by **${track.info.author}**\n` +
                       `${duration} | ${source}`;
            }).join('\n');

            if (player.queue.length > 10) {
                queueString += `\n... and ${player.queue.length - 10} more tracks`;
            }
        }

        message.reply(queueString);
    }

    if (command === 'nowplaying') {
        const player = kaza.getPlayer(message.guild.id);
        if (!player || !player.current) {
            return message.reply('Nothing is currently playing!');
        }

        const track = player.current;
        const source = track.info.sourceName || 'Unknown';
        const position = formatTime(player.position);
        const duration = formatTime(track.info.length || 0);
        const progress = Math.round((player.position / (track.info.length || 1)) * 20);
        const progressBar = '▓'.repeat(progress) + '░'.repeat(20 - progress);

        message.reply(`**Now Playing:**\n` +
                    `**${track.info.title}** by **${track.info.author}**\n` +
                    `${progressBar}\n` +
                    `${position} / ${duration} |  ${source}\n` +
                    `Volume: ${player.volume}% | Loop: ${player.queue.repeatMode === 1 ? 'Track' : player.queue.repeatMode === 2 ? 'Queue' : 'Off'}\n` +
                    `${track.info.artworkUrl ? `${track.info.artworkUrl}` : ''}`);
    }
});

// Utility function to format time
function formatTime(ms) {
    if (!ms || ms === 0) return '0:00';
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('Shutting down gracefully...');
    await kaza.destroy();
    process.exit(0);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Login to Discord
client.login(process.env.DISCORD_TOKEN);
