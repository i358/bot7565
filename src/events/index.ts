import { Client } from 'discord.js';
import fs from 'fs';
import path from 'path';

/**
 * Loads all events from the events directory
 * @param client Discord.js client
 */
export async function loadEvents(client: Client) {
    console.log('=== [Event Loader] Başlatılıyor... ===');
    const eventsDir = path.join(__dirname);
    
    // Tüm .js ve .ts dosyalarını bul
    const eventFiles = fs.readdirSync(eventsDir)
        .filter(file => {
            const isIndexFile = file === 'index.js' || file === 'index.ts';
            const isEventFile = (file.endsWith('.js') || file.endsWith('.ts')) && !isIndexFile;
            
            if (isEventFile) {
                console.log(`[Event Loader] Yükleniyor: ${file}`);
                return true;
            }
            return false;
        });
    
    console.log(`[Event Loader] ${eventFiles.length} event dosyası bulundu.`);
    
    for (const file of eventFiles) {
        try {
            // Event modülünü dinamik olarak import et
            console.log(`[Event Loader] İçe aktarılıyor: ${file}`);
            const filePath = path.join(eventsDir, file);
            
            const event = await import(filePath)
                .then(module => module.default)
                .catch(err => {
                    console.error(`[Event Loader] Hata: ${file} dosyası içe aktarılamadı:`, err);
                    return null;
                });
            
            if (!event) {
                console.error(`[Event Loader] ${file} dosyasından event objesi alınamadı.`);
                continue;
            }
            
            // Event adını ve execute fonksiyonunu kontrol et
            if (!event.name) {
                console.error(`[Event Loader] Hata: ${file} dosyasında event adı bulunamadı.`);
                continue;
            }
            
            if (!event.execute || typeof event.execute !== 'function') {
                console.error(`[Event Loader] Hata: ${file} dosyasında execute fonksiyonu bulunamadı.`);
                continue;
            }
            
            // Event'i kaydet
            const eventName = event.name;
            const once = event.once || false;
            
            if (once) {
                console.log(`[Event Loader] Tek seferlik event kaydediliyor: ${eventName}`);
                client.once(eventName, (...args) => event.execute(...args, client));
            } else {
                console.log(`[Event Loader] Sürekli event kaydediliyor: ${eventName}`);
                client.on(eventName, (...args) => event.execute(...args, client));
            }
            
            console.log(`[Event Loader] Başarıyla kaydedildi: ${eventName} (${once ? 'once' : 'on'})`);
        } catch (error) {
            console.error(`[Event Loader] ${file} dosyası işlenirken hata:`, error);
        }
    }
    
    console.log('=== [Event Loader] Tüm eventler yüklendi ===');
} 