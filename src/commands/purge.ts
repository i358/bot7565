import { SlashCommandBuilder, PermissionFlagsBits, ChatInputCommandInteraction, TextChannel } from 'discord.js';
import { Command } from './types';

const command: Command = {
    data: new SlashCommandBuilder()
        .setName('purge')
        .setDescription('Delete specified number of messages')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
        .addIntegerOption(option => 
            option.setName('amount')
                .setDescription('Number of messages to delete (1-100)')
                .setRequired(true)
                .setMinValue(1)
                .setMaxValue(100)
        )
        .addUserOption(option =>
            option.setName('user')
                .setDescription('Delete messages from a specific user')
                .setRequired(false)
        )
        .addStringOption(option =>
            option.setName('type')
                .setDescription('Type of messages to delete')
                .setRequired(false)
                .addChoices(
                    { name: 'All', value: 'all' },
                    { name: 'Bot Messages', value: 'bot' },
                    { name: 'User Messages', value: 'user' }
                )
        )
        .addStringOption(option =>
            option.setName('before_message')
                .setDescription('Delete messages before this message ID')
                .setRequired(false)
        ) as SlashCommandBuilder,

    cooldown: 5, // 5 saniye bekleme süresi

    execute: async (interaction: ChatInputCommandInteraction) => {
        try {
            if (!interaction.channel || !(interaction.channel instanceof TextChannel)) {
                await interaction.reply({ content: '❌ Bu komut sadece metin kanallarında kullanılabilir!', ephemeral: true });
                return;
            }

            const amount = interaction.options.getInteger('amount', true);
            const user = interaction.options.getUser('user');
            const type = interaction.options.getString('type') || 'all';
            const beforeMessageId = interaction.options.getString('before_message');

            // Mesajları getir
            const messages = await interaction.channel.messages.fetch({
                limit: amount,
                before: beforeMessageId || undefined
            });

            // Filtreleme
            let filteredMessages = messages.filter(msg => {
                if (user && msg.author.id !== user.id) return false;
                if (type === 'bot' && !msg.author.bot) return false;
                if (type === 'user' && msg.author.bot) return false;
                return true;
            });

            // 14 günden eski mesajları çıkar
            const twoWeeksAgo = Date.now() - 14 * 24 * 60 * 60 * 1000;
            filteredMessages = filteredMessages.filter(msg => msg.createdTimestamp > twoWeeksAgo);

            if (filteredMessages.size === 0) {
                await interaction.reply({ content: '❌ Silinecek mesaj bulunamadı!', ephemeral: true });
                return;
            }

            // Mesajları sil
            await interaction.channel.bulkDelete(filteredMessages);

            // Başarı mesajı
            const successMessage = `✅ ${filteredMessages.size} mesaj silindi!` + 
                (user ? ` (${user.tag} kullanıcısına ait)` : '') +
                (type !== 'all' ? ` (${type === 'bot' ? 'Bot' : 'Kullanıcı'} mesajları)` : '');

            await interaction.reply({ content: successMessage, ephemeral: true });

            // 5 saniye sonra başarı mesajını sil
            setTimeout(async () => {
                if (interaction.replied) {
                    await interaction.deleteReply().catch(() => {});
                }
            }, 5000);

        } catch (error) {
            console.error('Purge komutu hatası:', error);
            const errorMessage = error instanceof Error ? error.message : 'Bilinmeyen bir hata oluştu!';
            await interaction.reply({ 
                content: `❌ Mesajlar silinirken bir hata oluştu: ${errorMessage}`, 
                ephemeral: true 
            });
        }
    }
};

export default command; 