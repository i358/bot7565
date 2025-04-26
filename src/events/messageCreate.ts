import { Client, Message, Events } from 'discord.js';
import { checkSpam } from '../utils/antiSpam';

export default {
    name: Events.MessageCreate,
    once: false,
    execute: async (message: Message, client: Client) => {
        try {
            // Temel kontroller
            if (!message || !message.author) {
                console.log('[MessageCreate] Mesaj veya mesaj yazarı tanımlı değil');
                return;
            }

            // Debug log
            console.log(`[Event:messageCreate] Mesaj alındı: ${message.author.tag}: ${message.content.substring(0, 30)}${message.content.length > 30 ? '...' : ''}`);

            // Bot mesajlarını işleme
            if (message.author.bot) {
                console.log('[MessageCreate] Bot mesajı, işlem yapılmıyor');
                return;
            }

            // Spam kontrolü yap
            try {
                console.log('[MessageCreate] Spam kontrolü yapılıyor...');
                const isSpam = await checkSpam(message);
                console.log(`[MessageCreate] Spam kontrolü sonucu: ${isSpam ? 'SPAM ALGILANDI' : 'Normal mesaj'}`);
                
                if (isSpam) {
                    console.log(`[MessageCreate] Spam mesajı tespit edildi: ${message.id}`);
                    return;
                }
            } catch (error) {
                console.error('[MessageCreate] Spam kontrol fonksiyonunda beklenmedik hata:', error);
            }

            // Mesaj başarıyla işlendi
            console.log(`[MessageCreate] Mesaj başarıyla işlendi: ${message.id}`);
        } catch (error) {
            console.error('[MessageCreate] Beklenmeyen hata:', error);
        }
    }
}; 