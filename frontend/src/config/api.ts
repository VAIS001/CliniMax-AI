const normalizeBackendUrl = (value: string): string => value.trim().replace(/\/+$/, '');

const resolveApiBaseUrl = (): string => {
  const envUrl = typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_BACKEND_URL
    ? String(import.meta.env.VITE_BACKEND_URL)
    : '';

  if (envUrl) {
    return normalizeBackendUrl(envUrl);
  }

  if (typeof window !== 'undefined') {
    const storedUrl = localStorage.getItem('CLINIMAX_BACKEND_URL');
    if (storedUrl) {
      return normalizeBackendUrl(storedUrl);
    }
  }

  return 'http://127.0.0.1:8000';
};

export const API_BASE_URL = resolveApiBaseUrl();

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