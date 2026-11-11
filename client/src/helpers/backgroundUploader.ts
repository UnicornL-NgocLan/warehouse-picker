import { uploadMultipleImagesToDropBox } from './dropboxUpload';
import { pickingService } from '../services/pickingService';

export interface BackgroundImageTask {
  pickingId: number;
  lineId?: number;
  productName: string;
  images: string[]; // base64 dataUrls
  oldRecord?: {
    qty?: number;
    lot?: string;
    location?: string;
    locationDest?: string;
  };
  newRecord?: {
    qty?: number;
    lot?: string;
    location?: string;
    locationDest?: string;
  };
  uom?: string;
  actionType?: 'update' | 'images_only';
}

/**
 * Đưa tác vụ tải ảnh và ghi log chatter vào background xử lý ngầm hoàn toàn.
 * Không làm block UI và không hiển thị popup notification lên màn hình.
 */
export function queueBackgroundUpload(task: BackgroundImageTask): void {
  if (!task.images || task.images.length === 0) return;

  // Tác vụ async chạy ngầm độc lập hoàn toàn
  (async () => {
    try {
      // 1. Tải ảnh lên Dropbox trong nền
      const imageUrls = await uploadMultipleImagesToDropBox(task.images);

      if (!imageUrls || imageUrls.length === 0) {
        return;
      }

      // 2. Ghi log chatter Odoo thông qua backend API
      await pickingService.logMoveLineChatter({
        pickingId: task.pickingId,
        lineId: task.lineId,
        productName: task.productName,
        oldRecord: task.oldRecord,
        newRecord: task.newRecord,
        uom: task.uom,
        imageUrls,
        actionType: task.actionType || 'update',
      });
    } catch (err: any) {
      console.error('Lỗi tải ảnh background:', err?.message || err);
    }
  })();
}
