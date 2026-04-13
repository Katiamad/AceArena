const KEY = "tennis_userId";

export function setUserId(userId: number) {
    localStorage.setItem(KEY, String(userId));
}

export function getUserId(): number | null {
    const v = localStorage.getItem(KEY);
    if (!v) return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
}

export function clearUserId() {
    localStorage.removeItem(KEY);
}