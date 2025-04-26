import { Events, Role, Client } from 'discord.js';
import { logModeration } from '../utils/logModeration';

export default {
    name: 'roleUpdate',
    once: false,
    async execute(oldRole: Role, newRole: Role, client: Client) {
        try {
            if (oldRole.name === newRole.name) return;
            await logModeration({
                guild: newRole.guild,
                action: 'roleUpdate',
                target: newRole,
                oldValue: oldRole.name,
                newValue: newRole.name,
                moderator: null
            });
        } catch (err) {
            console.error('roleUpdate event log hatası:', err);
        }
    }
}; 