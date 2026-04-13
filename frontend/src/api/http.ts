import axios from "axios";

export interface BackendError {
    message: string;
    error: string;
    timestamp: string;
}

export interface ApiError {
    status: number;
    message: string;
    error?: string;
    timestamp?: string;
}

export const http = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
    headers: {
        "Content-Type": "application/json",
    },
});

// ─── Ajoute le token JWT automatiquement ──────────────────
http.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// ─── Gestion des erreurs ──────────────────────────────────
http.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response) {
            const data = error.response.data as BackendError;
            const apiError: ApiError = {
                status: error.response.status,
                message: data?.message || "Unexpected server error",
                error: data?.error,
                timestamp: data?.timestamp,
            };
            return Promise.reject(apiError);
        }
        return Promise.reject({
            status: 0,
            message: "Network error or server unavailable",
        } as ApiError);
    }
);