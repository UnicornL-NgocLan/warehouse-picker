import Odoo from "odoo-xmlrpc";
import { getUserData, getUserCompanies } from "../utils/getOdooUserData.js";
import { hangeChangeUserCompany } from "../utils/updateOdooUserData.js";
import { attachCookiesToResponse } from "../utils/jwtAttachmentAndCreation.js";
import { encrypt, decrypt } from "../utils/EnCryptAndDeCrypt.js";
import { isTokenValid } from "../utils/isTokenValid.js";
import Users from "../models/user.js";
import axios from "axios";

const connectOdoo = (odoo) => {
  return new Promise((resolve, reject) => {
    odoo.connect((err, uid) => {
      if (err) return reject(err);
      if (!uid) return reject(new Error("Không lấy được định danh người dùng từ Odoo"));
      resolve(uid);
    });
  });
};

export const authCtrl = {
  login: async (req, res) => {
    try {
      const { username, password } = req.body;
      if (!username || !password) {
        return res.status(400).json({ msg: "Vui lòng cung cấp đầy đủ thông tin" });
      }

      const odoo = new Odoo({
        url: process.env.ODOO_URL,
        db: process.env.ODOO_DB,
        username: username.trim(),
        password: password,
      });

      let uid;
      try {
        uid = await connectOdoo(odoo);
      } catch (err) {
        return res.status(400).json({ msg: "Kết nối thất bại! Tên đăng nhập hoặc mật khẩu không đúng" });
      }

      const user = await getUserData(odoo, uid);
      if (!user || user.length === 0) {
        return res.status(400).json({ msg: "Dữ liệu người dùng không lấy được. Xin liên hệ với nhà phát triển" });
      }

      const encryptedPassword = encrypt(password);
      await Users.findOneAndUpdate(
        { username: username.trim() },
        { username: username.trim(), password: encryptedPassword },
        { upsert: true, new: true }
      );

      attachCookiesToResponse({ res, data: { username: username.trim() } });
      return res.status(200).json({ msg: "Đăng nhập thành công!", data: user });
    } catch (error) {
      return res.status(500).json({ msg: error.message || "Lỗi đăng nhập" });
    }
  },

  getUserCompanies: async (req, res) => {
    try {
      const userCompanies = await getUserCompanies(req.odoo, req.user);
      return res.status(200).json({ data: userCompanies });
    } catch (error) {
      return res.status(500).json({ msg: error.message });
    }
  },

  changeOdooCompany: async (req, res) => {
    try {
      const { companyId } = req.body;
      if (!companyId) {
        return res.status(400).json({ msg: "Thiếu mã công ty" });
      }

      const targetCompanyId = parseInt(companyId, 10);
      const userRecord = req.user && req.user[0];
      if (!userRecord || !userRecord.company_ids || !userRecord.company_ids.includes(targetCompanyId)) {
        return res.status(403).json({ msg: "Bạn không có quyền chuyển sang công ty này" });
      }

      await hangeChangeUserCompany(req.odoo, targetCompanyId, userRecord.id);

      // Đọc lại thông tin user sau khi đổi công ty
      const updatedUser = await getUserData(req.odoo, userRecord.id);
      return res.status(200).json({ data: updatedUser });
    } catch (error) {
      return res.status(500).json({ msg: error.message || "Không thể đổi công ty" });
    }
  },

  checkAuth: async (req, res) => {
    try {
      const { stto } = req.cookies;
      if (!stto) {
        return res.status(200).json({ msg: "Cần phải đăng nhập để tiếp tục" });
      }

      let payload;
      try {
        payload = isTokenValid(stto);
      } catch (e) {
        res.clearCookie("stto");
        return res.status(401).json({ msg: "Phiên làm việc không hợp lệ! Vui lòng đăng nhập lại" });
      }

      if (!payload || !payload.username) {
        res.clearCookie("stto");
        return res.status(401).json({ msg: "Phiên làm việc không hợp lệ! Vui lòng đăng nhập lại" });
      }

      const mongoUser = await Users.findOne({ username: payload.username });
      if (!mongoUser || !mongoUser.password) {
        res.clearCookie("stto");
        return res.status(400).json({ msg: "Dữ liệu người dùng không tìm thấy" });
      }

      let decryptedPassword;
      try {
        decryptedPassword = decrypt(mongoUser.password);
      } catch (err) {
        res.clearCookie("stto");
        return res.status(500).json({ msg: "Lỗi giải mã thông tin tài khoản" });
      }

      const odoo = new Odoo({
        url: process.env.ODOO_URL,
        db: process.env.ODOO_DB,
        username: payload.username,
        password: decryptedPassword,
      });

      let uid;
      try {
        uid = await connectOdoo(odoo);
      } catch (err) {
        return res.status(502).json({ msg: "Kết nối Odoo thất bại khi kiểm tra phiên" });
      }

      const user = await getUserData(odoo, uid);
      if (!user || user.length === 0) {
        return res.status(400).json({ msg: "Dữ liệu người dùng không lấy được" });
      }

      return res.status(200).json({ data: user });
    } catch (error) {
      return res.status(500).json({ msg: error.message });
    }
  },

  getUserData: async (req, res) => {
    try {
      return res.status(200).json({ data: req.user[0] });
    } catch (error) {
      return res.status(500).json({ msg: error.message });
    }
  },

  logout: async (req, res) => {
    try {
      res.clearCookie("stto");
      return res.status(200).json({ msg: "user logged out!" });
    } catch (error) {
      return res.status(500).json({ msg: error.message });
    }
  },

  getDropBoxAccessToken: async (req, res) => {
    try {
      const credentials = Buffer.from(
        `${process.env.DROPBOX_APP_KEY}:${process.env.DROPBOX_APP_SECRET}`
      ).toString("base64");

      const response = await axios.post(
        "https://api.dropboxapi.com/oauth2/token",
        new URLSearchParams({
          grant_type: "refresh_token",
          refresh_token: process.env.DROPBOX_REFRESH_TOKEN,
        }),
        {
          headers: {
            Authorization: `Basic ${credentials}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
        }
      );
      return res.status(200).json({ data: response.data.access_token });
    } catch (error) {
      return res.status(500).json({ msg: error.message });
    }
  },
};
