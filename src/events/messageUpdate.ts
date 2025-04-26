import { Events, Message, Client } from 'discord.js';
import { logModeration } from '../utils/logModeration';

export default {
    name: Events.MessageUpdate,
    once: false,
    async execute(oldMessage: Message, newMessage: Message, client: Client) {
        try {
            if (!newMessage.guild) return;
            if (oldMessage.content === newMessage.content) return;
            await logModeration({
                guild: newMessage.guild,
                action: 'messageUpdate',
                target: newMessage,
                oldValue: oldMessage.content || '(boş mesaj)',
                newValue: newMessage.content || '(boş mesaj)',
                moderator: null
            });
        } catch (err) {
            console.error('messageUpdate event log hatası:', err);
        }
    }
}; 