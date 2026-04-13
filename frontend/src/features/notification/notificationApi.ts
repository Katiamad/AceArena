import { http } from "@/api/http";

export interface Notification {
    id: string;
    userId: number;
    title: string;
    message: string;
    type: string;
    createdAt: string;
    read: boolean;
}

export const NotificationApi = {

    findByUser: async (userId: number): Promise<Notification[]> => {
        const { data } = await http.get(`/notification/notifications/user/${userId}`);
        return data;
    },

    markAsRead: async (id: string): Promise<void> => {
        await http.post(`/notification/notifications/${id}/read`);
    },

    notifyMe: async (equipmentId: number): Promise<void> => {
        await http.post(`/equipment/api/equipments/${equipmentId}/notify-me`);
    },
};