// ─── Entités ──────────────────────────────────────────────────────────────────

export interface Court {
    id: number;
    name: string;
    description?: string;
    pricePerHour: number;
    surface?: string;
    isAvailable: boolean;
    imageUrl?: string;
    location?: string;        // lien Google Maps
    timeSlots: TimeSlot[];
}

export interface TimeSlot {
    id: number;
    courtId: number;
    startTime: string;
    endTime: string;
    isBooked: boolean;
}

export interface BookingResponse {
    id: number;
    courtName: string;
    slotStartTime: string;
    slotEndTime: string;
    durationHours: number;
    totalPrice: number;
    status: string;
    mode: string;
    matchId?: number;
}

// ─── Requêtes ─────────────────────────────────────────────────────────────────

export interface CreateCourtRequest {
    name: string;
    description?: string;
    pricePerHour: number;
    surface?: string;
    imageUrl?: string;
    location?: string;
}

export interface CreateSlotRequest {
    courtId: number;
    startTime: string;
    endTime: string;
}

export interface CreateBookingRequest {
    courtId: number;
    timeSlotId: number;
    durationHours: number;
    mode: BookingMode;
}

// ─── Enums / Union types ──────────────────────────────────────────────────────

export type BookingMode = "SIMPLE" | "MATCH";
export type BookingStep = "courts" | "slots" | "confirm" | "success";