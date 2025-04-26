import { Events, Role, Client } from 'discord.js';
import { logModeration } from '../utils/logModeration';

export default {
    name: 'roleDelete',
    once: false,
    async execute(role: Role, client: Client) {
        try {
            await logModeration({
                guild: role.guild,
                action: 'roleDelete',
                target: role,
                moderator: null
            });
        } catch (err) {
            console.error('roleDelete event log hatası:', err);
        }
    }
}; 