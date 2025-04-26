import { 
    ChatInputCommandInteraction, 
    SlashCommandBuilder, 
    SlashCommandOptionsOnlyBuilder
} from 'discord.js';

export interface Command {
    data: SlashCommandBuilder | SlashCommandOptionsOnlyBuilder;
    execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
    cooldown?: number; // Komut kullanım sınırı (saniye)
}

export interface CommandModule {
    default: Command;
} 