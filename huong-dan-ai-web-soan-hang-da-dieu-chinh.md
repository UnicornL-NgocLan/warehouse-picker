# Hướng dẫn cho AI: Xây web mobile ghi nhận số lượng soạn hàng (đăng nhập bằng tài khoản Odoo)

> File này là đặc tả đầy đủ để AI viết code. Hãy đọc hết trước khi viết. Làm đúng theo đặc tả, **không tự thêm tính năng ngoài phạm vi** (mục 1). Chỗ nào ghi **[GIẢ ĐỊNH]** là quyết định đã được chọn sẵn, cứ làm theo. Chỗ ghi **[CẦN KIỂM TRA]** là điểm chưa chắc trên Odoo 12, hãy viết code để lỗi hiện ra rõ ràng, đừng đoán.

---

## 0. Cách làm việc và nguyên tắc kế thừa dự án cũ

1. Đọc toàn bộ file này và kiểm tra source trong `driver-app-master.zip` trước khi code.
2. **Bắt buộc kế thừa cấu trúc và convention của dự án cũ**; không tự dựng một stack hoặc kiến trúc khác.
3. Làm backend theo thứ tự: Odoo utility → controller → route → middleware/auth nếu cần.
4. Làm frontend theo thứ tự: API Axios → Redux/auth → route/page → component giao diện.
5. Dùng Ant Design v5 cho giao diện; không dùng CSS framework hoặc UI library khác.
6. Chạy build/lint/test phù hợp với project, kiểm tra các luồng trong checklist và báo rõ phần nào chưa thể kiểm tra với Odoo thật.

### 0.1. Quy ước bắt buộc từ `driver-app-master`

**Backend**
- JavaScript ES Modules (`"type": "module"`), Express 4; không chuyển backend sang TypeScript.
- Giữ cách chia thư mục: `server/routes`, `server/controllers`, `server/utils`, `server/models`, `server/middleWare.js`, `server/server.js`.
- Route chỉ khai báo HTTP method, URL, middleware và controller; không viết truy vấn Odoo trong route.
- Controller dùng object export theo convention hiện tại, ví dụ `export const pickingCtrl = { ... }`; controller đọc `req.odoo` và `req.user` do middleware gắn vào request.
- Hàm đọc/ghi Odoo đặt trong `server/utils/getOdooUserData.js` và `server/utils/updateOdooUserData.js` (hoặc tách file riêng nếu file quá dài, nhưng giữ đúng vai trò utility).
- Dùng package `odoo-xmlrpc` và `odoo.execute_kw(model, method, params, callback)` như dự án cũ. Bọc callback bằng Promise để controller/utility dùng `async/await`.
- Giữ response envelope hiện có: thành công `{ data: ... }`, lỗi `{ msg: "..." }`. Không đổi sang `{ code, message }` ở riêng chức năng này.
- Đăng ký route qua `server/routes/index.js` theo cách dự án cũ đang làm và mount dưới `/api/`.

**Frontend**
- Giữ React 18 + TypeScript + Create React App (`react-scripts`), không chuyển sang Vite.
- Giữ `react-router-dom` v6, Redux Toolkit, `react-redux`, Axios.
- Gọi API thông qua instance `app` trong `client/src/axiosConfig.tsx`; giữ `withCredentials: true` và `REACT_APP_SERVER_URI`.
- Giữ Redux store/reducer pattern hiện tại (`auth`, `companies`, ...). Không tự thay bằng Context API hoặc một state manager khác.
- Giữ `PrivateRoute`, luồng `check-auth` khi mở app và action logout hiện tại; có thể bổ sung trạng thái loading nếu cần nhưng không thay kiến trúc.
- Giữ helper `getErrorMessage` và convention hiển thị lỗi hiện tại; có thể mở rộng helper để đọc thêm cấu trúc lỗi mới nếu thật sự cần.

**Giao diện**
- Bắt buộc dùng `antd` v5 đã có trong `client/package.json`.
- Ưu tiên các component AntD: `Form`, `Input`, `InputNumber`, `Button`, `Card`, `List`, `Tag`, `Progress`, `Drawer`, `Modal`, `Select`, `Spin`, `Skeleton`, `Empty`, `Alert`, `FloatButton`, `message`.
- Không tự xây dựng bộ Button/Input/Modal/Drawer riêng. CSS chỉ dùng cho bố cục mobile, khoảng cách, màu sắc và responsive; không thay thế component AntD.
- Kế thừa màu sắc từ `client/src/color.ts` nếu phù hợp; không tạo một design system mới.

### 0.2. Không sao chép máy móc các điểm yếu của code cũ

Dự án cũ là nguồn tham khảo về cấu trúc và luồng xử lý, không phải yêu cầu giữ nguyên mọi chi tiết bảo mật. Cụ thể:
- Không dùng AES-256-CBC với IV cố định như helper cũ. Nếu tiếp tục lưu mật khẩu Odoo mã hóa để middleware tái kết nối, dùng AES-256-GCM với IV ngẫu nhiên và authentication tag; secret lấy từ biến môi trường, không hard-code.
- JWT phải có thời hạn hết hạn (`expiresIn`) đồng bộ với `maxAge` cookie; cookie giữ `httpOnly`, `secure` theo môi trường và bổ sung `sameSite: "lax"`.
- Không ghi mật khẩu, JWT, thông tin xác thực hoặc session vào log.
- Không sao chép thông tin tài khoản/mật khẩu hard-code trong `otherUserAuthorize`; chức năng soạn hàng chỉ dùng `req.odoo` của user đã đăng nhập.
- Không trả response bên trong callback rồi tiếp tục resolve/reject Promise; utility chỉ resolve/reject, controller chịu trách nhiệm trả response đúng một lần.
- Không dùng `alert()` cho luồng UI mới; dùng `message`/`notification` của AntD.

