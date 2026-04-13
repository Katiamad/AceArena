import { http } from "@/api/http";
import {mockMatches} from "@/features/match/mock/matches.ts";

// ✔ OK : correspond à @GetMapping("/available")
export const getAvailableMatches = () =>
    http.get("/match/api/matchs/available");


export const createMatch = (data: { bookingId: any; userId: any; matchType: any; totalCourtPrice: any; }) =>
    http.post("/match/api/matchs/initiate", {
        matchType: data.matchType,          // "1vs1" ou "2vs2"
        totalCourtPrice: Number(data.totalCourtPrice),
        ownerUserId: data.userId,
        userId: data.userId,                // mock
        bookingId: data.bookingId           // mock
    });

/*export const getAllMatches = () =>
    http.get("/match/api/matchs/details");*/

export const getAllMatches = async () => {
        return {
                data: mockMatches
        };
};

/*// ✔ OK : correspond à @PostMapping("/{matchId}/join")
export const joinMatch = (matchId: string, userId: String) =>
    http.post(`/match/api/matchs/${matchId}/join?userId=${userId}`);

export const leaveMatch = (matchId: string, userId: string) =>
    http.post(`/match/api/matchs/${matchId}/leave?userId=${userId}`);

export const cancelMatch = (matchId: string, ownerId: string) =>
    http.delete(`/match/api/matchs/${matchId}/cancel?ownerId=${ownerId}`);
*/

export const joinMatch = async (matchId: string, userId: string) => {
        console.log("MOCK joinMatch", matchId, userId);
        return { success: true };
};

export const leaveMatch = async (matchId: string, userId: string) => {
        console.log("MOCK leaveMatch", matchId, userId);
        return { success: true };
};

export const cancelMatch = async (matchId: string, ownerId: string) => {
        console.log("MOCK cancelMatch", matchId, ownerId);
        return { success: true };
};
