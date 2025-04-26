import { SlashCommandBuilder, PermissionFlagsBits, ChatInputCommandInteraction, TextChannel, ChannelType } from 'discord.js';
import { Command } from './types';

const command: Command = {
    data: new SlashCommandBuilder()
        .setName('nuke')
        .setDescription('Kanalı silip aynı ayarlarla yeniden oluşturur')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels | PermissionFlagsBits.Administrator)
        .addBooleanOption(option =>
            option.setName('confirm')
                .setDescription('İşlemi onaylıyorum')
                .setRequired(true)
        ),

    cooldown: 30, // 30 saniye bekleme süresi

    execute: async (interaction: ChatInputCommandInteraction) => {
        try {
            if (!interaction.channel || !(interaction.channel instanceof TextChannel)) {
                await interaction.reply({ content: '❌ Bu komut sadece metin kanallarında kullanılabilir!', ephemeral: true });
                return;
            }

            const confirm = interaction.options.getBoolean('confirm', true);
            if (!confirm) {
                await interaction.reply({ content: '❌ İşlem iptal edildi!', ephemeral: true });
                return;
            }

            const channel = interaction.channel as TextChannel;
            
            // Kanal bilgilerini kaydet
            const channelInfo = {
                name: channel.name,
                topic: channel.topic,
                nsfw: channel.nsfw,
                rateLimitPerUser: channel.rateLimitPerUser,
                position: channel.position,
                parent: channel.parent,
                permissionOverwrites: channel.permissionOverwrites.cache
            };

            // Kullanıcıya bilgi ver
            await interaction.reply({ content: '💣 Kanal siliniyor...', ephemeral: true });

            try {
                // Kanalı sil
                await channel.delete('Nuke komutu kullanıldı');

                // Yeni kanal oluştur
                const newChannel = await interaction.guild?.channels.create({
                    name: channelInfo.name,
                    type: ChannelType.GuildText,
                    topic: channelInfo.topic ?? undefined,
                    nsfw: channelInfo.nsfw,
                    rateLimitPerUser: channelInfo.rateLimitPerUser,
                    parent: channelInfo.parent,
                    position: channelInfo.position,
                    permissionOverwrites: Array.from(channelInfo.permissionOverwrites.values())
                });

                if (!newChannel) {
                    throw new Error('Kanal oluşturulamadı!');
                }

                // Başarı mesajını yeni kanalda gönder
                await newChannel.send({
                    content: `💥 Kanal başarıyla nuke'landı!\n> 🛠️ Komut Kullanan: ${interaction.user.tag}`
                });

            } catch (error) {
                console.error('Nuke komutu hatası:', error);
                if (interaction.replied) {
                    await interaction.followUp({ 
                        content: '❌ Kanal silinirken veya yeniden oluşturulurken bir hata oluştu!', 
                        ephemeral: true 
                    });
                }
            }

        } catch (error) {
            console.error('Nuke komutu hatası:', error);
            const errorMessage = error instanceof Error ? error.message : 'Bilinmeyen bir hata oluştu!';
            if (!interaction.replied) {
                await interaction.reply({ 
                    content: `❌ Bir hata oluştu: ${errorMessage}`, 
                    ephemeral: true 
                });
            }
        }
    }
};

export default command; 