---

## 1. Mục tiêu và phạm vi

**Mục tiêu:** Web chạy trên điện thoại cho nhân viên kho: đăng nhập bằng tài khoản Odoo, xem phiếu kho, xem sản phẩm trong phiếu, và thêm/sửa/xóa các dòng **stock move line** (địa điểm nguồn, số lô, số lượng đã soạn).

**Trong phạm vi:**
1. Đăng nhập bằng tài khoản Odoo, **lưu token** để lần sau không phải đăng nhập lại.
2. Đổi công ty nếu user thuộc nhiều công ty.
3. Màn hình danh sách `stock.picking`.
4. Màn hình danh sách `stock.move` của một phiếu.
5. Màn hình danh sách `stock.move.line` của một move, có nút Tạo, Sửa, Xóa.

**Ngoài phạm vi (không làm):**
- Không có nút Validate, Hoàn thành phiếu, Hủy phiếu, Check Availability, hay bất kỳ thao tác chuyển trạng thái phiếu nào.
- Không làm chế độ offline hay hàng đợi đồng bộ.
- Không quét barcode, không in ấn, không báo cáo.
- Không sửa số lượng đặt, không hiển thị giá.

---

## 2. Giả định và bối cảnh

- **Odoo 12 Community**, backend giao tiếp qua XML-RPC bằng package `odoo-xmlrpc` như dự án cũ. Không gọi Odoo trực tiếp từ browser. Odoo 12 chưa dùng `allowed_company_ids` như các phiên bản mới hơn.
- Frontend và Backend có thể chạy khác origin theo cấu hình triển khai hiện tại. Giữ CORS whitelist, `credentials: true` và Axios `withCredentials: true`; không tự giả định cùng origin hoặc tắt CORS.
- **[GIẢ ĐỊNH]** Bấm nút **Tạo** thì **tạo ngay** một stock move line mới (lấy giá trị mặc định từ move), số lượng = 0, rồi người dùng bấm **Sửa** để nhập. Không mở form riêng.
- **[GIẢ ĐỊNH]** Số lượng đặt lấy từ `sale.order.line.product_uom_qty` qua `stock.move.sale_line_id`. Nếu move không có `sale_line_id` (hoặc user không đọc được `sale.order.line`) thì **dùng tạm `stock.move.product_uom_qty`** và hiện nhãn nhỏ "theo phiếu" cạnh số để người dùng biết nguồn khác.
- **[GIẢ ĐỊNH]** Không gộp các move cùng sản phẩm. Mỗi `stock.move` là một dòng riêng.
- Ngôn ngữ giao diện: **tiếng Việt**. Số hiển thị theo `vi-VN`, tối đa 3 chữ số thập phân, bỏ số 0 thừa ở cuối.

---

## 3. Kiến trúc và công nghệ (theo dự án cũ)

Giữ mô hình 2 ứng dụng như `driver-app-master`:

