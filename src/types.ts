import { ClientEvents } from 'discord.js';

export interface BotEvent {
    name: keyof ClientEvents;
    once?: boolean;
    execute: (...args: any[]) => Promise<void> | void;
} 