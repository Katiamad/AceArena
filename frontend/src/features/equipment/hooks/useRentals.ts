import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { RentalApi } from "../api/rental.api";
import type { RentalCreateRequest } from "../types";

export function useRentals() {
    const token = localStorage.getItem("token");
    return useQuery({
        queryKey: ["rentals", token],
        queryFn: RentalApi.findMy, // 👈 findMy au lieu de findAll
        enabled: !!token,
    });
}

export function useCreateRental() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: RentalCreateRequest) => RentalApi.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["rentals"] });
        },
    });
}

export function useCancelRental() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: number) => RentalApi.cancel(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["rentals"] });
        },
    });
}

export function useReturnRental() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: number) => RentalApi.returnRental(id),

        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ["rentals"],
            });

            queryClient.invalidateQueries({
                queryKey: ["equipments"],
            });
        },
    });
}