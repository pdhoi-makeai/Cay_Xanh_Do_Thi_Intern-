import frappe

def execute():
    print("Starting power & lighting database schema setup...")
    create_doctypes()
    seed_mock_data()
    print("Power & lighting schema setup completed successfully!")

def create_doctypes():
    # 1. Device Type
    if not frappe.db.exists("DocType", "Device Type"):
        doc = frappe.get_doc({
            "doctype": "DocType",
            "name": "Device Type",
            "module": "Cay Xanh Do Thi",
            "custom": 1,
            "autoname": "field:ten_loai",
            "naming_rule": "By fieldname",
            "fields": [
                {"fieldname": "ten_loai", "fieldtype": "Data", "label": "Tên loại thiết bị", "reqd": 1, "unique": 1}
            ],
            "permissions": [
                {"role": "Tree Manager", "read": 1, "write": 1, "create": 1, "delete": 1},
                {"role": "Tree Technician", "read": 1, "write": 0},
                {"role": "Citizen", "read": 1, "write": 0}
            ]
        })
        doc.insert(ignore_permissions=True)
        print("Created DocType: Device Type")

    # 2. Power Device
    if not frappe.db.exists("DocType", "Power Device"):
        doc = frappe.get_doc({
            "doctype": "DocType",
            "name": "Power Device",
            "module": "Cay Xanh Do Thi",
            "custom": 1,
            "autoname": "field:ma_thiet_bi",
            "naming_rule": "By fieldname",
            "fields": [
                {"fieldname": "ma_thiet_bi", "fieldtype": "Data", "label": "Mã thiết bị", "reqd": 1, "unique": 1},
                {"fieldname": "ten_thiet_bi", "fieldtype": "Data", "label": "Tên thiết bị"},
                {"fieldname": "loai_thiet_bi", "fieldtype": "Link", "options": "Device Type", "label": "Loại thiết bị"},
                {"fieldname": "khu_vuc", "fieldtype": "Link", "options": "Urban Ward", "label": "Khu vực / Phường"},
                {"fieldname": "toa_do_gps", "fieldtype": "Data", "label": "Tọa độ GPS (lat,lng)"},
                {"fieldname": "trang_thai", "fieldtype": "Select", "options": "Hoạt động tốt\nCần bảo trì\nHỏng hóc\nNguy hiểm", "label": "Trạng thái", "default": "Hoạt động tốt"},
                {"fieldname": "ngay_lap_dat", "fieldtype": "Date", "label": "Ngày lắp đặt"}
            ],
            "permissions": [
                {"role": "Tree Manager", "read": 1, "write": 1, "create": 1, "delete": 1},
                {"role": "Tree Technician", "read": 1, "write": 1, "create": 1},
                {"role": "Citizen", "read": 1, "write": 0}
            ]
        })
        doc.insert(ignore_permissions=True)
        print("Created DocType: Power Device")

    # 3. Power Incident
    if not frappe.db.exists("DocType", "Power Incident"):
        doc = frappe.get_doc({
            "doctype": "DocType",
            "name": "Power Incident",
            "module": "Cay Xanh Do Thi",
            "custom": 1,
            "autoname": "naming_series:",
            "fields": [
                {"fieldname": "naming_series", "fieldtype": "Select", "options": "PINC-.####", "label": "Series", "hidden": 1},
                {"fieldname": "tieu_de", "fieldtype": "Data", "label": "Tiêu đề sự cố", "reqd": 1},
                {"fieldname": "thiet_bi", "fieldtype": "Link", "options": "Power Device", "label": "Thiết bị liên quan"},
                {"fieldname": "khu_vuc", "fieldtype": "Link", "options": "Urban Ward", "label": "Khu vực / Phường"},
                {"fieldname": "vi_tri_gps", "fieldtype": "Data", "label": "Vị trí GPS"},
                {"fieldname": "mo_ta_chi_tiet", "fieldtype": "Text", "label": "Mô tả chi tiết"},
                {"fieldname": "hinh_anh", "fieldtype": "Attach Image", "label": "Hình ảnh minh họa"},
                {"fieldname": "muc_do_uu_tien", "fieldtype": "Select", "options": "Thấp\nTrung bình\nCao", "label": "Mức độ ưu tiên", "default": "Trung bình"},
                {"fieldname": "trang_thai", "fieldtype": "Select", "options": "Mới\nĐang xử lý\nĐã giải quyết", "label": "Trạng thái", "default": "Mới"}
            ],
            "permissions": [
                {"role": "Tree Manager", "read": 1, "write": 1, "create": 1, "delete": 1},
                {"role": "Tree Technician", "read": 1, "write": 1, "create": 1},
                {"role": "Citizen", "read": 1, "write": 1, "create": 1}
            ]
        })
        doc.insert(ignore_permissions=True)
        print("Created DocType: Power Incident")

    # 4. Work Order
    if not frappe.db.exists("DocType", "Work Order"):
        doc = frappe.get_doc({
            "doctype": "DocType",
            "name": "Work Order",
            "module": "Cay Xanh Do Thi",
            "custom": 1,
            "autoname": "naming_series:",
            "fields": [
                {"fieldname": "naming_series", "fieldtype": "Select", "options": "WO-.####", "label": "Series", "hidden": 1},
                {"fieldname": "ten_cong_viec", "fieldtype": "Data", "label": "Tên công việc", "reqd": 1},
                {"fieldname": "thiet_bi", "fieldtype": "Link", "options": "Power Device", "label": "Thiết bị"},
                {"fieldname": "su_co", "fieldtype": "Link", "options": "Power Incident", "label": "Sự cố liên quan"},
                {"fieldname": "nguoi_thuc_hien", "fieldtype": "Link", "options": "User", "label": "Người thực hiện"},
                {"fieldname": "don_vi_thi_cong", "fieldtype": "Data", "label": "Đơn vị thi công"},
                {"fieldname": "trang_thai", "fieldtype": "Select", "options": "Chưa xử lý\nĐang thực hiện\nChờ nghiệm thu\nĐã nghiệm thu đạt\nĐã nghiệm thu lỗi", "label": "Trạng thái", "default": "Chưa xử lý"},
                {"fieldname": "ngay_bat_dau", "fieldtype": "Date", "label": "Ngày bắt đầu"},
                {"fieldname": "ngay_hoan_thanh", "fieldtype": "Date", "label": "Ngày hoàn thành"},
                {"fieldname": "han_chot", "fieldtype": "Date", "label": "Hạn chót"},
                {"fieldname": "muc_do_uu_tien", "fieldtype": "Select", "options": "Low\nMedium\nHigh", "label": "Mức độ ưu tiên", "default": "Medium"},
                {"fieldname": "ket_qua_nghiem_thu", "fieldtype": "Text", "label": "Kết quả nghiệm thu"}
            ],
            "permissions": [
                {"role": "Tree Manager", "read": 1, "write": 1, "create": 1, "delete": 1},
                {"role": "Tree Technician", "read": 1, "write": 1, "create": 1},
                {"role": "Citizen", "read": 1, "write": 0}
            ]
        })
        doc.insert(ignore_permissions=True)
        print("Created DocType: Work Order")

