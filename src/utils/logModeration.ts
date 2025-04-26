import { Client, Guild, GuildMember, TextChannel, User, EmbedBuilder, Channel, Role, Message, VoiceState, CategoryChannel, OverwriteResolvable } from 'discord.js';

interface LogOptions {
    guild: Guild;
    action: string;
    target?: User | GuildMember | Channel | Role | Message | VoiceState;
    moderator?: User | GuildMember | null;
    reason?: string;
    duration?: number;
    durationUnit?: 'saniye' | 'dakika';
    oldValue?: string;
    newValue?: string;
    extraFields?: { name: string, value: string, inline?: boolean }[];
}

export async function logModeration({ guild, action, target, moderator, reason, duration, durationUnit, oldValue, newValue, extraFields }: LogOptions) {
    const logChannelId = process.env.LOG_CHANNEL_ID;
    if (!logChannelId) return;
    const channel = guild.channels.cache.get(logChannelId) as TextChannel;
    if (!channel || channel.type !== 0) return;

    let color = 0x5865F2;
    let title = '';
    let fields = [];

    // Olay türüne göre başlık ve renk
    switch (action) {
        case 'ban':
            color = 0xFF0000; title = '🔨 Kullanıcı Yasaklandı'; break;
        case 'kick':
            color = 0xFF9900; title = '🚫 Kullanıcı Atıldı'; break;
        case 'timeout':
            color = 0xFFA500; title = '🔇 Kullanıcı Susturuldu'; break;
        case 'unban':
            color = 0x00FF00; title = '🟢 Kullanıcı Yasağı Kaldırıldı'; break;
        case 'untimeout':
            color = 0x00FF00; title = '🟢 Kullanıcı Susturması Kaldırıldı'; break;
        case 'spam-timeout':
            color = 0xFFCC00; title = '🤖 Spam Timeout'; break;
        case 'messageDelete':
            color = 0xFF5555; title = '🗑️ Mesaj Silindi'; break;
        case 'messageUpdate':
            color = 0xFFD700; title = '✏️ Mesaj Düzenlendi'; break;
        case 'channelCreate':
            color = 0x00FFCC; title = '📢 Kanal Oluşturuldu'; break;
        case 'channelDelete':
            color = 0xFF5555; title = '📛 Kanal Silindi'; break;
        case 'channelUpdate':
            color = 0xFFD700; title = '🔧 Kanal Güncellendi'; break;
        case 'roleCreate':
            color = 0x00FFCC; title = '🔵 Rol Oluşturuldu'; break;
        case 'roleDelete':
            color = 0xFF5555; title = '🔴 Rol Silindi'; break;
        case 'roleUpdate':
            color = 0xFFD700; title = '🟡 Rol Güncellendi'; break;
        case 'guildUpdate':
            color = 0x00BFFF; title = '🏷️ Sunucu Güncellendi'; break;
        case 'voiceJoin':
            color = 0x00FFCC; title = '🔊 Ses Kanalına Katıldı'; break;
        case 'voiceLeave':
            color = 0xFF5555; title = '🔇 Ses Kanalından Ayrıldı'; break;
        case 'voiceMove':
            color = 0xFFD700; title = '🔄 Ses Kanalı Değiştirdi'; break;
        default:
            color = 0x5865F2; title = `📋 ${action}`; break;
    }

    if (target) {
        let value = '';
        if ('user' in target) value = `${target} (${target.user.tag})`;
        else if ('tag' in target) value = `${target} (${target.tag})`;
        else if ('name' in target) value = `${target} (${target.name})`;
        else value = `${target}`;
        fields.push({ name: 'Hedef', value, inline: true });
        if ('id' in target) fields.push({ name: 'ID', value: target.id, inline: true });
        // Kanal detayları
        if ('type' in target && 'name' in target) {
            fields.push({ name: 'Kanal Türü', value: String(target.type), inline: true });
            if ('parent' in target && target.parent) fields.push({ name: 'Kategori', value: target.parent.name, inline: true });
        }
        // Rol detayları
        if ('color' in target && 'permissions' in target) {
            fields.push({ name: 'Rol Rengi', value: `#${target.color.toString(16)}`, inline: true });
            fields.push({ name: 'İzinler', value: target.permissions.toArray().join(', ') || 'Yok', inline: false });
        }
    }
    if (moderator) fields.push({ name: 'Yetkili', value: `${moderator}`, inline: true });
    if (reason) fields.push({ name: 'Sebep', value: reason });
    if (duration) fields.push({ name: 'Süre', value: `${duration} ${durationUnit || 'dakika'}`, inline: true });
    if (oldValue) fields.push({ name: 'Önceki', value: oldValue });
    if (newValue) fields.push({ name: 'Yeni', value: newValue });
    if (extraFields) fields.push(...extraFields);

    const embed = new EmbedBuilder()
        .setColor(color)
        .setTitle(title)
        .addFields(fields)
        .setTimestamp();

    await channel.send({ embeds: [embed] });
} 