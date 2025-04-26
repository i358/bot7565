import { 
    Client, 
    GatewayIntentBits, 
    Events, 
    Interaction, 
    CommandInteraction, 
    ActivityType,
    PresenceStatusData,
    Message,
    Partials,
    Collection
} from 'discord.js';
import dotenv from 'dotenv';
import { loadEvents } from './events';
import { loadCommands, registerCommands, handleCommand, commands } from './commands';
import moderationCommands from './commands/moderation';
import { createServer } from './server';
import { joinVoiceChannel, VoiceConnectionStatus, entersState } from '@discordjs/voice';

dotenv.config();

// HTTP server port
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

console.log('Starting bot...');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildPresences,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.DirectMessageReactions,
        GatewayIntentBits.DirectMessageTyping
    ],
    partials: [
        Partials.Message,
        Partials.Channel,
        Partials.Reaction
    ]
});

let isReady = false;

// Block DM messages and commands
client.on(Events.MessageCreate, async (message: Message) => {
    if (!message.guild && message.author.id !== client.user?.id) {
        return;
    }
});

// Activities for rich presence rotation
const activities = [
    {
        type: ActivityType.Watching,
        name: '👀 BIG BROTHER IS WATCHING YOU',
        status: 'idle' as PresenceStatusData
    },
    {
        type: ActivityType.Playing,
        name: '🛠️ Development',
        status: 'idle' as PresenceStatusData
    },
    {
        type: ActivityType.Listening,
        name: '📢 Server Updates',
        status: 'idle' as PresenceStatusData
    }
];

// Update presence every 8 seconds
function updatePresence() {
    if (!client.user) return;

    const activity = activities[Math.floor(Math.random() * activities.length)];
    
    client.user.setPresence({
        activities: [{
            name: activity.name,
            type: activity.type
        }],
        status: activity.status
    });
}

// Event listener for slash commands
client.on(Events.InteractionCreate, async (interaction: Interaction) => {
    if (!interaction.isChatInputCommand()) return;

    // Wait if bot is not ready
    if (!isReady) {
        await interaction.reply({ 
            content: 'Bot is still starting up, please wait a few seconds...',
            ephemeral: true 
        });
        return;
    }

    try {
        await handleCommand(interaction);
    } catch (error) {
        console.error('Error handling interaction:', error);
        try {
            const errorMessage = 'An error occurred, please try again.';
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({ content: errorMessage, ephemeral: true });
            } else {
                await interaction.followUp({ content: errorMessage, ephemeral: true });
            }
        } catch (e) {
            console.error('Error sending error message:', e);
        }
    }
});

// Voice channel ID - Bot sürekli bu kanalda bulunacak
const VOICE_CHANNEL_ID = process.env.VOICE_CHANNEL_ID || '';

// Ses kanalına bağlanma fonksiyonu
async function connectToVoiceChannel(client: Client) {
    try {
        const channel = await client.channels.fetch(VOICE_CHANNEL_ID);
        if (!channel || !channel.isVoiceBased()) {
            console.error('Ses kanalı bulunamadı veya ses kanalı değil!');
            return;
        }

        console.log(`Ses kanalına bağlanılıyor: ${channel.name}`);
        
        const connection = joinVoiceChannel({
            channelId: channel.id,
            guildId: channel.guild.id,
            adapterCreator: channel.guild.voiceAdapterCreator,
            selfDeaf: false,
            selfMute: true
        });

        // Bağlantı durumunu izle
        connection.on(VoiceConnectionStatus.Disconnected, async () => {
            console.log('Ses kanalından düştü, tekrar bağlanmaya çalışılıyor...');
            
            try {
                // Tekrar bağlanmaya çalış
                await Promise.race([
                    entersState(connection, VoiceConnectionStatus.Signalling, 5_000),
                    entersState(connection, VoiceConnectionStatus.Connecting, 5_000),
                ]);
                // Başarılı şekilde tekrar bağlanmaya çalışıyor
            } catch (error) {
                // Başarısız, bağlantıyı yok et ve yeni bağlantı kur
                connection.destroy();
                setTimeout(() => connectToVoiceChannel(client), 5000);
            }
        });

        connection.on(VoiceConnectionStatus.Ready, () => {
            console.log('Ses kanalına bağlandı!');
        });

        return connection;
    } catch (error) {
        console.error('Ses kanalına bağlanırken hata:', error);
        // 30 saniye sonra tekrar dene
        setTimeout(() => connectToVoiceChannel(client), 30000);
    }
}

async function init() {
    try {
        console.log('Loading commands...');
        await loadCommands();
        
        // Moderasyon komutlarını ekle
        console.log('Loading moderation commands...');
        moderationCommands.forEach(cmd => {
            console.log(`Adding moderation command: ${cmd.data.name}`);
            commands.set(cmd.data.name, cmd);
        });
        console.log(`Total commands loaded: ${commands.size}`);
        
        // Bot'u başlat
        console.log('Logging in...');
        await client.login(process.env.TOKEN);
        console.log('Successfully logged in');
        
        // Eventleri yükle
        console.log('Loading events...');
        await loadEvents(client);
        console.log('Events loaded.');
        
        // Tüm komutları kaydet
        console.log('Registering commands to Discord...');
        await registerCommands(client);
        console.log('Commands registered to Discord');
        
        // HTTP sunucusunu başlat
        createServer(client, PORT);
        
        // Ses kanalına bağlan
        await connectToVoiceChannel(client);
        
        // Durum güncellemelerini başlat
        updatePresence();
        setInterval(updatePresence, 8000);
        
        isReady = true;
        console.log('Bot is ready!');
    } catch (error) {
        console.error('Initialization error:', error);
        process.exit(1);
    }
}

// Global error handling
process.on('unhandledRejection', error => {
    console.error('Unhandled promise rejection:', error);
});

init();    