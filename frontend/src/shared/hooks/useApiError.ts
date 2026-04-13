import type { ApiError } from "@/api/http";

export function useApiError() {
    function getMessage(error: unknown): string {
        const e = error as ApiError;

        if (!e) return "Unknown error";

        switch (e.status) {
            case 400:
                return e.message || "Validation error";
            case 404:
                return "Resource not found";
            case 409:
                return "Concurrent modification detected";
            case 500:
                return "Internal server error";
            case 0:
                return "Network error. Backend unreachable.";
            default:
                return e.message || "Unexpected error";
        }
    }

    return { getMessage };
}