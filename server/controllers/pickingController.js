import {
  searchReadPickings,
  getPickingMoves,
  getMoveLines,
  getLocations,
  getLots,
  searchStorableProducts,
  getProductStockSummary,
  getProductStockReport,
} from "../utils/getOdooUserData.js";
import {
  createMoveLine,
  updateMoveLine,
  deleteMoveLine,
  logMoveLineChatter,
} from "../utils/updateOdooUserData.js";

const parsePositiveInt = (val) => {
  const num = parseInt(val, 10);
  return !isNaN(num) && num > 0 ? num : null;
};

// Server-side in-memory cache cho getPickingMoves
// key: pickingId (string) → { data, expiresAt }
const pickingMovesCache = new Map();
const PICKING_MOVES_TTL_MS = 8000; // 8 giây — đủ lâu để SWR pattern ở client không double-fetch

const getPickingMovesCached = async (odoo, pickingId) => {
  const cacheKey = String(pickingId);
  const cached = pickingMovesCache.get(cacheKey);
  if (cached && Date.now() < cached.expiresAt) {
    return cached.data;
  }
  const data = await getPickingMoves(odoo, pickingId);
  pickingMovesCache.set(cacheKey, { data, expiresAt: Date.now() + PICKING_MOVES_TTL_MS });
  return data;
};

// Xóa cache khi có thay đổi dữ liệu (create/update/delete move line)
const invalidatePickingMovesCache = (pickingId) => {
  if (pickingId) {
    pickingMovesCache.delete(String(pickingId));
  } else {
    pickingMovesCache.clear();
  }
};

