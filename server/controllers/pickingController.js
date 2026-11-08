import {
  searchReadPickings,
  getPickingMoves,
  getMoveLines,
  getLocations,
  getLots,
} from "../utils/getOdooUserData.js";
import {
  createMoveLine,
  updateMoveLine,
  deleteMoveLine,
} from "../utils/updateOdooUserData.js";

const parsePositiveInt = (val) => {
  const num = parseInt(val, 10);
  return !isNaN(num) && num > 0 ? num : null;
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

      const moves = await getPickingMoves(req.odoo, pickingId);
      return res.status(200).json({ data: moves });
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

      const { locationId, lotId, qtyDone, imageUrls } = req.body;
      const updateData = {};

      if (locationId !== undefined) {
        const locNum = parsePositiveInt(locationId);
        if (!locNum) {
          return res.status(400).json({ msg: "Địa điểm nguồn không hợp lệ" });
        }
        updateData.locationId = locNum;
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

      if (Object.keys(updateData).length === 0) {
        return res.status(400).json({ msg: "Không có thông tin nào để cập nhật" });
      }

      const updatedLine = await updateMoveLine(req.odoo, lineId, updateData);
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
};

