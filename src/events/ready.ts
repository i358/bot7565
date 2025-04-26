import { Client } from 'discord.js';

export default {
    name: 'ready',
    once: true,
    execute: (client: Client) => {
        console.log(`Bot başarıyla giriş yaptı: ${client.user?.tag}`);
        console.log('Bot hazır! Message olayları dinleniyor...');
    }
}; 