import frappe

frappe.init(site="greencity.localhost", sites_path="sites")
    
frappe.connect()

print("Creating DocTypes for Acceptance...")

# 1. Ket Qua Nghiem Thu
if not frappe.db.exists("DocType", "Ket Qua Nghiem Thu"):
    doc = frappe.get_doc({
        "doctype": "DocType",
        "name": "Ket Qua Nghiem Thu",
        "module": "Cay Xanh Do Thi",
        "custom": 1,
        "autoname": "field:ten_ket_qua",
        "naming_rule": "By fieldname",
        "fields": [
            {"fieldname": "ten_ket_qua", "fieldtype": "Data", "label": "Tên kết quả", "reqd": 1, "unique": 1},
            {"fieldname": "mo_ta", "fieldtype": "Small Text", "label": "Mô tả"},
            {"fieldname": "trang_thai", "fieldtype": "Select", "options": "Đang dùng\nTạm dừng", "label": "Trạng thái", "default": "Đang dùng"}
        ],
        "permissions": [
            {"role": "Tree Manager", "read": 1, "write": 1, "create": 1, "delete": 1},
            {"role": "Tree Technician", "read": 1, "write": 1, "create": 1},
            {"role": "Citizen", "read": 1, "write": 0}
        ]
    })
    doc.insert(ignore_permissions=True)
    print("Created DocType: Ket Qua Nghiem Thu")

# 2. Bien Ban Nghiem Thu
if not frappe.db.exists("DocType", "Bien Ban Nghiem Thu"):
    doc = frappe.get_doc({
        "doctype": "DocType",
        "name": "Bien Ban Nghiem Thu",
        "module": "Cay Xanh Do Thi",
        "custom": 1,
        "autoname": "naming_series:",
        "fields": [
            {"fieldname": "naming_series", "fieldtype": "Select", "options": "ACC-.####", "label": "Series", "hidden": 1},
            {"fieldname": "phieu_cv", "fieldtype": "Link", "options": "Work Order", "label": "Phiếu công việc", "reqd": 1},
            {"fieldname": "ngay_nt", "fieldtype": "Date", "label": "Ngày nghiệm thu", "reqd": 1},
            {"fieldname": "nguoi_nt", "fieldtype": "Link", "options": "User", "label": "Người nghiệm thu", "reqd": 1},
            {"fieldname": "ket_qua", "fieldtype": "Link", "options": "Ket Qua Nghiem Thu", "label": "Kết quả", "reqd": 1},
            {"fieldname": "lam_lai", "fieldtype": "Select", "options": "Không\nCần làm lại", "label": "Làm lại", "default": "Không"},
            {"fieldname": "ghi_chu", "fieldtype": "Text", "label": "Ghi chú"}
        ],
        "permissions": [
            {"role": "Tree Manager", "read": 1, "write": 1, "create": 1, "delete": 1},
            {"role": "Tree Technician", "read": 1, "write": 1, "create": 1},
            {"role": "Citizen", "read": 1, "write": 0}
        ]
    })
    doc.insert(ignore_permissions=True)
    print("Created DocType: Bien Ban Nghiem Thu")

# 3. Seed Ket Qua Nghiem Thu
outcomes = ["Đạt", "Đạt có điều kiện", "Không đạt"]
for o in outcomes:
    if not frappe.db.exists("Ket Qua Nghiem Thu", o):
        frappe.get_doc({
            "doctype": "Ket Qua Nghiem Thu",
            "ten_ket_qua": o,
            "mo_ta": f"Mô tả kết quả {o}",
            "trang_thai": "Đang dùng"
        }).insert(ignore_permissions=True)
        print(f"Seeded Ket Qua Nghiem Thu: {o}")

# 4. Seed Bien Ban Nghiem Thu
mock_tickets = [
    {"name": "ACC20260601140022", "phieu_cv": "WO20260601135615", "ngay_nt": "2026-06-01", "nguoi_nt": "quanlydancu@huongtra.local", "ket_qua": "Đạt", "lam_lai": "Không"},
    {"name": "ACC-2026-007", "phieu_cv": "WO-2026-007", "ngay_nt": "2026-04-11", "nguoi_nt": "Administrator", "ket_qua": "Đạt", "lam_lai": "Không"},
    {"name": "ACC-2026-012", "phieu_cv": "WO-2026-012", "ngay_nt": "2026-04-09", "nguoi_nt": "Administrator", "ket_qua": "Đạt", "lam_lai": "Không"},
    {"name": "ACC-2026-014", "phieu_cv": "WO-2026-014", "ngay_nt": "2026-04-09", "nguoi_nt": "Administrator", "ket_qua": "Đạt có điều kiện", "lam_lai": "Không"},
    {"name": "ACC-2026-005", "phieu_cv": "WO-2026-005", "ngay_nt": "2026-04-03", "nguoi_nt": "Administrator", "ket_qua": "Đạt", "lam_lai": "Không"},
    {"name": "ACC-2026-002", "phieu_cv": "WO-2026-002", "ngay_nt": "2026-04-03", "nguoi_nt": "Administrator", "ket_qua": "Đạt", "lam_lai": "Không"},
    {"name": "ACC-2026-015", "phieu_cv": "WO-2026-015", "ngay_nt": "2026-03-26", "nguoi_nt": "Administrator", "ket_qua": "Đạt có điều kiện", "lam_lai": "Không"},
    {"name": "ACC-2026-001", "phieu_cv": "WO-2026-001", "ngay_nt": "2026-03-18", "nguoi_nt": "Administrator", "ket_qua": "Không đạt", "lam_lai": "Cần làm lại"}
]

# Make sure these users and work orders exist
for mt in mock_tickets:
    if not frappe.db.exists("User", mt["nguoi_nt"]):
        user_doc = frappe.get_doc({
            "doctype": "User",
            "email": mt["nguoi_nt"],
            "first_name": mt["nguoi_nt"].split("@")[0],
            "enabled": 1,
            "send_welcome_email": 0
        })
        user_doc.insert(ignore_permissions=True)
        
    if not frappe.db.exists("Work Order", mt["phieu_cv"]):
        # Create work order so validation passes
        wo_doc = frappe.get_doc({
            "doctype": "Work Order",
            "name": mt["phieu_cv"],
            "ten_cong_viec": f"Công việc sửa chữa cho {mt['phieu_cv']}",
            "trang_thai": "Đã nghiệm thu đạt" if mt["ket_qua"] != "Không đạt" else "Đã nghiệm thu lỗi",
            "muc_do_uu_tien": "Medium"
        })
        wo_doc.db_insert()
        print(f"Created Work Order: {mt['phieu_cv']}")

    if not frappe.db.exists("Bien Ban Nghiem Thu", mt["name"]):
        mt_doc = frappe.get_doc({
            "doctype": "Bien Ban Nghiem Thu",
            **mt
        })
        mt_doc.db_insert()
        print(f"Seeded Bien Ban Nghiem Thu: {mt['name']}")

frappe.db.commit()
print("Acceptance Schema initialization done!")
