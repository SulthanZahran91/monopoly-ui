export const logToServer = async (level: 'info' | 'error' | 'warn', message: string, data?: any) => {
    try {
        const timestamp = new Date().toISOString();
        // Use relative path so it goes through the Vite proxy
        await fetch('/api/logs', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                level,
                message,
                timestamp,
                data,
            }),
        });
    } catch (err) {
        // Fallback to console if server logging fails
        console.error('Failed to send log to server:', err);
    }
};
