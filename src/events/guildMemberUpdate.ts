import { Events, GuildMember, Client } from 'discord.js';
import { logModeration } from '../utils/logModeration';

export default {
    name: Events.GuildMemberUpdate,
    once: false,
    async execute(oldMember: GuildMember, newMember: GuildMember, client: Client) {
        try {
            // Timeout başlatıldı mı?
            if (!oldMember.communicationDisabledUntil && newMember.communicationDisabledUntil) {
                // Audit log ile yetkiliyi bul
                const fetchedLogs = await newMember.guild.fetchAuditLogs({ type: 24, limit: 1 }); // 24: MEMBER_UPDATE
                const timeoutLog = fetchedLogs.entries.first();
                let moderator = null;
                let reason = undefined;
                if (timeoutLog && timeoutLog.target.id === newMember.id) {
                    moderator = timeoutLog.executor;
                    reason = timeoutLog.reason || undefined;
                }
                // Timeout süresi dakika cinsinden
                const duration = Math.round((newMember.communicationDisabledUntil.getTime() - Date.now()) / 60000);
                await logModeration({
                    guild: newMember.guild,
                    action: 'timeout',
                    target: newMember,
                    moderator,
                    reason,
                    duration
                });
            }
            // Timeout kaldırıldı mı?
            else if (oldMember.communicationDisabledUntil && !newMember.communicationDisabledUntil) {
                await logModeration({
                    guild: newMember.guild,
                    action: 'untimeout',
                    target: newMember
                });
            }
        } catch (err) {
            // ! Hata logu
            console.error('guildMemberUpdate event log hatası:', err);
        }
    }
}; 