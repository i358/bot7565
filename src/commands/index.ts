import { 
    Client, 
    Collection, 
    REST, 
    Routes,
    Events,
    ChatInputCommandInteraction,
    ApplicationCommandType,
    Interaction,
    CommandInteraction
} from 'discord.js';
import { Command } from './types';
import path from 'path';
import fs from 'fs';

// Command collection
export const commands = new Collection<string, Command>();
// Collection for cooldown tracking
const cooldowns = new Collection<string, Collection<string, number>>();

export async function loadCommands() {
    const commandsPath = path.join(__dirname);
    const commandFiles = fs.readdirSync(commandsPath)
        .filter(file => (file.endsWith('.ts') || file.endsWith('.js')) && !file.includes('index') && !file.includes('types'));

    console.log('Loading commands:', commandFiles);

    for (const file of commandFiles) {
        try {
            const filePath = path.join(commandsPath, file);
            const command = (await import(filePath)).default as Command;

            if ('data' in command && 'execute' in command) {
                commands.set(command.data.name, command);
                console.log(`Loaded command: ${command.data.name}`);
            } else {
                console.warn(`Command at ${file} is missing required properties`);
            }
        } catch (error) {
            console.error(`Error loading command from ${file}:`, error);
        }
    }
}

export async function registerCommands(client: Client) {
    if (!client.user || !client.application) {
        console.error('Client user or application is null');
        return;
    }

    const guildId = process.env.GUILD_ID;
    if (!guildId) {
        console.error('GUILD_ID is not set in .env file');
        return;
    }

    try {
        const rest = new REST().setToken(process.env.TOKEN || '');
        const commandData = Array.from(commands.values()).map(cmd => cmd.data.toJSON());

        // Mevcut komutları al
        const existingCommands = await rest.get(
            Routes.applicationGuildCommands(client.application.id, guildId)
        ) as any[];

        // Komutları karşılaştır
        const hasChanges = commandsAreDifferent(existingCommands, commandData);

        if (hasChanges) {
            console.log(`Değişiklik tespit edildi. ${commands.size} komut güncelleniyor...`);
            
            // Komutları güncelle
            await rest.put(
                Routes.applicationGuildCommands(client.application.id, guildId),
                { body: commandData }
            );

            console.log(`${commands.size} komut başarıyla güncellendi.`);
        } else {
            console.log('Komutlarda değişiklik yok, güncelleme yapılmadı.');
        }
    } catch (error) {
        console.error('Komutlar kaydedilirken hata:', error);
    }
}

// Komutları karşılaştır
function commandsAreDifferent(existing: any[], newCommands: any[]): boolean {
    if (existing.length !== newCommands.length) {
        return true;
    }

    const sortedExisting = [...existing].sort((a, b) => a.name.localeCompare(b.name));
    const sortedNew = [...newCommands].sort((a, b) => a.name.localeCompare(b.name));

    for (let i = 0; i < sortedExisting.length; i++) {
        const existingCmd = sortedExisting[i];
        const newCmd = sortedNew[i];

        // İsim kontrolü
        if (existingCmd.name !== newCmd.name) {
            return true;
        }

        // Açıklama kontrolü
        if (existingCmd.description !== newCmd.description) {
            return true;
        }

        // Seçenek sayısı kontrolü
        if ((existingCmd.options?.length || 0) !== (newCmd.options?.length || 0)) {
            return true;
        }

        // Seçenek detayları kontrolü
        if (existingCmd.options && newCmd.options) {
            for (let j = 0; j < existingCmd.options.length; j++) {
                const existingOpt = existingCmd.options[j];
                const newOpt = newCmd.options[j];

                if (existingOpt.name !== newOpt.name ||
                    existingOpt.description !== newOpt.description ||
                    existingOpt.type !== newOpt.type ||
                    existingOpt.required !== newOpt.required) {
                    return true;
                }
            }
        }

        // Yetki kontrolü
        if (existingCmd.default_member_permissions !== newCmd.default_member_permissions) {
            return true;
        }
    }

    return false;
}

// Command handler
export async function handleCommand(interaction: Interaction) {
    if (!('commandName' in interaction) || !(interaction instanceof CommandInteraction)) return;
    
    // Block DM commands
    if (!interaction.guild) {
        await interaction.reply({ 
            content: 'Bir daha DM atarsan AKPLISIN',
            ephemeral: true 
        });
        return;
    }

    const command = commands.get(interaction.commandName);

    if (!command) {
        console.error(`No command matching ${interaction.commandName} was found.`);
        return;
    }

    // Cooldown check
    if (command.cooldown) {
        if (!cooldowns.has(command.data.name)) {
            cooldowns.set(command.data.name, new Collection());
        }

        const now = Date.now();
        const timestamps = cooldowns.get(command.data.name)!;
        const cooldownAmount = (command.cooldown) * 1000;
        const userId = interaction.user.id;

        if (timestamps.has(userId)) {
            const expirationTime = timestamps.get(userId)! + cooldownAmount;

            if (now < expirationTime) {
                const timeLeft = (expirationTime - now) / 1000;
                await interaction.reply({ 
                    content: `Please wait ${timeLeft.toFixed(1)} seconds before using this command again.`, 
                    ephemeral: true 
                });
                return;
            }
        }

        timestamps.set(userId, now);
        setTimeout(() => timestamps.delete(userId), cooldownAmount);
    }

    try {
        if (interaction instanceof ChatInputCommandInteraction) {
            await command.execute(interaction);
        }
    } catch (error) {
        console.error(`Error executing ${interaction.commandName}:`, error);
        const errorMessage = 'An error occurred while executing this command!';
        
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp({ content: errorMessage, ephemeral: true });
        } else {
            await interaction.reply({ content: errorMessage, ephemeral: true });
        }
    }
} 