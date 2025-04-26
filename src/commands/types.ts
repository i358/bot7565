import { 
    ChatInputCommandInteraction, 
    SlashCommandBuilder, 
    SlashCommandSubcommandsOnlyBuilder
} from 'discord.js';

export interface Command {
    data: Omit<SlashCommandBuilder, "addSubcommandGroup" | "addSubcommand">;
    execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
    cooldown?: number; // Komut kullanım sınırı (saniye)
}

export interface CommandModule {
    default: Command;
} 