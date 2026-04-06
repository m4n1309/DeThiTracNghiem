# 🎓 Online Examination Platform (E-Exam)

Hệ thống quản lý thi trắc nghiệm trực tuyến toàn diện, được thiết kế để đơn giản hóa quy trình tạo đề, tổ chức thi và phân tích kết quả. Dự án được tối ưu hóa để triển khai nhanh chóng bằng Docker.

---

## ⚡ Quick Start (Khởi chạy nhanh)

Nếu bạn đã cài đặt Docker, chỉ cần chạy lệnh sau để khởi động toàn bộ hệ thống:

```bash
docker compose up -d --build
```

- **Giao diện Web**: [http://localhost:8080](http://localhost:8080)
- **Tài khoản Admin**: `admin` / `admin123`

---

## 🚀 Tính năng nổi bật

### 👤 Thí sinh (Học viên)
- **Đăng nhập tinh gọn**: Tham gia thi ngay bằng Mã sinh viên.
- **Trải nghiệm thi tập trung**: Giao diện tối giản, tự động lưu bài, đếm ngược thời gian thực.
- **Phân tích kết quả**: Xem điểm, đáp án và phổ điểm ngay sau khi nộp bài.

### 👨‍🏫 Giảng viên
- **Ngân hàng câu hỏi**: Quản lý theo môn, mức độ khó, hỗ trợ **Import từ Excel**.
- **Cấu hình đề thi**: Thiết lập thời gian, xáo trộn nội dung, giới hạn lượt thi.
- **Thống kê chuyên sâu**: Biểu đồ phổ điểm, tỷ lệ đạt/trượt và báo cáo chi tiết.

### 🛡️ Quản trị viên (Admin)
- **Hệ thống**: Quản lý tài khoản giảng viên, môn học và giám sát toàn diện dữ liệu.

---

## 🛠️ Công nghệ sử dụng

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS, Lucide Icons, Recharts |
| **Backend** | Node.js, Express, MySQL, JWT (Authentication), Bcrypt (Security) |
| **Deployment** | **Docker & Docker Compose** (Multi-stage build) |
| **Công cụ** | ExcelJS (Import), ESLint, Nginx (Frontend Server) |

---

## 🐳 Triển khai với Docker (Khuyên dùng)

Hệ thống đã được đóng gói hoàn chỉnh bằng Docker.

1. **Yêu cầu**: Đã cài đặt [Docker Desktop](https://www.docker.com/products/docker-desktop/).
2. **Khởi chạy**:
   ```bash
   docker compose up -d --build
   ```
3. **Các cổng truy cập**:
   - **Frontend**: `http://localhost:8080`
   - **Backend API**: `http://localhost:3001`
   - **Database (External access)**: `localhost:3307`

---

## 💻 Thiết lập Thủ công (Development)

Dành cho nhà phát triển muốn can thiệp trực tiếp vào mã nguồn:

### 1. Cấu hình Backend
```bash
cd BE
npm install
cp .env.example .env # Cấu hình Database trong file này
npm run dev
```

### 2. Cấu hình Frontend
```bash
cd FE
npm install
npm run dev
```
*Giao diện dev mặc định chạy tại: `http://localhost:5173`*

---

## 📂 Cấu trúc dự án
```text
├── BE/               # Backend Node.js Express
│   ├── Dockerfile    # Cấu hình build image API
│   ├── schema.sql    # Khởi tạo Database & Admin mặc định
│   └── src/          # Mã nguồn logic xử lý
├── FE/               # Frontend React 18
│   ├── Dockerfile    # Multi-stage build với Nginx
│   ├── nginx.conf    # Cấu hình routing cho SPA
│   └── src/          # Components & Pages
└── docker-compose.yml # Điều phối toàn bộ dịch vụ
```

---

## 🔑 Thông tin mặc định
- **Quyền Admin**: `admin` / `admin123`
- **Múi giờ**: `Asia/Ho_Chi_Minh` (GMT+7) đã được cấu hình sẵn trong Docker.

---
*Phát triển và tối ưu bởi m4n.*
