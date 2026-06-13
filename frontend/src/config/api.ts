export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export const apiClient = {
    async aiQuery(payload: any) {
        const response = await fetch(`${API_BASE_URL}/api/clinimax-ai`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        return response.json();
    }
};