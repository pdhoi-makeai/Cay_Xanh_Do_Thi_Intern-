import frappe

def execute():
    print("Starting smart_city database schema setup...")
    create_roles()
    create_doctypes()
    seed_mock_data()
    print("smart_city schema setup completed successfully!")

def create_roles():
    roles = ["Tree Manager", "Tree Technician", "Urban Household", "Citizen"]
    for role in roles:
        if not frappe.db.exists("Role", role):
            doc = frappe.get_doc({
                "doctype": "Role",
                "role_name": role
            })
            doc.insert(ignore_permissions=True)
            print(f"Created Role: {role}")
        else:
            print(f"Role already exists: {role}")

def create_doctypes():
    # 1. Khu Vuc
    if not frappe.db.exists("DocType", "Khu Vuc"):
        doc = frappe.get_doc({
            "doctype": "DocType",
            "name": "Khu Vuc",
            "module": "Smart City",
            "custom": 1,
            "autoname": "field:ma_khu_vuc",
            "naming_rule": "By fieldname",
            "fields": [
                {"fieldname": "ma_khu_vuc", "fieldtype": "Data", "label": "Mã khu vực", "reqd": 1, "unique": 1},
                {"fieldname": "ten_khu_vuc", "fieldtype": "Data", "label": "Tên khu vực"}
            ],
            "permissions": [
                {"role": "Tree Manager", "read": 1, "write": 1, "create": 1, "delete": 1},
                {"role": "Tree Technician", "read": 1, "write": 0},
                {"role": "Citizen", "read": 1, "write": 0}
            ]
        })
        doc.insert(ignore_permissions=True)
        print("Created DocType: Khu Vuc")

    # 2. Tai Nguyen Ha Tang
    if not frappe.db.exists("DocType", "Tai Nguyen Ha Tang"):
        doc = frappe.get_doc({
            "doctype": "DocType",
            "name": "Tai Nguyen Ha Tang",
            "module": "Smart City",
            "custom": 1,
            "autoname": "field:ma_tai_san",
            "naming_rule": "By fieldname",
            "fields": [
                {"fieldname": "ma_tai_san", "fieldtype": "Data", "label": "Mã tài sản", "reqd": 1, "unique": 1},
                {"fieldname": "ten_tai_san", "fieldtype": "Data", "label": "Tên tài sản"},
                {"fieldname": "khu_vuc", "fieldtype": "Link", "options": "Khu Vuc", "label": "Khu vực"},
                {"fieldname": "loai_tai_san", "fieldtype": "Select", "options": "Cây xanh\nKhác", "label": "Loại tài sản", "default": "Cây xanh"},
                {"fieldname": "loai_cay", "fieldtype": "Data", "label": "Loại cây"},
                {"fieldname": "toa_do_gps", "fieldtype": "Data", "label": "Tọa độ GPS (lat,lng)"},
                {"fieldname": "trang_thai", "fieldtype": "Select", "options": "Tốt\nCần cắt tỉa\nSâu bệnh\nGãy đổ", "label": "Trạng thái", "default": "Tốt"},
                {"fieldname": "chi_phi_bao_duong", "fieldtype": "Currency", "label": "Chi phí bảo dưỡng"},
                {"fieldname": "ngay_lap_dat", "fieldtype": "Date", "label": "Ngày lắp đặt / trồng"}
            ],
            "permissions": [
                {"role": "Tree Manager", "read": 1, "write": 1, "create": 1, "delete": 1},
                {"role": "Tree Technician", "read": 1, "write": 1, "create": 1},
                {"role": "Citizen", "read": 1, "write": 0}
            ]
        })
        doc.insert(ignore_permissions=True)
        print("Created DocType: Tai Nguyen Ha Tang")

    # 3. Tuyen Cay Xanh
    if not frappe.db.exists("DocType", "Tuyen Cay Xanh"):
        doc = frappe.get_doc({
            "doctype": "DocType",
            "name": "Tuyen Cay Xanh",
            "module": "Smart City",
            "custom": 1,
            "autoname": "field:ma_tuyen",
            "naming_rule": "By fieldname",
            "fields": [
                {"fieldname": "ma_tuyen", "fieldtype": "Data", "label": "Mã tuyến", "reqd": 1, "unique": 1},
                {"fieldname": "ten_tuyen", "fieldtype": "Data", "label": "Tên tuyến"},
                {"fieldname": "khu_vuc", "fieldtype": "Link", "options": "Khu Vuc", "label": "Khu vực"},
                {"fieldname": "polyline_json", "fieldtype": "Code", "options": "JSON", "label": "Polyline JSON"},
                {"fieldname": "so_diem", "fieldtype": "Int", "label": "Số điểm"},
                {"fieldname": "ghi_chu", "fieldtype": "Text", "label": "Ghi chú"}
            ],
            "permissions": [
                {"role": "Tree Manager", "read": 1, "write": 1, "create": 1, "delete": 1},
                {"role": "Tree Technician", "read": 1, "write": 1, "create": 1},
                {"role": "Citizen", "read": 1, "write": 0}
            ]
        })
        doc.insert(ignore_permissions=True)
        print("Created DocType: Tuyen Cay Xanh")

    # 4. Bao Cao Van De
    if not frappe.db.exists("DocType", "Bao Cao Van De"):
        doc = frappe.get_doc({
            "doctype": "DocType",
            "name": "Bao Cao Van De",
            "module": "Smart City",
            "custom": 1,
            "autoname": "naming_series:",
            "fields": [
                {"fieldname": "naming_series", "fieldtype": "Select", "options": "BCVD-.####", "label": "Series", "hidden": 1},
                {"fieldname": "tieu_de", "fieldtype": "Data", "label": "Tiêu đề", "reqd": 1},
                {"fieldname": "tai_nguyen", "fieldtype": "Link", "options": "Tai Nguyen Ha Tang", "label": "Tài nguyên / Cây xanh"},
                {"fieldname": "khu_vuc", "fieldtype": "Link", "options": "Khu Vuc", "label": "Khu vực"},
                {"fieldname": "vi_tri_gps", "fieldtype": "Data", "label": "Vị trí GPS"},
                {"fieldname": "mo_ta_chi_tiet", "fieldtype": "Text", "label": "Mô tả chi tiết"},
                {"fieldname": "hinh_anh_minh_hoa", "fieldtype": "Attach Image", "label": "Hình ảnh minh họa"},
                {"fieldname": "muc_do_uu_tien", "fieldtype": "Select", "options": "Thấp\nTrung bình\nCao", "label": "Mức độ ưu tiên", "default": "Trung bình"},
                {"fieldname": "nguoi_bao_cao", "fieldtype": "Data", "label": "Người báo cáo"},
                {"fieldname": "sdt_lien_he", "fieldtype": "Data", "label": "Số điện thoại liên hệ"},
                {"fieldname": "trang_thai", "fieldtype": "Select", "options": "Mới\nĐang xử lý\nĐã giải quyết\nĐã cưa hạ-di dời", "label": "Trạng thái", "default": "Mới"},
                {"fieldname": "loai_van_de", "fieldtype": "Select", "options": "Sự cố cây xanh\nKhác", "label": "Loại vấn đề", "default": "Sự cố cây xanh"},
                {"fieldname": "ai_is_hazardous", "fieldtype": "Check", "label": "AI Is Hazardous"},
                {"fieldname": "ai_reason", "fieldtype": "Small Text", "label": "AI Reason"}
            ],
            "permissions": [
                {"role": "Tree Manager", "read": 1, "write": 1, "create": 1, "delete": 1},
                {"role": "Tree Technician", "read": 1, "write": 1, "create": 1},
                {"role": "Citizen", "read": 1, "write": 1, "create": 1}
            ]
        })
        doc.insert(ignore_permissions=True)
        print("Created DocType: Bao Cao Van De")

