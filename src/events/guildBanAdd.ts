import { Events, GuildBan, Client } from 'discord.js';
import { logModeration } from '../utils/logModeration';

export default {
    name: Events.GuildBanAdd,
    once: false,
    async execute(ban: GuildBan, client: Client) {
        try {
            const { guild, user } = ban;
            // Audit log ile banı atanı bul
            const fetchedLogs = await guild.fetchAuditLogs({ type: 22, limit: 1 }); // 22: MEMBER_BAN_ADD
            const banLog = fetchedLogs.entries.first();
            let moderator = null;
            let reason = undefined;
            if (banLog && banLog.target.id === user.id) {
                moderator = banLog.executor;
                reason = banLog.reason || undefined;
            }
            await logModeration({
                guild,
                action: 'ban',
                target: user,
                moderator,
                reason
            });
        } catch (err) {
            // ! Hata logu
            console.error('guildBanAdd event log hatası:', err);
        }
    }
}; 