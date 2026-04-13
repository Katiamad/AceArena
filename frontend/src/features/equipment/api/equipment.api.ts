import { http } from "@/api/http";

import type {
    Equipment,
    EquipmentCreateRequest,
    EquipmentUpdateRequest,
} from "../types";

export const EquipmentApi = {

    // ==============================
    // GET ALL EQUIPMENTS
    // ==============================

    findAll: async (): Promise<Equipment[]> => {
        const { data } = await http.get("/equipment/api/equipments");
        return data;
    },

    findByClub: async (clubId: number): Promise<Equipment[]> => {
        const { data } = await http.get(`/equipment/api/equipments/club/${clubId}`);
        return data;
    },

    findAvailableByClub: async (clubId: number): Promise<Equipment[]> => {
        const { data } = await http.get(
            `/equipment/api/equipments/club/${clubId}/available`
        );
        return data;
    },

    // ==============================
    // CREATE EQUIPMENT
    // ==============================

    create: async (
        payload: EquipmentCreateRequest
    ): Promise<Equipment> => {
        const { data } = await http.post("/equipment/api/equipments", payload);
        return data;
    },

    // ==============================
    // UPDATE EQUIPMENT
    // ==============================

    update: async (
        id: number,
        payload: EquipmentUpdateRequest
    ): Promise<Equipment> => {
        const { data } = await http.put(
            `/equipment/api/equipments/${id}`,
            payload
        );
        return data;
    },

};