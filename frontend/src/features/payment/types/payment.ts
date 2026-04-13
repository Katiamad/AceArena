export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED';

export interface Payment {
    id?: number;
    userId: number;
    bookingId?: number;
    matchId?: number;
    rentalId?: number;
    paymentType?: 'BOOKING' | 'MATCH' | 'EQUIPMENT';
    amount: number;
    currency: string;
    status?: PaymentStatus;
    paymentMethod?: string;
}
