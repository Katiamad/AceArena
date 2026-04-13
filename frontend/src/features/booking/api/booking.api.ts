import { http } from "@/api/http";
// @ts-ignore
// @ts-ignore
import type {
    Court,
    CreateCourtRequest,
    CreateSlotRequest} from '../types/booking.types';

export const bookingApi = {
    // --- Terrains (Courts) ---
    getCourts: async () => {
        // L'URL correspond à ton useEffect actuel
        const res = await http.get<Court[]>("booking/api/user/courts");
        return res.data;
    },

    createCourt: async (data: CreateCourtRequest) => {
        // On s'assure que le prix est bien un nombre avant l'envoi
        const payload = { ...data, pricePerHour: Number(data.pricePerHour) };
        const res = await http.post<Court>("booking/api/admin/courts", payload);
        return res.data;
    },

    deleteCourt: async (id: number) => {
        await http.delete(`booking/api/admin/courts/${id}`);
    },

    // --- Créneaux (Slots) ---
    createSlot: async (data: CreateSlotRequest) => {
        const res = await http.post("booking/api/admin/slots", {
            ...data,
            courtId: Number(data.courtId) // Sécurité injection type
        });
        return res.data;
    },

    deleteSlot: async (slotId: number) => {
        await http.delete(`booking/api/admin/slots/${slotId}`);
    }
};