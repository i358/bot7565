import { Events, Channel, GuildChannel, Client } from 'discord.js';
import { logModeration } from '../utils/logModeration';

export default {
    name: Events.ChannelCreate,
    once: false,
    async execute(channel: Channel, client: Client) {
        try {
            if (!('guild' in channel) || !channel.guild) return;
            await logModeration({
                guild: channel.guild,
                action: 'channelCreate',
                target: channel,
                moderator: null
            });
        } catch (err) {
            console.error('channelCreate event log hatası:', err);
        }
    }
}; 