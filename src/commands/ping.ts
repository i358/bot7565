import { SlashCommandBuilder } from 'discord.js';
import type { Command } from './types';

const command: Command = {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Shows the bot\'s latency'),
    
    async execute(interaction) {
        const sent = await interaction.reply({ 
            content: '🏓 Pinging...',
            fetchReply: true 
        });

        const latency = sent.createdTimestamp - interaction.createdTimestamp;
        const wsLatency = interaction.client.ws.ping;

        await interaction.editReply({
            content: `🏓 Pong!\n> Bot Latency: \`${latency}ms\`\n> WebSocket Latency: \`${wsLatency}ms\``
        });
    },

    cooldown: 5 // 5 second cooldown
};

export default command; 