```text
Mobile browser
   │ HTTPS + cookie JWT `stto`
   ▼
React 18 + TypeScript + CRA + Ant Design
   │ Axios (`withCredentials: true`)
   ▼
Express API (`/api/*`)
   │ authenticateUser: xác thực JWT, lấy user credential đã mã hóa,
   │ tạo Odoo XML-RPC client và gắn req.odoo / req.user
   ▼
Odoo 12 (`odoo-xmlrpc`, execute_kw)
```

**Không tạo Backend TypeScript/Vite/SQLite mới.** Dự án cũ đang dùng:
- Backend: Node.js, Express 4, JavaScript ES Modules, Mongoose/MongoDB, `odoo-xmlrpc`, `jsonwebtoken`, `cookie-parser`, `dotenv`, `helmet`, `cors`.
- Frontend: React 18, TypeScript, Create React App, React Router v6, Redux Toolkit, Axios, Ant Design v5.
- Backend và frontend tiếp tục chạy/deploy theo cấu hình hiện tại của dự án cũ; không tự gộp frontend build vào Express nếu deployment hiện tại đang tách client/server.

**Luồng xác thực kế thừa:**
1. Frontend gửi `POST /api/login` với `{ username, password }`.
2. Backend khởi tạo `Odoo` từ `odoo-xmlrpc`, gọi `connect`, sau đó lấy user bằng utility `getUserData`.
3. Backend tạo/cập nhật record `Users` trong MongoDB theo username, lưu mật khẩu ở dạng mã hóa AES-256-GCM (không lưu plaintext).
4. Backend tạo JWT chỉ chứa định danh cần thiết (tối thiểu `username`), gắn cookie `stto` và trả `{ msg, data }` theo convention cũ.
5. Những API cần đăng nhập gắn `authenticateUser`. Middleware xác thực cookie JWT, lấy credential đã mã hóa từ MongoDB, giải mã trong bộ nhớ, tạo Odoo client, gọi `connect`, lấy user data, rồi gắn `req.odoo` và `req.user` trước `next()`.
6. Controller/utility dùng `req.odoo` để thao tác Odoo. Không gửi credential hoặc đối tượng Odoo về frontend.
7. `GET /api/check-auth` dùng để khôi phục trạng thái đăng nhập khi mở app; frontend dispatch `addAuth` khi có user data.

**Lưu ý hiệu năng:** Theo đúng cách làm của dự án cũ, middleware tạo kết nối Odoo cho mỗi request được bảo vệ. Không tự ý thay bằng SQLite/session store hoặc giữ một kết nối Odoo toàn cục. Nếu sau này cần tối ưu kết nối, phải đo tải và đề xuất riêng.

---

## 4. Cấu hình (.env)

Kế thừa các biến môi trường hiện có của dự án cũ, đặc biệt:

```env
ODOO_URL=https://odoo.example.com
ODOO_DB=your_database
MONGO_URI=mongodb://...
JWT_SECRET=replace_with_long_random_secret
CRYPTO_KEY=replace_with_long_random_secret
PORT=5000
NODE_ENV=development
REACT_APP_SERVER_URI=http://localhost:5000
```

- Giữ `ODOO_URL`, `ODOO_DB`, `MONGO_URI`, `JWT_SECRET`, `CRYPTO_KEY`, `PORT`, `NODE_ENV` theo cấu hình thực tế hiện tại.
- Không tạo `SERVER_SECRET`, `TOKEN_TTL_DAYS`, `COOKIE_SECURE`, SQLite hoặc biến cấu hình mới nếu không cần thiết cho convention hiện tại.
- `CRYPTO_KEY` phải đủ mạnh và chỉ tồn tại ở backend. Không commit `.env`.
- `REACT_APP_SERVER_URI` cấu hình ở frontend theo cách `axiosConfig.tsx` hiện đang đọc.
- Cung cấp/cập nhật `.env.example` nhưng không ghi giá trị secret thật.

---

## 5. Xác thực và token (kế thừa `authController` và `middleWare.js`)

### 5.1. Đăng nhập `POST /api/login`

- Request body: `{ "username": "...", "password": "..." }`.
- Dùng `odoo-xmlrpc` như `server/controllers/authController.js`:
  `new Odoo({ url: process.env.ODOO_URL, db: process.env.ODOO_DB, username, password })`.
- Gọi `odoo.connect` bằng Promise wrapper. Nếu sai thông tin đăng nhập, trả HTTP 400 và `{ msg: "..." }` theo convention cũ.
- Sau khi connect, gọi `getUserData(odoo, uid)` trong `server/utils/getOdooUserData.js`.
- Tạo/cập nhật `Users` trong MongoDB. Lưu password bằng AES-256-GCM; cấu trúc lưu phải có đủ `iv`, `authTag`, `ciphertext` (có thể serialize thành string JSON trong field hiện có hoặc cập nhật schema tương ứng).
- Gọi `attachCookiesToResponse({ res, data: { username } })` hoặc helper cùng vai trò. Cookie tên `stto`, `httpOnly: true`, `secure` khi production, `sameSite: "lax"`, `maxAge` đồng bộ với JWT `expiresIn`.
- Response thành công theo dạng `{ msg: "Đăng nhập thành công!", data: user }`.

### 5.2. Xác thực request `authenticateUser`

- Dùng middleware `authenticateUser` trong `server/middleWare.js` cho toàn bộ API nghiệp vụ soạn hàng.
- Đọc cookie `stto`, verify bằng `isTokenValid` và `JWT_SECRET`.
- Tìm user trong MongoDB theo `payload.username`; giải mã password AES-256-GCM trong bộ nhớ.
- Khởi tạo Odoo client và gọi `connect`; sau đó gọi `getUserData`.
- Gắn `req.odoo = odoo`, `req.user = user` rồi `next()`.
- Nếu cookie thiếu/hết hạn/không hợp lệ hoặc user không tồn tại: clear cookie khi phù hợp và trả lỗi theo convention `{ msg: "..." }` với HTTP status phù hợp.
- Nếu Odoo không kết nối được: trả lỗi rõ ràng, không gọi controller tiếp.

### 5.3. Khôi phục đăng nhập `GET /api/check-auth`

- Giữ endpoint `check-auth` hiện có trong `authRoute.js` và controller.
- Khi app mở, frontend gọi `/api/check-auth`. Nếu token hợp lệ, backend lấy user data và trả `{ data: user }`; frontend dispatch `addAuth`.
- Nếu không hợp lệ, frontend đưa về `/login`. Không tạo thêm cơ chế token localStorage.

### 5.4. Đăng xuất `DELETE /api/logout`

- Giữ method và endpoint đang dùng: `DELETE /api/logout`.
- Clear cookie `stto`; frontend dispatch action logout để reset Redux state.

### 5.5. Các lưu ý khi triển khai

- Không dùng SQLite hoặc `app_token` trong chức năng này.
- Không gửi JWT qua JSON response; trình duyệt gửi cookie tự động nhờ `withCredentials: true`.
- Không lưu password plaintext. AES-GCM cần IV ngẫu nhiên cho mỗi lần mã hóa; không tái sử dụng IV.
- Thêm rate limit cho login nếu phù hợp với hạ tầng hiện có; không làm thay đổi luồng nghiệp vụ.
- Middleware hiện tại reconnect Odoo mỗi request. Giữ hành vi này để tương thích dự án cũ, nhưng tuyệt đối không log credential.

---

## 6. Đổi công ty (multi-company, Odoo 12)

- Kế thừa API và cách xử lý hiện tại: `GET /api/get-companies`, `PATCH /api/change-company`.
- Route gắn `authenticateUser`; controller sử dụng `req.odoo`, `req.user`.
- Lấy danh sách công ty bằng utility `getUserCompanies(odoo, user)` trong `server/utils/getOdooUserData.js`.
- Đổi công ty bằng utility `hangeChangeUserCompany(odoo, companyId, uid)` trong `server/utils/updateOdooUserData.js` (có thể sửa tên hàm thành `changeUserCompany` nếu đồng bộ toàn bộ nơi gọi, không bắt buộc).
- Trước khi ghi, kiểm tra `companyId` thuộc `req.user[0].company_ids`; không tin `companyId` do frontend gửi lên.
- Sau khi đổi, đọc lại user data và trả về theo envelope `{ data: ... }`.
- Frontend cập nhật Redux auth state và xóa/reset dữ liệu danh sách đang hiển thị để tránh trộn dữ liệu giữa hai công ty.
- Giữ cảnh báo: đổi công ty cập nhật `res.users.company_id`, có thể ảnh hưởng phiên Odoo trên máy tính và các ứng dụng khác dùng cùng tài khoản.
- Không dùng `allowed_company_ids` vì hệ thống mục tiêu là Odoo 12.
- Cần kiểm tra quyền `res.users.write` trên instance thật; nếu Odoo từ chối thì hiển thị lỗi thực tế, không giả lập thành công.

---

## 7. API Backend (đặt route theo convention dự án cũ)

Tất cả route nghiệp vụ đều gắn `authenticateUser`. Prefix `/api` được mount tại `server/routes/index.js`. Giữ response envelope `{ data: ... }` khi thành công và `{ msg: "..." }` khi lỗi.

| Method | Route | Controller/ý nghĩa |
|---|---|---|
| POST | `/api/login` | `authCtrl.login` (đã có) |
| GET | `/api/check-auth` | `authCtrl.checkAuth` (đã có) |
| DELETE | `/api/logout` | `authCtrl.logout` (đã có) |
| GET | `/api/get-user` | `authCtrl.getUserData` (đã có) |
| GET | `/api/get-companies` | `authCtrl.getUserCompanies` (đã có) |
| PATCH | `/api/change-company` | `authCtrl.changeOdooCompany` (đã có) |
| GET | `/api/get-pickings?offset=0&limit=30` | Danh sách phiếu kho |
| GET | `/api/get-picking-moves/:id` | Danh sách move của phiếu |
| GET | `/api/get-move-lines/:id` | Danh sách move line của move |
| POST | `/api/create-move-line/:moveId` | Tạo move line |
| PATCH | `/api/update-move-line/:id` | Sửa move line |
| DELETE | `/api/delete-move-line/:id` | Xóa move line |
| GET | `/api/get-locations?q=&limit=50` | Tìm địa điểm nguồn |
| GET | `/api/get-lots?product_id=&q=&limit=50` | Tìm lô theo sản phẩm |

Tên route mới phải theo convention hiện tại `get-*`, `create-*`, `update-*`, `delete-*`; không tạo router REST độc lập hoặc thay đổi các endpoint auth hiện có.

### Cấu trúc route/controller/utility

- Tạo `server/routes/pickingRoute.js`, export `router.stack` giống `authRoute.js` và `transportRoute.js`.
- Tạo `server/controllers/pickingController.js`, export `pickingCtrl` dạng object chứa các handler async.
- Đăng ký `pickingRoute` trong `server/routes/index.js` giống cách đăng ký `transportRouter`.
- Hàm đọc dữ liệu đặt trong `server/utils/getOdooUserData.js`; hàm tạo/sửa/xóa đặt trong `server/utils/updateOdooUserData.js`. Nếu muốn tách file, đặt tên rõ nghĩa và import từ controller; không viết `execute_kw` trực tiếp trong route.
- Tất cả handler dùng `req.odoo` và `req.user` từ middleware; không tự tạo Odoo client trong từng controller.
- Utility bọc `odoo.execute_kw` bằng Promise và reject lỗi gốc. Controller bắt lỗi, log thông tin kỹ thuật đã loại bỏ dữ liệu nhạy cảm và trả `{ msg: error.message }`.
- Validate id, offset, limit và body ở controller/utility trước khi gọi Odoo.

---

### Kiểu dữ liệu trả về (TypeScript)

```ts
type Ref = { id: number; name: string };

type Picking = { id: number; name: string; partner: Ref | null; state: string };

type Move = {
  id: number;
  product: Ref;
  orderedQty: number;          // từ sale.order.line.product_uom_qty (hoặc fallback)
  orderedUom: string;
  orderedFromPicking: boolean; // true nếu phải dùng fallback stock.move.product_uom_qty
  pickedQty: number;           // tổng qty_done của các move line thuộc move
  pickedUom: string;
};

type MoveLine = {
  id: number;
  locationDest: Ref;           // địa điểm đích (chỉ đọc)
  location: Ref;               // địa điểm nguồn
  lot: Ref | null;             // số lô
  qtyDone: number;
  uom: string;
  productId: number;
  tracking: "none" | "lot" | "serial"; // để frontend ẩn/hiện ô lô
};
```

Lỗi chuẩn theo dự án cũ: `{ "msg": "..." }` kèm HTTP status. Ưu tiên lấy `error.message` từ lỗi XML-RPC/Odoo; không đổi envelope sang `{ code, message }`.

---

## 8. Cách Backend gọi Odoo

### 8.1. Quy ước XML-RPC theo source cũ

Dùng `odoo-xmlrpc`, không chuyển sang JSON-RPC/fetch/axios gọi thẳng Odoo. Cách gọi phải tương thích với utility hiện tại:

```js
export async function searchReadPickings(odoo, domain, fields, offset, limit) {
  return new Promise((resolve, reject) => {
    const params = [[domain, fields, offset, limit]];
    odoo.execute_kw("stock.picking", "search_read", params, (err, records) => {
      if (err) return reject(err);
      resolve(records);
    });
  });
}
```

Ví dụ trên chỉ minh họa pattern. Các utility thực tế phải truyền đúng tham số Odoo theo từng model/method. Không trả response HTTP bên trong utility.

### 8.2. `GET /api/get-pickings`

- Dùng `stock.picking` / `search_read`.
- Domain: `[["state","not in",["cancel","done","draft"]]] + PICKING_EXTRA_DOMAIN`.
- Fields: `["name","partner_id","state"]`.
- Order: `"scheduled_date asc, id asc"`.
- Lấy `limit + 1` bản ghi để xác định `hasMore`.
- Response: `{ data: { items: Picking[], hasMore: boolean } }`.

### 8.3. `GET /api/get-picking-moves/:id`

Giữ nguyên logic nghiệp vụ ở mục 8.3 của đặc tả gốc: đọc `stock.move`, đọc `sale.order.line` theo batch nếu có quyền, tổng hợp `qty_done` từ `stock.move.line`, fallback `product_uom_qty` khi không đọc được sale line, không quy đổi UoM, không gộp move cùng sản phẩm.

Response: `{ data: Move[] }`.

### 8.4. `GET /api/get-move-lines/:id`

Giữ nguyên logic nghiệp vụ ở mục 8.4 của đặc tả gốc: đọc các `stock.move.line` theo `move_id`, lấy `tracking` từ `product.product`.

Response: `{ data: MoveLine[] }`.

### 8.5. `POST /api/create-move-line/:moveId`

Giữ nguyên logic nghiệp vụ ở mục 8.5 của đặc tả gốc: đọc `stock.move`, tạo `stock.move.line` với nguồn/đích/sản phẩm/UoM lấy từ move và `qty_done = 0`, đọc lại record vừa tạo.

Response HTTP 201: `{ data: MoveLine }`.

### 8.6. `PATCH /api/update-move-line/:id`

Request body vẫn dùng camelCase: `{ locationId?, lotId?, qtyDone? }`. Backend chỉ cho phép ghi đúng `location_id`, `lot_id`, `qty_done`; giữ nguyên toàn bộ validation nghiệp vụ ở mục 8.6 của đặc tả gốc.

Response: `{ data: MoveLine }`.

### 8.7. `DELETE /api/delete-move-line/:id`

Dùng `stock.move.line` / `unlink([id])`. Response HTTP 200 theo convention cũ: `{ data: true }` (hoặc HTTP 204 nếu client hiện tại xử lý thống nhất; ưu tiên `{ data: true }` để giữ envelope response).

### 8.8. Tra cứu popup

- `/api/get-locations?q=`: `stock.location` / `search_read`, domain internal + `complete_name ilike q`, limit tối đa 50, trả `{ data: Ref[] }`.
- `/api/get-lots?product_id=&q=`: `stock.production.lot` / `search_read`, lọc đúng `product_id`, limit tối đa 50, trả `{ data: Ref[] }`.

### 8.9. Xử lý lỗi

- Utility reject lỗi gốc từ `odoo-xmlrpc`.
- Controller trả `{ msg: error.message || "Có lỗi xảy ra" }` và HTTP status phù hợp.
- Không nuốt lỗi, không trả `200` khi Odoo ghi thất bại.
- Do helper frontend cũ đọc `response.data.msg`, mọi lỗi API mới phải có `msg` để `getErrorMessage` hiển thị được.
- Không trả stack trace, credential hoặc dữ liệu nội bộ cho frontend.

---

## 9. Thiết kế giao diện (React + Ant Design v5)

### 9.1. Nguyên tắc

- Mobile-first cho màn hình 360–430 px; trên màn lớn giới hạn vùng nội dung khoảng 480 px và căn giữa.
- Dùng Ant Design v5 đã có trong `client/package.json`. Không dùng Tailwind để dựng UI, không dùng CSS thuần để tự tạo các component tương đương AntD.
- Dùng `ConfigProvider` để cấu hình tiếng Việt/theme nếu cần. Kế thừa `myColor` từ `client/src/color.ts`.
- Dùng AntD `Layout`/`Flex`/`Space`/`Typography`/`Card`/`List`/`Tag`/`Progress`/`Button`/`FloatButton`/`Drawer`/`Modal`/`Form`/`Input`/`InputNumber`/`Select`/`Spin`/`Skeleton`/`Empty`/`Alert`.
- Nút và vùng thao tác trên mobile đủ lớn, tránh bố trí nút Sửa và Xóa sát nhau.
- Không dùng `window.alert` hoặc `window.confirm` cho chức năng mới. Dùng `message` hoặc `Modal.confirm` của AntD.
- Dùng `Drawer` placement="bottom" làm popup sửa dạng bottom sheet; dùng `Modal` để xác nhận xóa.

### 9.2. Cấu trúc frontend

Kế thừa cấu trúc CRA hiện tại, bổ sung tối thiểu:

```text
client/src/
  axiosConfig.tsx                 # Axios instance hiện có
  App.tsx                         # check-auth + BrowserRouter
  PrivateRoute.tsx                # route guard hiện có
  redux/
    reducers/authReducer.tsx      # auth state hiện có
    reducers/companyReducer.tsx   # company state hiện có
  pages/
    login/Login.tsx               # login hiện có, chỉ chỉnh nếu cần
    picking/PickingList.tsx       # danh sách phiếu
    picking/PickingMoves.tsx      # danh sách move
    picking/MoveLines.tsx         # danh sách move line
  services/pickingService.ts      # hàm gọi API qua app Axios instance
  interface/picking.ts            # TypeScript types
  widgets/                        # dùng lại Header/PageLoading nếu phù hợp
```

Có thể điều chỉnh tên/thư mục nhỏ để khớp source hiện tại, nhưng không tạo một frontend project mới.

### 9.3. Luồng đăng nhập và route

- Giữ `App.tsx` gọi `GET /api/check-auth` khi mount.
- Nếu trả về user, dispatch `addAuth` và hiển thị route chính; nếu chưa đăng nhập, hiển thị `/login`.
- Giữ `PrivateRoute` để bảo vệ các màn hình soạn hàng.
- Login dùng AntD `Form`, `Input`, `Input.Password`, `Button`; gọi `app.post("/api/login", { username, password })`.
- Sau login thành công dispatch `addAuth(data.data[0])` theo đúng cấu trúc dữ liệu thực tế từ backend.
- Logout gọi `app.delete("/api/logout")`, sau đó dispatch logout.
- Không lưu token vào localStorage/sessionStorage; cookie `stto` được gửi qua Axios `withCredentials: true`.

### 9.4. Service gọi API

- Tất cả API soạn hàng gọi qua `app` import từ `axiosConfig.tsx`.
- Không gọi `axios` trực tiếp trong component và không gọi Odoo từ browser.
- Tạo `pickingService.ts` gom các hàm `getPickings`, `getPickingMoves`, `getMoveLines`, `createMoveLine`, `updateMoveLine`, `deleteMoveLine`, `getLocations`, `getLots`.
- Service trả dữ liệu theo `response.data.data`; lỗi đi qua `getErrorMessage` (đọc `response.data.msg`).
- Giữ query params và path theo bảng API mục 7.

### 9.5. Màn hình Đăng nhập

- Giữ logo và phong cách login hiện tại nếu phù hợp.
- Dùng AntD `Form`, `Form.Item`, `Input`, `Input.Password`, `Button`.
- Field username/password required; disable form khi đang submit; Button hiển thị loading.
- Hiện lỗi bằng `message.error` hoặc `Alert` từ nội dung `msg` backend.

### 9.6. Màn hình danh sách phiếu (`/pickings`)

- Mỗi phiếu hiển thị tên phiếu, đối tác và trạng thái.
- Dùng `List` hoặc `Card` của AntD; không cần dùng `Table` trên mobile nếu gây tràn ngang.
- Bấm item chuyển sang `/pickings/:pickingId`.
- Phân trang 30 phiếu/lượt bằng nút `Button` "Tải thêm"; có loading khi fetch.
- Có nút refresh phù hợp trên Header hoặc đầu danh sách.
- Nếu nhiều công ty, tái sử dụng Header/Drawer đổi công ty hiện có. Khi đổi công ty, reset dữ liệu màn hình và tải lại danh sách.

### 9.7. Màn hình danh sách move (`/pickings/:pickingId`)

- Mỗi move hiển thị tên sản phẩm, số lượng đặt, số lượng đã soạn và tiến độ.
- Dùng `Card`, `Typography`, `Progress`, `Tag`.
- Nếu `orderedFromPicking = true`, hiển thị Tag nhỏ "theo phiếu".
- Màu tiến độ: 0 là xám; đang soạn nhưng chưa đủ là cam; bằng số đặt là xanh lá; vượt số đặt là xanh dương và hiển thị phần vượt. Progress không vượt 100%.
- Không gộp move cùng sản phẩm.
- Bấm item chuyển sang màn hình move line.

### 9.8. Màn hình danh sách move line (`/pickings/:pickingId/moves/:moveId`)

- Hiển thị tổng đặt/đã soạn ở phần tiêu đề.
- Mỗi dòng hiển thị số lượng nổi bật, số lô, địa điểm nguồn, địa điểm đích.
- Dùng `Card` hoặc `List`; dùng `Typography.Text` cho label/value; `Button` cho Sửa/Xóa.
- Không có lô thì hiển thị "Chưa chọn lô"; `tracking = "none"` thì ẩn thông tin số lô.
- FAB dùng AntD `FloatButton` (hoặc `Button` fixed nếu phiên bản AntD không đáp ứng), nằm trên safe area.
- Khi danh sách rỗng dùng `Empty` với nội dung "Chưa có dòng soạn hàng. Bấm + để thêm.".
- Tạo thành công: thêm/refetch line, cuộn tới line mới, mở Drawer sửa tự động và hiện `message.success`.
- Sau mỗi thao tác Tạo/Sửa/Xóa phải refetch cả move line và danh sách move để cập nhật tổng đã soạn.

### 9.9. Drawer sửa move line

- Dùng `Drawer` placement="bottom"; chiều cao phù hợp màn hình mobile và xử lý vùng bàn phím ảo.
- Form dùng AntD `Form`, `Select` searchable, `InputNumber` hoặc `Input` decimal.
- Địa điểm đích hiển thị chỉ đọc.
- Địa điểm nguồn: Select có tìm kiếm server-side, debounce 300 ms, gọi `/api/get-locations`; option hiện tại phải có thể chọn lại.
- Số lô: Select tìm kiếm server-side, gọi `/api/get-lots?product_id=...`; có option bỏ chọn; ẩn khi `tracking = "none"`.
- Số lượng: chấp nhận dấu phẩy/dấu chấm, normalize dấu phẩy thành dấu chấm trước khi gửi; bắt buộc số hữu hạn và >= 0; hiển thị UoM cạnh trường nhập.
- `OK` disabled nếu form không hợp lệ hoặc đang submit. Nếu không đổi dữ liệu thì đóng Drawer, không gọi API.
- Khi API lỗi, giữ Drawer mở, giữ nguyên dữ liệu nhập và hiện `msg` bằng `Alert`/`Typography` màu đỏ bên trong Drawer.
- Khi thành công đóng Drawer, cập nhật danh sách, hiện `message.success("Đã cập nhật")`.

### 9.10. Xác nhận xóa

- Dùng `Modal.confirm` hoặc `Modal` controlled.
- Nội dung xác nhận có số lô (hoặc "chưa có lô") và số lượng/UoM.
- Hủy không gọi API. Xóa gọi API, loading trong lúc xử lý.
- Thành công refetch dữ liệu và hiện `message.success("Đã xóa")`; lỗi hiển thị `msg` backend.

### 9.11. Nhãn trạng thái và chuỗi tiếng Việt

Giữ nguyên mapping state và toàn bộ chuỗi tiếng Việt tại mục 9.8–9.9 của đặc tả gốc. Dùng AntD `Tag` để thể hiện trạng thái nếu hiển thị.

---

## 10. Xử lý lỗi và trạng thái

| Tình huống | Backend | Frontend |
|---|---|---|
| Chưa đăng nhập/JWT hết hạn | HTTP 401/403, `{ msg: "..." }`, clear cookie nếu cần | Reset auth/cache và chuyển `/login` |
| Odoo từ chối quyền | HTTP 403 hoặc status phù hợp, `{ msg: error.message }` | `message.error` kèm nội dung `msg` |
| Lỗi nghiệp vụ Odoo | HTTP 400, `{ msg: error.message }` | Hiện nguyên văn `msg`; nếu Drawer đang mở thì hiển thị trong Drawer |
| Odoo mất kết nối | HTTP 502, `{ msg: "Không kết nối được máy chủ Odoo" }` | `Alert`/`message.error`, có nút Thử lại |
| Danh sách rỗng | `{ data: [] }` | AntD `Empty` |
| Đang tải | API chưa trả kết quả | AntD `Spin`/`Skeleton`, không để màn hình trắng |
| Submit lặp | Controller/DB không tạo trùng do UI disable khi request chạy | Disable Button/FAB trong lúc gửi |

- Dùng `getErrorMessage` hiện có để đọc `error.response.data.msg`. Có thể mở rộng helper để xử lý trường hợp `msg` rỗng; không đổi toàn bộ convention sang `message`.
- Không hiển thị thành công nếu API chưa xác nhận thành công.
- Sau mỗi thao tác Tạo/Sửa/Xóa, refetch danh sách move line và danh sách move của phiếu.

---

## 11. Bảo mật (bắt buộc)

- Giữ cookie JWT `stto` ở chế độ `httpOnly`; `secure` khi production; `sameSite: "lax"`; JWT có `expiresIn` đồng bộ với cookie `maxAge`.
- Không lưu JWT ở localStorage/sessionStorage và không trả token trong JSON.
- Không lưu password plaintext trong MongoDB. Dùng AES-256-GCM, IV ngẫu nhiên, authentication tag; secret chỉ đọc từ `CRYPTO_KEY` backend.
- Không ghi password, JWT, credential đã giải mã hoặc token vào log.
- Tất cả route soạn hàng phải gắn `authenticateUser`; không route nghiệp vụ nào được public.
- Không sử dụng `otherUserAuthorize` hoặc tài khoản Odoo hard-code cho chức năng này.
- Chỉ expose các endpoint nghiệp vụ đã khai báo; không tạo proxy tổng quát tới Odoo.
- Validate mọi id là số nguyên dương; validate `offset`, `limit`; validate `qtyDone` là số hữu hạn và >= 0; whitelist field được ghi.
- Bật `helmet`; giữ CORS whitelist và `credentials: true` theo cấu hình server hiện có. Không dùng wildcard origin khi bật credentials.
- Triển khai sau HTTPS. Không cần mở Odoo trực tiếp ra internet nếu kiến trúc mạng hiện tại cho phép backend truy cập nội bộ.

---

## 12. Cấu trúc dự án và sản phẩm bàn giao

Không tạo skeleton dự án mới. Bổ sung trực tiếp vào cấu trúc `driver-app-master`:

```text
driver-app-master/
├─ server/
│  ├─ controllers/
│  │  └─ pickingController.js       # controller chức năng soạn hàng
│  ├─ routes/
│  │  ├─ pickingRoute.js            # route chức năng soạn hàng
│  │  └─ index.js                   # đăng ký pickingRoute
│  ├─ utils/
│  │  ├─ getOdooUserData.js         # bổ sung hàm đọc picking/move/line/location/lot
│  │  └─ updateOdooUserData.js      # bổ sung hàm create/write/unlink move line
│  ├─ middleWare.js                 # tái sử dụng authenticateUser
│  ├─ models/user.js                # tái sử dụng Users; cập nhật schema nếu cần cho AES-GCM
│  └─ server.js                     # giữ cấu hình Express hiện có
└─ client/
   └─ src/
      ├─ pages/picking/             # các màn hình soạn hàng
      ├─ services/pickingService.ts # API client dùng Axios instance hiện có
      ├─ interface/picking.ts       # TypeScript types
      ├─ App.tsx                    # bổ sung routes, giữ check-auth
      ├─ PrivateRoute.tsx           # tái sử dụng
      ├─ axiosConfig.tsx            # tái sử dụng
      ├─ redux/                     # tái sử dụng auth/company reducers
      └─ widgets/                   # tái sử dụng Header, Drawer, PageLoading khi phù hợp
```

**Không được làm:**
- Không tạo `server/src` TypeScript, không tạo Vite, không tạo SQLite.
- Không thay `odoo-xmlrpc` bằng JSON-RPC/fetch nếu không có yêu cầu thay đổi kiến trúc.
- Không thay Redux Toolkit bằng Context/Zustand.
- Không thay Axios instance `app` bằng nhiều axios instance rời rạc.
- Không tạo UI library riêng hoặc dùng thư viện UI khác thay AntD.

**Bàn giao:**
- Source code tích hợp vào đúng cấu trúc dự án cũ.
- File `.env.example` cập nhật, không chứa secret thật.
- README bổ sung cách chạy phần soạn hàng theo quy trình hiện tại của dự án.
- Báo cáo các file đã tạo/sửa, API đã triển khai, checklist đã chạy và các điểm cần kiểm tra trên Odoo 12 thật.

---

## 13. Tiêu chí nghiệm thu (AI tự kiểm tra và báo cáo)

Ngoài checklist nghiệp vụ bên dưới, bắt buộc kiểm tra:
- [ ] Backend vẫn dùng Express + JavaScript ES Modules + `odoo-xmlrpc`, đúng cấu trúc routes/controllers/utils/middleware của dự án cũ.
- [ ] Middleware `authenticateUser` gắn `req.odoo` và `req.user`; controller không tự khởi tạo Odoo client.
- [ ] Frontend vẫn dùng CRA + React + TypeScript + React Router + Redux Toolkit + Axios instance `app`.
- [ ] Toàn bộ giao diện chức năng soạn hàng dùng Ant Design v5.
- [ ] Response backend giữ `{ data }` và `{ msg }`; frontend đọc đúng `response.data.data` và `response.data.msg`.


**Đăng nhập và token**
- [ ] Đăng nhập đúng tài khoản Odoo vào được danh sách phiếu. Sai mật khẩu hiện lỗi đúng.
- [ ] Tắt trình duyệt, mở lại: vào thẳng danh sách phiếu, không phải đăng nhập.
- [ ] Đăng xuất xong, mở lại thì phải đăng nhập.
- [ ] MongoDB không lưu mật khẩu plaintext; credential được mã hóa AES-256-GCM. Cookie JWT `stto` có `httpOnly` và trình duyệt không đọc được bằng JavaScript.

**Đa công ty**
- [ ] User một công ty: không thấy chip công ty.
- [ ] User nhiều công ty: thấy chip, đổi được, danh sách phiếu đổi theo công ty.

**Dữ liệu**
- [ ] Danh sách phiếu **không** chứa phiếu `draft`, `done`, `cancel`.
- [ ] Mỗi thẻ phiếu có tên phiếu và đối tác.
- [ ] Số lượng đặt khớp `sale.order.line.product_uom_qty` (đối chiếu với Odoo).
- [ ] Số đã soạn bằng tổng `qty_done` các move line của move (đối chiếu với Odoo).
- [ ] Move không có `sale_line_id`: hiện số theo phiếu kèm nhãn "(theo phiếu)".
- [ ] Move chưa có line nào: "Đã soạn" là 0, vào màn move line thấy trạng thái rỗng.

**Tạo, Sửa, Xóa**
- [ ] Bấm Tạo: xuất hiện dòng mới với nguồn và đích lấy từ move, số lượng 0, popup Sửa tự mở.
- [ ] Sửa nguồn, lô, số lượng rồi OK: dữ liệu cập nhật đúng, thanh tổng cập nhật.
- [ ] Số lượng âm hoặc không phải số bị từ chối. Nhập `12,5` được hiểu là 12.5.
- [ ] Sản phẩm không quản lý lô: không hiện trường Số lô.
- [ ] Bấm Xóa: hiện popup xác nhận, Hủy thì không xóa, Xóa thì mất dòng đó.
- [ ] Odoo trả lỗi khi ghi hoặc xóa: người dùng thấy đúng thông báo, popup sửa không mất dữ liệu đã nhập.

**Giao diện**
- [ ] Kiểm tra ở rộng 360 px và 430 px: không tràn ngang, mọi nút cao tối thiểu 48 px.
- [ ] Bàn phím ảo không che nút OK trong popup Sửa.
- [ ] Nút Back của trình duyệt đi đúng màn hình trước.

---

## 14. Các điểm cần kiểm tra trên Odoo 12 thật [CẦN KIỂM TRA]

1. Tài khoản nhân viên kho có quyền `search_read` trên `stock.picking`, `stock.move`, `stock.move.line`, `stock.location`, `stock.production.lot`.
2. User kho có quyền đọc `sale.order.line` không; nếu không, mọi move tương ứng phải dùng fallback `stock.move.product_uom_qty`.
3. `stock.move.sale_line_id` có tồn tại trên instance (phụ thuộc module `sale_stock`).
4. Tên chính xác các state của `stock.picking` trên instance (`draft`, `waiting`, `confirmed`, `assigned`, `done`, `cancel`).
5. Trường `tracking` đọc được qua `product.product`.
6. User có được phép ghi `company_id` của chính mình qua `res.users.write` không.
7. Tạo move line với `qty_done = 0` trên move `confirmed` hoặc `assigned` có gây lỗi hoặc ảnh hưởng reservation không.
8. Đổi `location_id` hoặc `lot_id` trên line đã reserve có làm lệch reservation hoặc bị Odoo từ chối không.
9. `odoo-xmlrpc` trên môi trường triển khai có thể kết nối Odoo ổn định; xác minh timeout và cách thư viện trả lỗi khi Odoo mất kết nối.
10. Cấu hình CORS/deployment hiện tại có cho phép frontend gửi cookie `stto` tới backend trong môi trường thực tế không.

Với từng điểm: kiểm thử trên Odoo 12 thật nếu có môi trường; nếu chưa kiểm được, ghi rõ là chưa kiểm. Khi Odoo/XML-RPC trả lỗi, backend phải chuyển thông điệp phù hợp về frontend, không nuốt lỗi, không giả lập thành công và không tự đoán cách khắc phục.
