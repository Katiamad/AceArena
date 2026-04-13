import { http } from "@/api/http";
import type { RentalCreateRequest, RentalResponse } from "../types";

export const RentalApi = {
    findAll: async (): Promise<RentalResponse[]> => {
        const { data } = await http.get("/equipment/api/rentals");
        return data;
    },

    create: async (payload: RentalCreateRequest): Promise<RentalResponse> => {
        const { data } = await http.post("/equipment/api/rentals", payload);
        return data;
    },

    cancel: async (id: number): Promise<RentalResponse> => {
        const { data } = await http.post(`/equipment/api/rentals/${id}/cancel`);
        return data;
    },

    returnRental: async (id: number) => {
        const { data } = await http.post(`/equipment/api/rentals/${id}/return`);
        return data;
    },

    findMy: async (): Promise<RentalResponse[]> => {
        const { data } = await http.get("/equipment/api/rentals/my");
        return data;
    },
};