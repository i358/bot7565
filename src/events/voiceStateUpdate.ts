import { Events, VoiceState, Client } from 'discord.js';
import { logModeration } from '../utils/logModeration';

export default {
    name: Events.VoiceStateUpdate,
    once: false,
    async execute(oldState: VoiceState, newState: VoiceState, client: Client) {
        try {
            if (!newState.guild) return;
            // Katıldı
            if (!oldState.channelId && newState.channelId) {
                await logModeration({
                    guild: newState.guild,
                    action: 'voiceJoin',
                    target: newState.member!,
                    extraFields: [
                        { name: 'Kanal', value: newState.channel?.name || 'Bilinmiyor', inline: true }
                    ]
                });
            }
            // Ayrıldı
            else if (oldState.channelId && !newState.channelId) {
                await logModeration({
                    guild: newState.guild,
                    action: 'voiceLeave',
                    target: newState.member!,
                    extraFields: [
                        { name: 'Kanal', value: oldState.channel?.name || 'Bilinmiyor', inline: true }
                    ]
                });
            }
            // Kanal değiştirdi
            else if (oldState.channelId && newState.channelId && oldState.channelId !== newState.channelId) {
                await logModeration({
                    guild: newState.guild,
                    action: 'voiceMove',
                    target: newState.member!,
                    extraFields: [
                        { name: 'Önceki Kanal', value: oldState.channel?.name || 'Bilinmiyor', inline: true },
                        { name: 'Yeni Kanal', value: newState.channel?.name || 'Bilinmiyor', inline: true }
                    ]
                });
            }
        } catch (err) {
            console.error('voiceStateUpdate event log hatası:', err);
        }
    }
}; 