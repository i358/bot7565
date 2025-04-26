import { Events, GuildMember, Client, TextChannel } from 'discord.js';
import { logModeration } from '../utils/logModeration';

export default {
    name: Events.GuildMemberAdd,
    once: false,
    async execute(member: GuildMember, client: Client) {
        try {
            const { guild } = member;
            const welcomeChannelId = process.env.WELCOME_CHANNEL_ID;
            if (welcomeChannelId) {
                const channel = guild.channels.cache.get(welcomeChannelId) as TextChannel;
                if (channel && channel.type === 0) {
                    await channel.send({ content: `${member} sunucuya katıldı, hoş geldin!` });
                }
            }
            const memberRoleId = process.env.MEMBER_ROLE_ID;
            if (memberRoleId) {
                try {
                    await member.roles.add(memberRoleId);
                    console.log(`[guildMemberAdd] ${member.user.tag} kullanıcısına rol verildi.`);
                } catch (err) {
                    console.error('Yeni üyeye rol verilemedi:', err);
                    // Log kanalına da bildir
                    await logModeration({
                        guild,
                        action: 'roleAddError',
                        target: member,
                        reason: `Rol verilemedi: ${err}`
                    });
                }
            } else {
                console.warn('MEMBER_ROLE_ID .env dosyasında tanımlı değil!');
            }
        } catch (err) {
            // ! Hata logu
            console.error('guildMemberAdd event hoş geldin mesajı hatası:', err);
        }
    }
}; 