export const pickingCtrl = {
  getPickings: async (req, res) => {
    try {
      const offset = parseInt(req.query.offset, 10) || 0;
      const limit = Math.min(parseInt(req.query.limit, 10) || 30, 100);
      const search = req.query.search || req.query.q || "";

      const domain = [["state", "not in", ["cancel", "done", "draft"]]];
      if (search && typeof search === "string" && search.trim()) {
        domain.push(["name", "ilike", search.trim()]);
      }
      const fields = ["name", "partner_id", "state"];

      const result = await searchReadPickings(req.odoo, domain, fields, offset, limit);
      return res.status(200).json({ data: result });
    } catch (error) {
      console.error("Error in getPickings:", error.message || error);
      return res.status(500).json({ msg: error.message || "Không thể lấy danh sách phiếu kho" });
    }
  },

  getPickingMoves: async (req, res) => {
    try {
      const pickingId = parsePositiveInt(req.params.id);
      if (!pickingId) {
        return res.status(400).json({ msg: "Mã phiếu kho không hợp lệ" });
      }

      const moves = await getPickingMovesCached(req.odoo, pickingId);
      if (moves && moves.autoCreatedLines) {
        invalidatePickingMovesCache(pickingId);
      }
      return res.status(200).json({
        data: moves,
        autoCreatedLines: Boolean(moves && moves.autoCreatedLines),
      });
    } catch (error) {
      console.error("Error in getPickingMoves:", error.message || error);
      return res.status(500).json({ msg: error.message || "Không thể lấy danh sách sản phẩm trong phiếu" });
    }
  },

  getMoveLines: async (req, res) => {
    try {
      const moveId = parsePositiveInt(req.params.id);
      if (!moveId) {
        return res.status(400).json({ msg: "Mã dòng điều chuyển không hợp lệ" });
      }

      const moveLines = await getMoveLines(req.odoo, moveId);
      return res.status(200).json({ data: moveLines });
    } catch (error) {
      console.error("Error in getMoveLines:", error.message || error);
      return res.status(500).json({ msg: error.message || "Không thể lấy danh sách dòng soạn hàng" });
    }
  },

  createMoveLine: async (req, res) => {
    try {
      const moveId = parsePositiveInt(req.params.moveId);
      if (!moveId) {
        return res.status(400).json({ msg: "Mã dòng điều chuyển không hợp lệ" });
      }

      const newLine = await createMoveLine(req.odoo, moveId);
      invalidatePickingMovesCache(); // Xóa cache sau khi tạo dòng mới
      return res.status(201).json({ data: newLine });
    } catch (error) {
      console.error("Error in createMoveLine:", error.message || error);
      return res.status(400).json({ msg: error.message || "Không thể tạo dòng soạn hàng" });
    }
  },

  updateMoveLine: async (req, res) => {
    try {
      const lineId = parsePositiveInt(req.params.id);
      if (!lineId) {
        return res.status(400).json({ msg: "Mã dòng soạn hàng không hợp lệ" });
      }

      const { locationId, locationDestId, lotId, qtyDone, imageUrls } = req.body;
      const updateData = {};

      if (locationId !== undefined) {
        const locNum = parsePositiveInt(locationId);
        if (!locNum) {
          return res.status(400).json({ msg: "Địa điểm nguồn không hợp lệ" });
        }
        updateData.locationId = locNum;
      }

      if (locationDestId !== undefined) {
        const locDestNum = parsePositiveInt(locationDestId);
        if (!locDestNum) {
          return res.status(400).json({ msg: "Địa điểm đích không hợp lệ" });
        }
        updateData.locationDestId = locDestNum;
      }

      if (lotId !== undefined) {
        if (lotId === null || lotId === false || lotId === 0 || lotId === "") {
          updateData.lotId = null;
        } else {
          const lNum = parsePositiveInt(lotId);
          if (!lNum) {
            return res.status(400).json({ msg: "Số lô không hợp lệ" });
          }
          updateData.lotId = lNum;
        }
      }

      if (qtyDone !== undefined) {
        let normalizedQty = qtyDone;
        if (typeof normalizedQty === "string") {
          normalizedQty = normalizedQty.trim().replace(",", ".");
        }
        const parsedQty = Number(normalizedQty);
        if (isNaN(parsedQty) || !isFinite(parsedQty) || parsedQty < 0) {
          return res.status(400).json({ msg: "Số lượng soạn phải là số hữu hạn lớn hơn hoặc bằng 0" });
        }
        updateData.qtyDone = parsedQty;
      }

      if (Array.isArray(imageUrls)) {
        updateData.imageUrls = imageUrls.filter((u) => typeof u === "string" && u.trim().length > 0);
      }

      if (req.body.skipChatter !== undefined) {
        updateData.skipChatter = Boolean(req.body.skipChatter);
      }

      if (Object.keys(updateData).length === 0) {
        return res.status(400).json({ msg: "Không có thông tin nào để cập nhật" });
      }

      const updatedLine = await updateMoveLine(req.odoo, lineId, updateData);
      invalidatePickingMovesCache(); // Xóa cache sau khi cập nhật dòng
      return res.status(200).json({ data: updatedLine });
    } catch (error) {
      console.error("Error in updateMoveLine:", error.message || error);
      return res.status(400).json({ msg: error.message || "Không thể cập nhật dòng soạn hàng" });
    }
  },

  deleteMoveLine: async (req, res) => {
    try {
      const lineId = parsePositiveInt(req.params.id);
      if (!lineId) {
        return res.status(400).json({ msg: "Mã dòng soạn hàng không hợp lệ" });
      }

      await deleteMoveLine(req.odoo, lineId);
      invalidatePickingMovesCache(); // Xóa cache sau khi xóa dòng
      return res.status(200).json({ data: true });
    } catch (error) {
      console.error("Error in deleteMoveLine:", error.message || error);
      return res.status(400).json({ msg: error.message || "Không thể xóa dòng soạn hàng" });
    }
  },

  getLocations: async (req, res) => {
    try {
      const q = typeof req.query.q === "string" ? req.query.q : "";
      const limit = Math.min(parseInt(req.query.limit, 10) || 50, 50);

      const locations = await getLocations(req.odoo, q, limit);
      return res.status(200).json({ data: locations });
    } catch (error) {
      console.error("Error in getLocations:", error.message || error);
      return res.status(500).json({ msg: error.message || "Không thể lấy danh sách địa điểm" });
    }
  },

  getLots: async (req, res) => {
    try {
      const productId = parsePositiveInt(req.query.product_id);
      if (!productId) {
        return res.status(400).json({ msg: "Thiếu thông tin sản phẩm (product_id)" });
      }

      const q = typeof req.query.q === "string" ? req.query.q : "";
      const limit = Math.min(parseInt(req.query.limit, 10) || 50, 50);

      const lots = await getLots(req.odoo, productId, q, limit);
      return res.status(200).json({ data: lots });
    } catch (error) {
      console.error("Error in getLots:", error.message || error);
      return res.status(500).json({ msg: error.message || "Không thể lấy danh sách số lô" });
    }
  },

  logMoveLineChatter: async (req, res) => {
    try {
      const {
        pickingId,
        lineId,
        productName,
        oldRecord,
        newRecord,
        uom,
        imageUrls,
        actionType,
      } = req.body;

      const parsedPickingId = parsePositiveInt(pickingId);
      if (!parsedPickingId) {
        return res.status(400).json({ msg: "Thiếu thông tin phiếu kho (pickingId)" });
      }

      // Trả về HTTP 200 ngay lập tức để không block client
      res.status(200).json({ data: true, msg: "Đã tiếp nhận yêu cầu ghi log chatter" });

      // Xử lý background ghi log chatter Odoo
      setImmediate(async () => {
        try {
          await logMoveLineChatter(req.odoo, {
            pickingId: parsedPickingId,
            lineId: parsePositiveInt(lineId),
            productName,
            oldRecord,
            newRecord,
            uom,
            imageUrls,
            actionType,
          });
        } catch (err) {
          console.error("Error in background logMoveLineChatter:", err?.message || err);
        }
      });
    } catch (error) {
      console.error("Error in logMoveLineChatter controller:", error.message || error);
      return res.status(500).json({ msg: error.message || "Không thể ghi log chatter" });
    }
  },

  searchStorableProducts: async (req, res) => {
    try {
      const q = req.query.search || req.query.q || "";
      const limit = parseInt(req.query.limit, 10) || 20;
      const data = await searchStorableProducts(req.odoo, q, limit);
      return res.status(200).json({ data });
    } catch (error) {
      console.error("Error in searchStorableProducts controller:", error.message || error);
      return res.status(500).json({ msg: error.message || "Không thể tìm kiếm sản phẩm" });
    }
  },

  getProductStockSummary: async (req, res) => {
    try {
      const productId = parsePositiveInt(req.params.productId);
      if (!productId) {
        return res.status(400).json({ msg: "Thiếu mã sản phẩm (productId)" });
      }

      let companyId = parsePositiveInt(req.query.companyId);
      if (!companyId && req.user && req.user[0] && req.user[0].company_id) {
        companyId = Array.isArray(req.user[0].company_id)
          ? req.user[0].company_id[0]
          : req.user[0].company_id;
      }

      const data = await getProductStockSummary(req.odoo, productId, companyId);
      return res.status(200).json({ data });
    } catch (error) {
      console.error("Error in getProductStockSummary controller:", error.message || error);
      return res.status(500).json({ msg: error.message || "Không thể lấy tổng tồn kho" });
    }
  },

  getProductStockReport: async (req, res) => {
    try {
      const productId = parsePositiveInt(req.params.productId);
      if (!productId) {
        return res.status(400).json({ msg: "Thiếu mã sản phẩm (productId)" });
      }

      let companyId = parsePositiveInt(req.query.companyId);
      if (!companyId && req.user && req.user[0] && req.user[0].company_id) {
        companyId = Array.isArray(req.user[0].company_id)
          ? req.user[0].company_id[0]
          : req.user[0].company_id;
      }

      const data = await getProductStockReport(req.odoo, productId, companyId);
      return res.status(200).json({ data });
    } catch (error) {
      console.error("Error in getProductStockReport controller:", error.message || error);
      return res.status(500).json({ msg: error.message || "Không thể lấy báo cáo tồn kho" });
    }
  },
};

