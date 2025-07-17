import { KazagumoPlugin } from '../types';

export const PlayerMoved: KazagumoPlugin = {
    name: 'PlayerMoved',
    
    load(kazagumo: any): void {
        kazagumo.on('playerUpdate', (player: any, data: any) => {
            if (data.guildId && data.guildId !== player.guildId) {
                // Player was moved to different guild - this shouldn't happen normally
                console.warn(`Player ${player.guildId} received update for different guild ${data.guildId}`);
            }
        });

        kazagumo.on('playerDestroy', (player: any) => {
            // Clean up any remaining references
            kazagumo.players.delete(player.guildId);
        });

        // Handle voice state updates that might indicate player movement
        kazagumo.shoukaku?.on('disconnect', (name: string, players: any[], moved: boolean) => {
            if (moved) {
                console.log(`Node ${name} disconnected, ${players.length} players moved`);
                players.forEach(player => {
                    const kazagumoPlayer = kazagumo.players.get(player.guildId);
                    if (kazagumoPlayer) {
                        kazagumoPlayer.emit('playerMoved', kazagumoPlayer, player);
                    }
                });
            }
        });
    },

    unload(kazagumo: any): void {
        // Remove event listeners if needed
        kazagumo.removeAllListeners('playerUpdate');
        kazagumo.removeAllListeners('playerDestroy');
    }
};
