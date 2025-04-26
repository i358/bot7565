import express from 'express';
import { Client } from 'discord.js';

export function createServer(client: Client, port: number = 3000) {
    const app = express();
    let startTime = Date.now();

    app.get('/', (req, res) => {
        const uptime = Math.floor((Date.now() - startTime) / 1000); // saniye cinsinden
        res.json({
            status: 'ok',
            botStatus: client.isReady() ? 'online' : 'offline',
            uptime: `${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m ${uptime % 60}s`,
            timestamp: new Date().toISOString()
        });
    });

    // 404 handler
    app.use((req, res) => {
        res.status(404).json({ error: 'Not found' });
    });

    // Error handler
    app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
        console.error('Server error:', err);
        res.status(500).json({ error: 'Internal server error' });
    });

    const server = app.listen(port, () => {
        console.log(`HTTP server listening on port ${port}`);
    });

    return server;
} 