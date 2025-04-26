export default {
    name: 'debug',
    execute: (info: string) => {
        // Discord.js debug bilgilerini göster (Gateway olayları vb.)
        if (info.includes('GUILD_CREATE') || info.includes('READY') || info.includes('CONNECTED')) {
            console.log(`[Discord Debug] ${info}`);
        }
    }
}; 