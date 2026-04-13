import {
    useQuery,
    useMutation,
    useQueryClient,
} from "@tanstack/react-query";

import { EquipmentApi } from "../api/equipment.api";

import type {
    Equipment,
    EquipmentCreateRequest,
    EquipmentUpdateRequest,
} from "../types";


// ==============================
// GET ALL EQUIPMENTS
// ==============================

export function useEquipments() {
    const token = localStorage.getItem("token");

    return useQuery<Equipment[]>({
        queryKey: ["equipments", token], // 👈 recharge si le token change
        queryFn: EquipmentApi.findAll,
        enabled: !!token, // 👈 ne lance la requête que si un token existe
    });
}


// ==============================
// CREATE EQUIPMENT
// ==============================

export function useCreateEquipment() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: EquipmentCreateRequest) =>
            EquipmentApi.create(data),

        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ["equipments"],
            });
        },
    });
}


// ==============================
// UPDATE EQUIPMENT
// ==============================

export function useUpdateEquipment() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
                         id,
                         data,
                     }: {
            id: number;
            data: EquipmentUpdateRequest;
        }) => EquipmentApi.update(id, data),

        // ==============================
        // OPTIMISTIC UPDATE
        // ==============================

        onMutate: async ({ id, data }) => {

            await queryClient.cancelQueries({
                queryKey: ["equipments"],
            });

            const previous =
                queryClient.getQueryData<Equipment[]>(["equipments"]);

            queryClient.setQueryData<Equipment[]>(
                ["equipments"],
                (old) => {
                    if (!old) return old;

                    return old.map((e) => {
                        if (e.id !== id) return e;

                        return {
                            ...e,
                            stockTotal:
                                data.stockTotal !== undefined
                                    ? data.stockTotal
                                    : e.stockTotal,
                        };
                    });
                }
            );

            return { previous };
        },

        // ==============================
        // ROLLBACK IF ERROR
        // ==============================

        onError: (_err, _variables, context) => {
            if (context?.previous) {
                queryClient.setQueryData(
                    ["equipments"],
                    context.previous
                );
            }
        },

        // ==============================
        // REFETCH
        // ==============================

        onSettled: () => {
            queryClient.invalidateQueries({
                queryKey: ["equipments"],
            });
        },
    });
}