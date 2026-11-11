import app from "../axiosConfig";
import {
  GetPickingsResponse,
  Move,
  MoveLine,
  Ref,
  UpdateMoveLinePayload,
  LogChatterPayload,
} from "../interface/picking";

export const pickingService = {
  getPickings: async (offset: number = 0, limit: number = 30, search: string = ''): Promise<GetPickingsResponse> => {
    const searchParam = search && search.trim() ? `&search=${encodeURIComponent(search.trim())}` : '';
    const response = await app.get(`/api/get-pickings?offset=${offset}&limit=${limit}${searchParam}`);
    return response.data.data;
  },

  getPickingMoves: async (pickingId: number): Promise<Move[]> => {
    const response = await app.get(`/api/get-picking-moves/${pickingId}`);
    return response.data.data;
  },

  getMoveLines: async (moveId: number): Promise<MoveLine[]> => {
    const response = await app.get(`/api/get-move-lines/${moveId}`);
    return response.data.data;
  },

  createMoveLine: async (moveId: number): Promise<MoveLine> => {
    const response = await app.post(`/api/create-move-line/${moveId}`);
    return response.data.data;
  },

  updateMoveLine: async (lineId: number, data: UpdateMoveLinePayload): Promise<MoveLine> => {
    const response = await app.patch(`/api/update-move-line/${lineId}`, data);
    return response.data.data;
  },

  deleteMoveLine: async (lineId: number): Promise<boolean> => {
    const response = await app.delete(`/api/delete-move-line/${lineId}`);
    return response.data.data;
  },

  logMoveLineChatter: async (data: LogChatterPayload): Promise<boolean> => {
    const response = await app.post('/api/log-move-line-chatter', data);
    return response.data.data;
  },

  getLocations: async (q: string = "", limit: number = 50): Promise<Ref[]> => {
    const response = await app.get(`/api/get-locations?q=${encodeURIComponent(q)}&limit=${limit}`);
    return response.data.data;
  },

  getLots: async (productId: number, q: string = "", limit: number = 50): Promise<Ref[]> => {
    const response = await app.get(`/api/get-lots?product_id=${productId}&q=${encodeURIComponent(q)}&limit=${limit}`);
    return response.data.data;
  },
};