def seed_mock_data():
    # 1. Khu Vực
    kv_name = "KV-HKB"
    if not frappe.db.exists("Khu Vuc", kv_name):
        kv = frappe.get_doc({
            "doctype": "Khu Vuc",
            "ma_khu_vuc": kv_name,
            "ten_khu_vuc": "Phường Hòa Khánh Bắc"
        })
        kv.insert(ignore_permissions=True)
        print(f"Seeded Area: {kv_name}")

    # 2. Mock Trees
    mock_trees = [
        {"ma_tai_san": "CX-001", "ten_tai_san": "Lim xẹt - Số 01", "khu_vuc": kv_name, "loai_tai_san": "Cây xanh", "loai_cay": "Lim xẹt", "toa_do_gps": "16.0752,108.1518", "trang_thai": "Tốt", "chi_phi_bao_duong": 120000, "ngay_lap_dat": "2024-01-15"},
        {"ma_tai_san": "CX-002", "ten_tai_san": "Bàng đài loan - Số 02", "khu_vuc": kv_name, "loai_tai_san": "Cây xanh", "loai_cay": "Bàng đài loan", "toa_do_gps": "16.0740,108.1500", "trang_thai": "Cần cắt tỉa", "chi_phi_bao_duong": 85000, "ngay_lap_dat": "2024-02-10"},
        {"ma_tai_san": "CX-003", "ten_tai_san": "Phượng vĩ - Số 03", "khu_vuc": kv_name, "loai_tai_san": "Cây xanh", "loai_cay": "Phượng vĩ", "toa_do_gps": "16.0760,108.1530", "trang_thai": "Sâu bệnh", "chi_phi_bao_duong": 150000, "ngay_lap_dat": "2023-11-20"}
    ]
    for t in mock_trees:
        if not frappe.db.exists("Tai Nguyen Ha Tang", t["ma_tai_san"]):
            tree = frappe.get_doc({
                "doctype": "Tai Nguyen Ha Tang",
                **t
            })
            tree.insert(ignore_permissions=True)
            print(f"Seeded Tree: {t['ma_tai_san']}")

    # 3. Seed Route
    route_name = "T-NVL"
    if not frappe.db.exists("Tuyen Cay Xanh", route_name):
        route = frappe.get_doc({
            "doctype": "Tuyen Cay Xanh",
            "ma_tuyen": route_name,
            "ten_tuyen": "Đường Nguyễn Văn Linh",
            "khu_vuc": kv_name,
            "polyline_json": '[[16.0748, 108.1512], [16.0760, 108.1530], [16.0772, 108.1548]]',
            "so_diem": 3,
            "ghi_chu": "Tuyến phố trồng cây quy hoạch trung tâm"
        })
        route.insert(ignore_permissions=True)
        print(f"Seeded Route: {route_name}")
