# Cây Xanh Đô Thị (Urban Green Trees)

Dự án quản lý và hiển thị thông tin cây xanh đô thị, kết hợp bản đồ 2D và 3D. Hệ thống cung cấp các công cụ trực quan để theo dõi, bảo dưỡng và quản lý cây xanh, cũng như trực quan hoá dữ liệu dưới dạng bản đồ 3D thông qua công nghệ Cesium.

## Các tính năng chính (Features)

### 1. Bản đồ và Không gian 3D (Map & 3D Environment)
- **Bản đồ 2D (Leaflet):** Xem phân bố cây xanh trên bản đồ với các công cụ khoanh vùng và tìm kiếm.
- **Không gian 3D (Cesium):** Hiển thị các mô hình 3D của các loại cây (3D Tiles) trong môi trường trực quan. Hỗ trợ nhiều loại cây thực tế (như cây bàng Đài Loan, phượng vĩ, lim xẹt,...).
- **Công cụ tích hợp Bản đồ:** Hỗ trợ nhập và số hoá dữ liệu không gian từ OpenStreetMap.

### 2. Quản lý Dữ liệu Cây xanh
- Quản lý **Nhóm cây (Tree Groups)** và **Loài cây (Tree Species)**.
- Quản lý **Danh sách cây xanh (Tree Management)** chi tiết cho từng cây (toạ độ, tình trạng sinh trưởng, độ nghiêng...).
- Xem và báo cáo **Thống kê (Stats)** các số liệu về cây xanh (sự phân bố, hiệu suất chăm sóc...).

### 3. Quy trình Bảo dưỡng và Xử lý Sự cố (Maintenance & Incidents)
- **Quản lý sự cố (Incident Report / Incident List):** Ghi nhận, phân loại và theo dõi các sự cố liên quan đến cây xanh (như cây đổ, cành gãy).
- **Kế hoạch chăm sóc (Care Plans) & Lệnh làm việc (Work Orders):** Lập kế hoạch bảo dưỡng định kỳ và tạo lệnh điều phối nhân sự.
- **Kiểm tra và nghiệm thu (Inspection & Acceptance):** Hệ thống tạo phiếu kiểm tra tình trạng cây định kỳ và nghiệm thu kết quả công việc bảo dưỡng.

## Cấu trúc thư mục

- `fe/`: Mã nguồn Frontend (React, Vite, TypeScript, TailwindCSS, Cesium, Leaflet, Fluent UI).
- `be/v16-bench/`: Mã nguồn Backend xây dựng trên nền tảng Frappe Framework (Python/MariaDB).
- `public/` & `3d-tiles/`: Chứa các tài nguyên 3D (files `.glb`, `.i3dm`, `tileset.json`).
- `generate_3d_trees.py`: Kịch bản Python hỗ trợ tự động tạo và xử lý dữ liệu/mô hình cây xanh 3D.

---

## Hướng dẫn Cài đặt (Setup Guide)

### Yêu cầu hệ thống (Prerequisites)
- **Node.js** (Phiên bản >= 22)
- **Python** (Phiên bản >= 3.14)
- **PostgreSQL / Redis** (Dành cho Frappe Backend)
- **Frappe Bench CLI**

### 1. Cài đặt và chạy Frontend

Mở một terminal mới và di chuyển vào thư mục `fe`:
```bash
cd fe
```

Cài đặt các gói phụ thuộc (Dependencies):
```bash
npm install
```

Khởi chạy môi trường phát triển (Development Server):
```bash
npm run dev
```
Trình duyệt sẽ hiển thị Frontend tại địa chỉ do Vite cung cấp (thường là `http://localhost:5173`).

### 2. Cài đặt và chạy Backend (Frappe Bench)

Mở một terminal mới và di chuyển vào thư mục chứa bench của backend:
```bash
cd be/v16-bench
```

(Đảm bảo bạn đã cấu hình cơ sở dữ liệu cho site `greencity.localhost`).
Sau đó khởi chạy hệ thống Backend Frappe:
```bash
bench start
```

### 3. Xử lý Dữ liệu 3D (Tùy chọn)

Nếu bạn cần tạo mới hoặc cập nhật các tệp 3D tiles:
- Mở terminal ở thư mục gốc của dự án.
- Đảm bảo môi trường Python đã cài đặt các thư viện cần thiết.
- Chạy script sinh dữ liệu 3D:
```bash
python3 generate_3d_trees.py
```
