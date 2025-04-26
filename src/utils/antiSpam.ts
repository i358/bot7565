import { Message, GuildMember, TextChannel, Collection, PermissionFlagsBits } from 'discord.js';
import { logModeration } from './logModeration';

interface UserSpamData {
    messageCount: number;
    firstMessage: Date;
    lastMessage: Date;
    messages: string[];
    warned: boolean;
}

// Spam kontrolü için kullanıcı verileri
const userMap = new Collection<string, UserSpamData>();

// Ayarlar
const THRESHOLD = 8; // 10 mesaj
const TIME_WINDOW = 5000; // 5 saniye içinde
const TIMEOUT_DURATION = 20; // 20 saniye timeout

/**
 * Gelen mesajları spam için kontrol eder
 * @param message Kontrol edilecek mesaj
 * @returns Spam olup olmadığı
 */
export async function checkSpam(message: Message): Promise<boolean> {
    // Temel kontroller
    if (!message || !message.author) return false;
    
    // DM mesajlarını, bot mesajlarını ve webhook mesajlarını yoksay
    if (!message.guild || message.author.bot || message.webhookId) return false;
    
    const member = message.member;
    if (!member) return false;
    
    // Yöneticileri ve moderatörleri yoksay
    if (hasModeratorPermissions(member)) {
        console.log(`Moderatör tespit edildi, spam kontrolü atlanıyor: ${member.user.tag}`);
        return false;
    }
    
    const userId = message.author.id;
    const now = new Date();
    
    // Kullanıcı cache'te yoksa ekle
    if (!userMap.has(userId)) {
        console.log(`Yeni kullanıcı mesajı: ${message.author.tag}`);
        userMap.set(userId, {
            messageCount: 1,
            firstMessage: now,
            lastMessage: now,
            messages: [message.content.substring(0, 20)],
            warned: false
        });
        return false;
    }
    
    const userData = userMap.get(userId)!;
    
    // Son mesajdan bu yana geçen süre
    const timeDiff = now.getTime() - userData.firstMessage.getTime();
    
    // Görsel log
    console.log(`[Anti-Spam] ${message.author.tag}: ${userData.messageCount + 1} mesaj / ${(timeDiff / 1000).toFixed(1)} saniye`);
    
    // Belirlenen süreden fazla geçmişse sıfırla
    if (timeDiff > TIME_WINDOW) {
        console.log(`Süre aşıldı, sayaç sıfırlanıyor: ${message.author.tag}`);
        userData.messageCount = 1;
        userData.firstMessage = now;
        userData.lastMessage = now;
        userData.messages = [message.content.substring(0, 20)];
        userData.warned = false;
        return false;
    }
    
    // Son mesaj ile şu anki mesaj arasındaki süre
    const messageTimeDiff = now.getTime() - userData.lastMessage.getTime();
    
    // Çok hızlı mesaj gönderdiyse (25ms'den kısa) direkt spam kabul et
    if (userData.messageCount > 2 && messageTimeDiff < 25) {
        console.log(`Çok hızlı mesaj tespiti: ${message.author.tag}`);
        await timeoutUser(member, message.channel as TextChannel);
        userMap.delete(userId);
        return true;
    }
    
    // Mesaj sayısını artır ve kaydı güncelle
    userData.messageCount++;
    userData.lastMessage = now;
    userData.messages.push(message.content.substring(0, 20));
    
    // Eşik değere ulaşıldı mı kontrol et
    if (userData.messageCount >= THRESHOLD) {
        console.log(`Spam tespiti: ${message.author.tag} - ${userData.messageCount} mesaj / ${(timeDiff / 1000).toFixed(1)} saniye`);
        console.log(`Mesajlar: ${userData.messages.join(', ')}`);
        
        try {
            // Kullanıcıya timeout at
            await timeoutUser(member, message.channel as TextChannel);
            
            // Spam verilerini sıfırla
            userMap.delete(userId);
            return true;
        } catch (error) {
            console.error('Timeout uygulanırken beklenmeyen hata:', error);
            return false;
        }
    } 
    // Eşiğe yakın mı uyarı ver
    else if (userData.messageCount >= THRESHOLD - 1 && !userData.warned) {
        console.log(`Spam uyarısı: ${message.author.tag}`);
        try {
            await message.reply({
                content: `⚠️ **Spam algılandı!** Lütfen daha yavaş mesaj gönderin. Bir mesaj daha gönderirseniz geçici olarak susturulacaksınız.`,
                allowedMentions: { repliedUser: true }
            });
            
            userData.warned = true;
        } catch (error) {
            console.error('Uyarı mesajı gönderilirken hata:', error);
        }
    }
    
    return false;
}

/**
 * Kullanıcıya timeout atar
 * @param member Timeout atılacak üye
 * @param channel Bildirim gönderilecek kanal
 */
async function timeoutUser(member: GuildMember, channel: TextChannel) {
    try {
        // Bot'un yetkilerini kontrol et
        if (!channel.guild.members.me) {
            console.error('Bot bilgisi alınamadı');
            return;
        }
        
        if (!channel.guild.members.me.permissions.has(PermissionFlagsBits.ModerateMembers)) {
            console.error('Bot\'un ModerateMembers yetkisi yok!');
            await channel.send('⚠️ Spam tespit edildi ancak botun timeout yetkisi olmadığı için işlem gerçekleştirilemiyor.');
            return;
        }
        
        // Timeout süresi (ms cinsinden)
        const timeoutDurationMs = TIMEOUT_DURATION * 1000;
        
        console.log(`Timeout uygulanıyor: ${member.user.tag}`);
        
        // Timeout at
        await member.timeout(timeoutDurationMs, 'Spam yapma (Otomatik Moderasyon)');
        
        // Kanala bilgi mesajı gönder
        await channel.send({
            content: `🛑 ${member} spam yaptığı için ${TIMEOUT_DURATION} saniyeliğine susturuldu.`,
            allowedMentions: { users: [] }
        });
        
        // Log kanalına da bilgi gönder
        await logModeration({
            guild: channel.guild,
            action: 'spam-timeout',
            target: member,
            moderator: channel.guild.members.me.user,
            reason: 'Spam yapma (Otomatik Moderasyon)',
            duration: TIMEOUT_DURATION,
            durationUnit: 'saniye'
        });
        
        console.log(`Anti-Spam: ${member.user.tag} spam yaptığı için ${TIMEOUT_DURATION} saniyeliğine susturuldu.`);
    } catch (error) {
        console.error('Timeout uygulanırken hata:', error);
        throw error; // Üst fonksiyonda yakalanması için hatayı fırlat
    }
}

/**
 * Kullanıcının moderatör yetkilerine sahip olup olmadığını kontrol eder
 * @param member Kontrol edilecek üye
 * @returns Moderatör yetkisine sahip olup olmadığı
 */
function hasModeratorPermissions(member: GuildMember): boolean {
    return member.permissions.has(PermissionFlagsBits.KickMembers) || 
           member.permissions.has(PermissionFlagsBits.BanMembers) || 
           member.permissions.has(PermissionFlagsBits.ModerateMembers) ||
           member.permissions.has(PermissionFlagsBits.ManageMessages) || 
           member.permissions.has(PermissionFlagsBits.Administrator);
} 