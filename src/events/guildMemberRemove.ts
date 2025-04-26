import { Events, GuildMember, Client, TextChannel } from 'discord.js';
import { logModeration } from '../utils/logModeration';

export default {
    name: Events.GuildMemberRemove,
    once: false,
    async execute(member: GuildMember, client: Client) {
        try {
            const { guild } = member;
            // Audit log ile kick mi ayrılma mı kontrol et
            const fetchedLogs = await guild.fetchAuditLogs({ type: 20, limit: 1 }); // 20: MEMBER_KICK
            const kickLog = fetchedLogs.entries.first();
            let isKick = false;
            let moderator = null;
            let reason = undefined;
            if (kickLog && kickLog.target && kickLog.target.id === member.id && Date.now() - kickLog.createdTimestamp < 5000) {
                isKick = true;
                moderator = kickLog.executor;
                reason = kickLog.reason || undefined;
            }
            if (isKick) {
                await logModeration({
                    guild,
                    action: 'kick',
                    target: member,
                    moderator,
                    reason
                });
            }
            // Güle güle mesajı
            const welcomeChannelId = process.env.WELCOME_CHANNEL_ID;
            if (welcomeChannelId) {
                const channel = guild.channels.cache.get(welcomeChannelId) as TextChannel;
                if (channel && channel.type === 0) {
                    await channel.send({ content: `${member} sunucudan ayrıldı, güle güle!` });
                }
            }
        } catch (err) {
            // ! Hata logu
            console.error('guildMemberRemove event log hatası:', err);
        }
    }
}; 