# ỨNG DỤNG WEB SOẠN HÀNG (WAREHOUSE PICKER)

Dự án Web Soạn Hàng trên nền tảng di động dành cho nhân viên kho, kế thừa toàn diện kiến trúc, quy ước lập trình và cơ chế xác thực từ hệ thống `driver-app-master`. Ứng dụng tích hợp trực tiếp với **Odoo 12 Community** qua giao thức XML-RPC (`odoo-xmlrpc`) và lưu trữ thông tin phiên làm việc an toàn với MongoDB.

---

## 1. Kiến trúc hệ thống và Kế thừa

Hệ thống tuân thủ mô hình 2 tầng kế thừa từ dự án mẫu:
- **Backend (Express 4 + ES Modules)**:
  - Mount API dưới prefix `/api/`.
  - Cơ chế xác thực qua JWT Cookie `stto` (`httpOnly`, `sameSite: "lax"`, `secure` theo môi trường).
  - Mật khẩu Odoo được mã hóa an toàn với **AES-256-GCM** (random IV, authTag), bảo mật credential trong MongoDB.
  - Middleware `authenticateUser` giải mã password trong bộ nhớ, kết nối Odoo XML-RPC và gắn `req.odoo` cùng `req.user` vào request.
  - Các hàm tiện ích đọc/ghi dữ liệu Odoo được tập trung tại `server/utils/getOdooUserData.js` và `server/utils/updateOdooUserData.js`.
  - Quy ước envelope phản hồi: thành công `{ data: ... }`, lỗi `{ msg: "..." }`.

- **Frontend (React 18 + TypeScript + Create React App + Ant Design v5)**:
  - Axios instance `app` trong `axiosConfig.tsx` với `withCredentials: true`.
  - Quản lý trạng thái bằng Redux Toolkit (`authReducer`, `companyReducer`).
  - Giao diện mobile-first tối ưu cho màn hình 360px - 430px (căn giữa tối đa 480px trên desktop).
  - Toàn bộ component UI sử dụng **Ant Design v5** (`List`, `Card`, `Progress`, `Tag`, `Drawer`, `Modal`, `Form`, `FloatButton`, `Skeleton`, `Empty`).

---

## 2. Danh sách API Backend

Tất cả các API nghiệp vụ đều được bảo vệ bởi middleware `authenticateUser`:

| Method | Endpoint | Mô tả |
|---|---|---|
| `POST` | `/api/login` | Đăng nhập tài khoản Odoo, mã hóa mật khẩu AES-256-GCM, cấp cookie JWT `stto` |
| `GET` | `/api/check-auth` | Khôi phục phiên làm việc và dữ liệu người dùng khi mở ứng dụng |
| `DELETE` | `/api/logout` | Đăng xuất, xóa cookie `stto` |
| `GET` | `/api/get-companies` | Lấy danh sách công ty mà user có quyền truy cập |
| `PATCH` | `/api/change-company` | Đổi công ty đang làm việc trên Odoo (kiểm tra quyền công ty nghiêm ngặt) |
| `GET` | `/api/get-pickings` | Lấy danh sách phiếu kho (`state` không thuộc `draft`, `done`, `cancel`), phân trang 30 phiếu/lần |
| `GET` | `/api/get-picking-moves/:id` | Lấy danh sách sản phẩm (`stock.move`) của phiếu, tổng hợp số lượng đặt và số lượng đã soạn |
| `GET` | `/api/get-move-lines/:id` | Lấy danh sách dòng soạn hàng (`stock.move.line`) của một move |
| `POST` | `/api/create-move-line/:moveId` | Tạo nhanh một dòng soạn hàng mới với số lượng ban đầu bằng 0 |
| `PATCH` | `/api/update-move-line/:id` | Cập nhật địa điểm nguồn, số lô và số lượng đã soạn của dòng soạn hàng |
| `DELETE` | `/api/delete-move-line/:id` | Xóa một dòng soạn hàng khỏi phiếu |
| `GET` | `/api/get-locations` | Tìm kiếm địa điểm kho nội bộ (`usage = 'internal'`) |
| `GET` | `/api/get-lots` | Tìm kiếm số lô theo sản phẩm (`stock.production.lot`) |

---

## 3. Cấu trúc thư mục

