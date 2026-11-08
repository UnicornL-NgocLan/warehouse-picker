import Odoo from "odoo-xmlrpc";
import { isTokenValid } from "./utils/isTokenValid.js";
import Users from "./models/user.js";
import { decrypt } from "./utils/EnCryptAndDeCrypt.js";
import { getUserData } from "./utils/getOdooUserData.js";

const connectOdoo = (odoo) => {
  return new Promise((resolve, reject) => {
    odoo.connect((err, uid) => {
      if (err) return reject(err);
      if (!uid) return reject(new Error("Không lấy được định danh người dùng từ Odoo"));
      resolve(uid);
    });
  });
};

export const authenticateUser = async (req, res, next) => {
  try {
    const { stto } = req.cookies;
    if (!stto) {
      return res.status(401).json({ msg: "Phiên làm việc không hợp lệ! Vui lòng đăng nhập lại" });
    }

    let payload;
    try {
      payload = isTokenValid(stto);
    } catch (e) {
      res.clearCookie("stto");
      return res.status(401).json({ msg: "Phiên làm việc đã hết hạn! Vui lòng đăng nhập lại" });
    }

    if (!payload || !payload.username) {
      res.clearCookie("stto");
      return res.status(401).json({ msg: "Phiên làm việc không hợp lệ! Vui lòng đăng nhập lại" });
    }

    const mongoUser = await Users.findOne({ username: payload.username });
    if (!mongoUser || !mongoUser.password) {
      res.clearCookie("stto");
      return res.status(401).json({ msg: "Dữ liệu người dùng không tìm thấy" });
    }

    let decryptedPassword;
    try {
      decryptedPassword = decrypt(mongoUser.password);
    } catch (decryptErr) {
      return res.status(500).json({ msg: "Lỗi giải mã thông tin tài khoản Odoo" });
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
    } catch (connErr) {
      return res.status(502).json({ msg: "Kết nối với Odoo gặp trục trặc: " + (connErr.message || "Không thể kết nối") });
    }

    const user = await getUserData(odoo, uid);
    if (!user || user.length === 0) {
      return res.status(403).json({ msg: "Không lấy được thông tin người dùng từ Odoo" });
    }

    req.user = user;
    req.odoo = odoo;
    return next();
  } catch (err) {
    return res.status(500).json({ msg: err.message || "Lỗi máy chủ nội bộ" });
  }
};

export const otherUserAuthorize = async (req, res, next) => {
  try {
    const odoo = new Odoo({
      url: process.env.ODOO_URL,
      db: process.env.ODOO_DB,
      username: "logistic_service",
      password: "magicWizard",
    });

    const uid = await connectOdoo(odoo);
    req.logistic_user = odoo;
    return next();
  } catch (err) {
    return res.status(500).json({ msg: err.message });
  }
};