def seed_mock_data():
    # 1. Device Types
    types = ["Đèn chiếu sáng", "Trạm biến áp", "Cột điện", "Tủ điện"]
    for t in types:
        if not frappe.db.exists("Device Type", t):
            doc = frappe.get_doc({
                "doctype": "Device Type",
                "ten_loai": t
            })
            doc.insert(ignore_permissions=True)

    # 2. Power Devices
    ward = "Phường Hòa Khánh Bắc"
    devices = [
        {"ma_thiet_bi": "TB-001", "ten_thiet_bi": "Đèn đường ngõ 45", "loai_thiet_bi": "Đèn chiếu sáng", "khu_vuc": ward, "toa_do_gps": "16.0752,108.1518", "trang_thai": "Hoạt động tốt", "ngay_lap_dat": "2024-01-15"},
        {"ma_thiet_bi": "TB-002", "ten_thiet_bi": "Trạm biến áp T1", "loai_thiet_bi": "Trạm biến áp", "khu_vuc": ward, "toa_do_gps": "16.0740,108.1500", "trang_thai": "Cần bảo trì", "ngay_lap_dat": "2023-11-20"},
        {"ma_thiet_bi": "TB-003", "ten_thiet_bi": "Cột điện số 12 đường Nguyễn Sinh Sắc", "loai_thiet_bi": "Cột điện", "khu_vuc": ward, "toa_do_gps": "16.0760,108.1530", "trang_thai": "Nguy hiểm", "ngay_lap_dat": "2022-05-10"},
        {"ma_thiet_bi": "TB-004", "ten_thiet_bi": "Tủ điện trung tâm Phường HKB", "loai_thiet_bi": "Tủ điện", "khu_vuc": ward, "toa_do_gps": "16.0770,108.1550", "trang_thai": "Hỏng hóc", "ngay_lap_dat": "2025-02-12"}
    ]
    for d in devices:
        if not frappe.db.exists("Power Device", d["ma_thiet_bi"]):
            doc = frappe.get_doc({
                "doctype": "Power Device",
                **d
            })
            doc.insert(ignore_permissions=True)

    # 3. Work Orders
    tech_email = "hau@greencity.local"
    orders = [
        {
            "ten_cong_viec": "Sửa chữa bóng đèn ngõ 45 bị hỏng",
            "thiet_bi": "TB-001",
            "nguoi_thuc_hien": tech_email,
            "don_vi_thi_cong": "Đội Điện chiếu sáng Quận Liên Chiểu",
            "trang_thai": "Chờ nghiệm thu",
            "ngay_bat_dau": "2026-06-10",
            "ngay_hoan_thanh": "2026-06-15",
            "han_chot": "2026-06-17",
            "muc_do_uu_tien": "Medium"
        },
        {
            "ten_cong_viec": "Kiểm tra định kỳ Trạm biến áp T1",
            "thiet_bi": "TB-002",
            "nguoi_thuc_hien": tech_email,
            "don_vi_thi_cong": "Công ty Điện lực Đà Nẵng",
            "trang_thai": "Đang thực hiện",
            "ngay_bat_dau": "2026-06-16",
            "han_chot": "2026-06-20",
            "muc_do_uu_tien": "High"
        },
        {
            "ten_cong_viec": "Thay thế cột điện nguy hiểm bị nghiêng",
            "thiet_bi": "TB-003",
            "nguoi_thuc_hien": tech_email,
            "don_vi_thi_cong": "Đội Thi công hạ tầng kỹ thuật",
            "trang_thai": "Chưa xử lý",
            "han_chot": "2026-06-25",
            "muc_do_uu_tien": "High"
        }
    ]
    
    # Check if there are existing work orders to prevent duplicates
    if not frappe.db.count("Work Order"):
        for o in orders:
            doc = frappe.get_doc({
                "doctype": "Work Order",
                **o
            })
            doc.insert(ignore_permissions=True)
