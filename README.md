# 🎓 Online Examination Platform (E-Exam)

Hệ thống quản lý thi trắc nghiệm trực tuyến toàn diện, hỗ trợ từ khâu xây dựng ngân hàng câu hỏi, cấu hình đề thi thông minh đến việc tổ chức thi và phân tích kết quả chuyên sâu.

---

## 🚀 Tính năng chính

### 👤 Dành cho Thí sinh (Học viên)
- **Đăng nhập đơn giản**: Tham gia thi chỉ với Mã sinh viên/SBD.
- **Chế độ Thi thử**: Luyện tập không giới hạn trước kỳ thi chính thức.
- **Giao diện thi hiện đại**: Hỗ trợ đếm ngược thời gian, tự động lưu bài, giao diện tối ưu cho trải nghiệm tập trung.
- **Xem kết quả tức thì**: Hiển thị điểm số, đáp án chi tiết và phổ điểm sau khi nộp bài.

### 👨‍🏫 Dành cho Giảng viên
- **Ngân hàng câu hỏi**: Quản lý câu hỏi theo môn học, độ khó. Hỗ trợ **Import từ Excel** cực nhanh.
- **Cấu hình Đề thi thông minh**: Thiết lập thời gian, xáo trộn câu hỏi/đáp án, điểm đạt, và giới hạn lượt thi.
- **Thống kê & Phân tích**: Xem báo cáo điểm số chi tiết từng học viên, phổ điểm dạng biểu đồ, và tỷ lệ đạt/trượt.
- **Quản lý Sinh viên**: Quản lý danh sách thí sinh dự thi theo đợt.

### 🛡️ Dành cho Quản trị viên (Admin)
- **Quản lý Tài khoản**: Cấp quyền và quản lý tài khoản Giảng viên.
- **Quản lý Môn học**: Khởi tạo và thiết lập các học phần trong hệ thống.
- **Giám sát toàn diện**: Theo dõi mọi hoạt động thi cử và dữ liệu toàn hệ thống.

---

## 🛠️ Công nghệ sử dụng

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS, Lucide Icons, Recharts, Axios |
| **Backend** | Node.js, Express, MySQL, JWT (Authentication), Bcrypt (Security) |
| **Tiện ích** | ExcelJS/XLSX (Data Import), Github Actions, ESlint |

---

## 📦 Hướng dẫn cài đặt

### 1. Yêu cầu hệ thống
- **Node.js**: Phiên bản 18.x trở lên.
- **MySQL**: Phiên bản 8.0 trở lên.

### 2. Thiết lập Backend (BE)
```bash
cd BE
npm install
# Tạo file .env từ file mẫu
cp .env.example .env
```
*Lưu ý: Mở file `.env` và điền thông tin kết nối Database của bạn.*

### 3. Thiết lập Cơ sở dữ liệu
1. Tạo một Database mới trong MySQL (VD: `tracnghiem`).
2. Import cấu trúc từ file `BE/schema.sql`.

### 4. Thiết lập Frontend (FE)
```bash
cd FE
npm install
```

---

## 🚦 Khởi chạy dự án

Bạn cần chạy đồng thời cả Backend và Frontend:

**Chạy Backend:**
```bash
cd BE
npm run dev
```

**Chạy Frontend:**
```bash
cd FE
npm run dev
```

Ứng dụng sẽ khả dụng tại: `http://localhost:5173`

---

## 🔑 Tài khoản mặc định

Sau khi cài đặt xong, bạn có thể đăng nhập bằng tài khoản quản trị mặc định:
- **Username**: `admin`
- **Password**: `admin123`
- **Link Admin**: `http://localhost:5173/admin`

---

## 📂 Cấu trúc thư mục
- `BE/`: Mã nguồn Backend (APIs, Controllers, Models).
- `FE/`: Mã nguồn Frontend (React components, Pages, Context).
- `schema.sql`: File khởi tạo cấu trúc Database.
- `.gitignore`: Cấu hình các file nhạy cảm cần ẩn.

---
---
*Phát triển bởi m4n .*
