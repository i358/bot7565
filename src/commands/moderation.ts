import { 
    CommandInteraction, 
    SlashCommandBuilder, 
    PermissionFlagsBits,
    GuildMember,
    EmbedBuilder,
    ChatInputCommandInteraction
} from 'discord.js';
import { Command } from './types';
import { logModeration } from '../utils/logModeration';

// Kick komutu
const kickCommand: Command = {
    data: new SlashCommandBuilder()
        .setName('kick')
        .setDescription('Belirtilen kullanıcıyı sunucudan atar')
        .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)
        .addUserOption(option => 
            option.setName('kullanici')
                .setDescription('Atılacak kullanıcı')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('sebep')
                .setDescription('Atılma sebebi')
                .setRequired(false)),

    async execute(interaction: ChatInputCommandInteraction) {
        const target = interaction.options.getMember('kullanici') as GuildMember;
        const reason = interaction.options.getString('sebep') || 'Sebep belirtilmedi';

        if (!target) {
            await interaction.reply({ content: '❌ Kullanıcı bulunamadı!', ephemeral: true });
            return;
        }

        if (!target.kickable) {
            await interaction.reply({ 
                content: '❌ Bu kullanıcıyı atamıyorum! (Yetkim yetersiz veya kullanıcı benden üst rolde)', 
                ephemeral: true 
            });
            return;
        }

        try {
            await target.kick(reason);

            const embed = new EmbedBuilder()
                .setColor(0xFF0000)
                .setTitle('🚫 Kullanıcı Atıldı')
                .addFields(
                    { name: 'Kullanıcı', value: `${target.user.tag}`, inline: true },
                    { name: 'ID', value: target.id, inline: true },
                    { name: 'Sebep', value: reason }
                )
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });
            await logModeration({
                guild: interaction.guild!,
                action: 'kick',
                target: target,
                moderator: interaction.user,
                reason
            });
        } catch (error) {
            console.error('Kick komutu hatası:', error);
            await interaction.reply({ 
                content: '❌ Kullanıcı atılırken bir hata oluştu!', 
                ephemeral: true 
            });
        }
    },
    cooldown: 5
};

// Ban komutu
const banCommand: Command = {
    data: new SlashCommandBuilder()
        .setName('ban')
        .setDescription('Belirtilen kullanıcıyı sunucudan yasaklar')
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
        .addUserOption(option =>
            option.setName('kullanici')
                .setDescription('Yasaklanacak kullanıcı')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('sebep')
                .setDescription('Yasaklanma sebebi')
                .setRequired(false))
        .addNumberOption(option =>
            option.setName('gun')
                .setDescription('Mesaj geçmişinin kaç gün silineceği (0-7)')
                .setMinValue(0)
                .setMaxValue(7)
                .setRequired(false)),

    async execute(interaction: ChatInputCommandInteraction) {
        const target = interaction.options.getMember('kullanici') as GuildMember;
        const reason = interaction.options.getString('sebep') || 'Sebep belirtilmedi';
        const deleteMessageDays = interaction.options.getNumber('gun') || 0;

        if (!target) {
            await interaction.reply({ content: '❌ Kullanıcı bulunamadı!', ephemeral: true });
            return;
        }

        if (!target.bannable) {
            await interaction.reply({ 
                content: '❌ Bu kullanıcıyı yasaklayamıyorum! (Yetkim yetersiz veya kullanıcı benden üst rolde)', 
                ephemeral: true 
            });
            return;
        }

        try {
            await target.ban({ 
                deleteMessageDays: deleteMessageDays,
                reason: reason 
            });

            const embed = new EmbedBuilder()
                .setColor(0xFF0000)
                .setTitle('🔨 Kullanıcı Yasaklandı')
                .addFields(
                    { name: 'Kullanıcı', value: `${target.user.tag}`, inline: true },
                    { name: 'ID', value: target.id, inline: true },
                    { name: 'Sebep', value: reason },
                    { name: 'Silinen Mesaj Geçmişi', value: `${deleteMessageDays} gün`, inline: true }
                )
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });
            await logModeration({
                guild: interaction.guild!,
                action: 'ban',
                target: target,
                moderator: interaction.user,
                reason
            });
        } catch (error) {
            console.error('Ban komutu hatası:', error);
            await interaction.reply({ 
                content: '❌ Kullanıcı yasaklanırken bir hata oluştu!', 
                ephemeral: true 
            });
        }
    },
    cooldown: 5
};

// Timeout komutu
const timeoutCommand: Command = {
    data: new SlashCommandBuilder()
        .setName('timeout')
        .setDescription('Belirtilen kullanıcıyı geçici olarak susturur')
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
        .addUserOption(option =>
            option.setName('kullanici')
                .setDescription('Susturulacak kullanıcı')
                .setRequired(true))
        .addNumberOption(option =>
            option.setName('sure')
                .setDescription('Susturma süresi (dakika)')
                .setRequired(true)
                .setMinValue(1)
                .setMaxValue(40320)) // 28 gün (Discord limiti)
        .addStringOption(option =>
            option.setName('sebep')
                .setDescription('Susturulma sebebi')
                .setRequired(false)),

    async execute(interaction: ChatInputCommandInteraction) {
        const target = interaction.options.getMember('kullanici') as GuildMember;
        const duration = interaction.options.getNumber('sure') || 5;
        const reason = interaction.options.getString('sebep') || 'Sebep belirtilmedi';

        if (!target) {
            await interaction.reply({ content: '❌ Kullanıcı bulunamadı!', ephemeral: true });
            return;
        }

        if (!target.moderatable) {
            await interaction.reply({ 
                content: '❌ Bu kullanıcıyı susturamıyorum! (Yetkim yetersiz veya kullanıcı benden üst rolde)', 
                ephemeral: true 
            });
            return;
        }

        try {
            await target.timeout(duration * 60 * 1000, reason);

            const embed = new EmbedBuilder()
                .setColor(0xFFA500)
                .setTitle('🔇 Kullanıcı Susturuldu')
                .addFields(
                    { name: 'Kullanıcı', value: `${target.user.tag}`, inline: true },
                    { name: 'ID', value: target.id, inline: true },
                    { name: 'Süre', value: `${duration} dakika`, inline: true },
                    { name: 'Sebep', value: reason }
                )
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });
            await logModeration({
                guild: interaction.guild!,
                action: 'timeout',
                target: target,
                moderator: interaction.user,
                reason,
                duration
            });
        } catch (error) {
            console.error('Timeout komutu hatası:', error);
            await interaction.reply({ 
                content: '❌ Kullanıcı susturulurken bir hata oluştu!', 
                ephemeral: true 
            });
        }
    },
    cooldown: 5
};

// Komutları dışa aktar
export default [kickCommand, banCommand, timeoutCommand]; 