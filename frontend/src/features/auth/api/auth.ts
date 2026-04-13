const BASE = "http://localhost:8080/auth/api/auth";

function getToken(): string | null { return localStorage.getItem("token"); }
function setToken(token: string) { localStorage.setItem("token", token); }
function clearToken() { localStorage.removeItem("token"); localStorage.removeItem("userId"); }

async function http<T>(url: string, options?: RequestInit): Promise<T> {
    const res = await fetch(url, options);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.message || `Erreur ${res.status}`);
    return data as T;
}

function authHeaders(): HeadersInit {
    return { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` };
}

export type AuthResponse = { token: string };
export type MeDTO = {
    id: number; email: string; nom: string; role: string;
    subscriptionCode?: string; subscriptionName?: string;
    weeklyQuota?: number; allow2v2?: boolean; subscriptionValidUntil?: string;
};

export async function apiRegister(email: string, password: string, nom: string): Promise<{ id: number } & MeDTO> {
    const [firstName, ...rest] = nom.trim().split(" ");
    const lastName = rest.join(" ") || ".";
    const data = await http<AuthResponse>(`${BASE}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, firstName, lastName }),
    });
    setToken(data.token);
    const payload = JSON.parse(atob(data.token.split(".")[1]));
    const userId = Number(payload.sub);
    localStorage.setItem("userId", String(userId));
    const me = await apiMe(userId);
    return { ...me, id: userId };
}

export async function apiLogin(email: string, password: string): Promise<{ userId: number }> {
    const data = await http<AuthResponse>(`${BASE}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
    });
    setToken(data.token);
    const payload = JSON.parse(atob(data.token.split(".")[1]));
    const userId = Number(payload.sub);
    localStorage.setItem("userId", String(userId));
    return { userId };
}

export async function apiMe(userId: number): Promise<MeDTO> {
    return http<MeDTO>(`${BASE}/me/${userId}`, { headers: authHeaders() });
}

export async function apiUpdateProfile(userId: number, data: { firstName?: string; lastName?: string; email?: string }): Promise<MeDTO> {
    await http(`${BASE}/update/${userId}`, {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify(data),
    });
    return apiMe(userId);
}

export async function apiChangePassword(userId: number, currentPassword: string, newPassword: string): Promise<void> {
    await http(`${BASE}/change-password/${userId}`, {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify({ currentPassword, newPassword }),
    });
}

export function apiLogout() { clearToken(); }