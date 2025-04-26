import { Events, Message, Client } from 'discord.js';
import { logModeration } from '../utils/logModeration';

export default {
    name: Events.MessageDelete,
    once: false,
    async execute(message: Message, client: Client) {
        try {
            if (!message.guild) return;
            await logModeration({
                guild: message.guild,
                action: 'messageDelete',
                target: message,
                oldValue: message.content || '(boş mesaj)',
                moderator: null
            });
        } catch (err) {
            console.error('messageDelete event log hatası:', err);
        }
    }
}; 