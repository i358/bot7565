import { Events, Channel, GuildChannel, Client } from 'discord.js';
import { logModeration } from '../utils/logModeration';

export default {
    name: Events.ChannelDelete,
    once: false,
    async execute(channel: Channel, client: Client) {
        try {
            if (!('guild' in channel) || !channel.guild) return;
            await logModeration({
                guild: channel.guild,
                action: 'channelDelete',
                target: channel,
                moderator: null
            });
        } catch (err) {
            console.error('channelDelete event log hatası:', err);
        }
    }
}; 