```text
warehouse-picker/
├── server/                         # Backend Express ES Modules
│   ├── controllers/
│   │   ├── authController.js       # Xác thực & đa công ty
│   │   ├── pickingController.js    # Nghiệp vụ soạn hàng kho
│   │   └── transportController.js  # Kế thừa chức năng vận tải cũ
│   ├── models/
│   │   └── user.js                 # MongoDB User model
│   ├── routes/
│   │   ├── authRoute.js            # Routes xác thực
│   │   ├── pickingRoute.js         # Routes soạn hàng
│   │   ├── transportRoute.js       # Routes vận tải cũ
│   │   └── index.js                # Đăng ký tập trung các router
│   ├── utils/
│   │   ├── EnCryptAndDeCrypt.js    # Mã hóa AES-256-GCM + fallback CBC
│   │   ├── jwtAttachmentAndCreation.js # Cấu hình JWT & Cookie
│   │   ├── isTokenValid.js         # Xác thực JWT
│   │   ├── getOdooUserData.js      # Tiện ích đọc dữ liệu Odoo XML-RPC
│   │   └── updateOdooUserData.js   # Tiện ích ghi/xóa dữ liệu Odoo XML-RPC
│   ├── middleWare.js               # Middleware authenticateUser
│   ├── .env.example
│   └── server.js                   # Express application entry
│
├── client/                         # Frontend React + TypeScript
│   ├── public/
│   ├── src/
│   │   ├── helpers/
│   │   │   ├── formatNumber.ts     # Format số lượng theo chuẩn vi-VN (tối đa 3 chữ số thập phân)
│   │   │   ├── getErrorMessage.tsx # Chuẩn hóa thông báo lỗi từ backend
│   │   │   └── pickingStatus.ts    # Map nhãn & màu sắc trạng thái phiếu kho
│   │   ├── interface/
│   │   │   ├── picking.ts          # Định nghĩa kiểu dữ liệu TypeScript cho Picking
│   │   │   └── index.tsx           # Export tập trung các interfaces
│   │   ├── pages/
│   │   │   ├── login/Login.tsx     # Màn hình đăng nhập Odoo
│   │   │   └── picking/
│   │   │       ├── PickingList.tsx # Danh sách phiếu kho (/pickings)
│   │   │       ├── PickingMoves.tsx# Danh sách sản phẩm của phiếu (/pickings/:pickingId)
│   │   │       └── MoveLines.tsx   # Danh sách & chỉnh sửa dòng soạn hàng (/pickings/:pickingId/moves/:moveId)
│   │   ├── redux/                  # Redux Toolkit store & reducers
│   │   ├── services/
│   │   │   └── pickingService.ts   # Client API gọi backend qua Axios instance
│   │   ├── widgets/
│   │   │   ├── Header.tsx          # Thanh điều hướng mobile đa năng
│   │   │   ├── Drawer.tsx          # Drawer đổi công ty
│   │   │   └── PageLoading.tsx     # Loading toàn trang
│   │   ├── App.tsx                 # Routing & ConfigProvider Ant Design
│   │   ├── axiosConfig.tsx         # Cấu hình Axios withCredentials
│   │   └── PrivateRoute.tsx        # Route Guard kiểm tra đăng nhập
│   └── .env.example
└── README.md
```

---

## 4. Hướng dẫn cấu hình và chạy ứng dụng

### 4.1. Chuẩn bị môi trường

Tạo file cấu hình `.env` cho cả Server và Client:

**Tại `server/.env`:**
```env
ODOO_URL=https://home.seacorp.vn/
ODOO_DB=opensea12pro
MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/dbname?retryWrites=true&w=majority
JWT_SECRET=your_super_secret_jwt_key_at_least_32_chars
CRYPTO_KEY=your_crypto_key_for_aes256_gcm_at_least_32_chars
PORT=5000
NODE_ENV=development
```

**Tại `client/.env`:**
```env
REACT_APP_SERVER_URI=http://localhost:5000/
```

### 4.2. Khởi chạy Backend

```bash
cd server
npm install
npm run server    # Chạy chế độ phát triển với nodemon (cổng 5000)
# hoặc: npm start
```

### 4.3. Khởi chạy Frontend

```bash
cd client
npm install --legacy-peer-deps
npm start         # Chạy môi trường dev tại http://localhost:3000
# hoặc: npm run build để đóng gói production
```

---

## 5. Quy trình thao tác của nhân viên kho

1. **Đăng nhập**: Mở ứng dụng trên điện thoại, đăng nhập bằng tài khoản và mật khẩu Odoo.
2. **Chọn công ty**: Nếu tài khoản có quyền truy cập nhiều công ty, có thể đổi công ty từ menu trên thanh tiêu đề. Danh sách phiếu kho sẽ tự động làm mới theo công ty được chọn.
3. **Xem danh sách phiếu**: Xem danh sách phiếu kho đang cần xử lý (bỏ qua các phiếu nháp, hoàn thành hoặc hủy). Bấm "Tải thêm" để xem các trang tiếp theo.
4. **Xem sản phẩm cần soạn**: Chọn phiếu để xem các mặt hàng, số lượng đặt, số lượng đã soạn và thanh tiến độ trực quan.
5. **Soạn hàng chi tiết**:
   - Bấm vào sản phẩm để vào màn hình chi tiết dòng soạn hàng.
   - Bấm nút **+** (FAB) ở góc dưới để tạo ngay một dòng soạn hàng mới. Hệ thống sẽ tự động mở Bottom Sheet để nhập liệu.
   - Chọn địa điểm nguồn (có thể tìm kiếm tức thì), chọn số lô (nếu sản phẩm có quản lý lô), nhập số lượng đã soạn (hỗ trợ cả dấu `,` và `.`).
   - Bấm **Xác nhận** để lưu vào Odoo.
   - Có thể bấm **Sửa** hoặc **Xóa** (có xác nhận) trên từng dòng đã tạo. Tiến độ tổng của sản phẩm sẽ tự động cập nhật ngay lập tức.

