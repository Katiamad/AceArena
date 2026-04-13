import axios from "axios";
import type { Payment } from "../types/payment.ts";

export const api = axios.create({
    baseURL: "http://localhost:8080",
    headers: {
        "Content-Type": "application/json",
    },
});

api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("token");
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

export const createPayment = async (payment: Payment): Promise<Payment> => {
    const response = await api.post<Payment>("/payment/api/payments", payment);
    return response.data;
};

export const processPayment = async (
    paymentId: number,
    cardNumber: string,
    cvv: string,
    expirationDate: string
): Promise<Payment> => {
    const response = await api.post<Payment>(
        `/payment/api/payments/${paymentId}/process`,
        { cardNumber, cvv, expirationDate }
    );
    return response.data;
};

export const getPaymentById = async (paymentId: number): Promise<Payment> => {
    const response = await api.get<Payment>(`/payment/api/payments/${paymentId}`);
    return response.data;
};