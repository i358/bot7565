import { Events, Role, Client } from 'discord.js';
import { logModeration } from '../utils/logModeration';

export default {
    name: Events.RoleCreate,
    once: false,
    async execute(role: Role, client: Client) {
        try {
            await logModeration({
                guild: role.guild,
                action: 'roleCreate',
                target: role,
                moderator: null
            });
        } catch (err) {
            console.error('roleCreate event log hatası:', err);
        }
    }
}; 