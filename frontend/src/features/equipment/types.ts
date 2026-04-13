export type EquipmentCategory = "RAQUETTE" | "BALLE" | "MACHINE";
export type EquipmentStatus = "ACTIVE" | "OUT_OF_SERVICE" | "MAINTENANCE";

export interface Equipment {
    id: number;
    clubId: number | null;
    name: string;
    category: EquipmentCategory;
    stockTotal: number;
    stockAvailable: number;
    status: EquipmentStatus;
    createdAt: string;
    updatedAt: string;
    version: number;   // 🔥 AJOUT IMPORTANT
}

export interface EquipmentCreateRequest {
    clubId?: number;
    name: string;
    category: EquipmentCategory;
    stockTotal: number;
    stockAvailable: number;
}

export interface EquipmentUpdateRequest {
    clubId?: number;
    name?: string;
    category?: EquipmentCategory;
    stockTotal?: number;
    stockAvailable?: number;
    status?: EquipmentStatus;
    version: number;
}

export type RentalStatus = "CREATED" | "CONFIRMED" | "CANCELED" | "RETURNED" | "PAID";

export interface RentalItemRequest {
    equipmentId: number;
    quantity: number;
}

export interface RentalCreateRequest {
    bookingId: number;
    userId: number;
    clubId?: number;
    items: RentalItemRequest[];
}

export interface RentalItemResponse {
    equipmentId: number;
    equipmentName: string;
    quantity: number;
}

export interface RentalResponse {
    id: number;
    bookingId: number;
    userId: number;
    clubId: number | null;
    status: RentalStatus;
    items: RentalItemResponse[];
    createdAt: string;
    updatedAt: string;
}