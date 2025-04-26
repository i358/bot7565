import { Events, Channel, GuildChannel, Client } from 'discord.js';
import { logModeration } from '../utils/logModeration';

export default {
    name: Events.ChannelUpdate,
    once: false,
    async execute(oldChannel: Channel, newChannel: Channel, client: Client) {
        try {
            if (!('guild' in newChannel) || !newChannel.guild) return;
            let oldName = 'name' in oldChannel ? oldChannel.name : undefined;
            let newName = 'name' in newChannel ? newChannel.name : undefined;
            if (oldName === newName) return;
            await logModeration({
                guild: newChannel.guild,
                action: 'channelUpdate',
                target: newChannel,
                oldValue: oldName,
                newValue: newName,
                moderator: null
            });
        } catch (err) {
            console.error('channelUpdate event log hatası:', err);
        }
    }
}; 