import frappe

def execute():
    print("Starting database schema setup...")
    create_roles()
    create_doctypes()
    seed_mock_data()
    print("Database schema setup completed successfully!")

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
    # 1. Urban Ward
    if not frappe.db.exists("DocType", "Urban Ward"):
        ward_doc = frappe.get_doc({
            "doctype": "DocType",
            "name": "Urban Ward",
            "module": "Cay Xanh Do Thi",
            "custom": 1,
            "autoname": "field:ward_name",
            "naming_rule": "By fieldname",
            "fields": [
                {"fieldname": "ward_name", "fieldtype": "Data", "label": "Ward Name", "reqd": 1, "unique": 1},
                {"fieldname": "district", "fieldtype": "Data", "label": "District"},
                {"fieldname": "latitude_center", "fieldtype": "Float", "label": "Latitude Center"},
                {"fieldname": "longitude_center", "fieldtype": "Float", "label": "Longitude Center"},
                {"fieldname": "area", "fieldtype": "Float", "label": "Area (sq km)"},
                {"fieldname": "population", "fieldtype": "Int", "label": "Population"},
                {"fieldname": "geojson_boundary", "fieldtype": "Code", "options": "JSON", "label": "GeoJSON Boundary"}
            ],
            "permissions": [
                {"role": "Tree Manager", "read": 1, "write": 1, "create": 1, "delete": 1, "submit": 0, "cancel": 0, "amend": 0},
                {"role": "Tree Technician", "read": 1, "write": 0, "create": 0},
                {"role": "Urban Household", "read": 1, "write": 0},
                {"role": "Citizen", "read": 1, "write": 0}
            ]
        })
        ward_doc.insert(ignore_permissions=True)
        print("Created DocType: Urban Ward")

    # 2. Urban Tree
    if not frappe.db.exists("DocType", "Urban Tree"):
        tree_doc = frappe.get_doc({
            "doctype": "DocType",
            "name": "Urban Tree",
            "module": "Cay Xanh Do Thi",
            "custom": 1,
            "autoname": "field:tree_code",
            "naming_rule": "By fieldname",
            "fields": [
                {"fieldname": "tree_code", "fieldtype": "Data", "label": "Tree Code", "reqd": 1, "unique": 1},
                {"fieldname": "species", "fieldtype": "Data", "label": "Species"},
                {"fieldname": "ward", "fieldtype": "Link", "options": "Urban Ward", "label": "Ward"},
                {"fieldname": "status", "fieldtype": "Select", "options": "Healthy\nNeeds Pruning\nDiseased\nFallen", "label": "Status", "default": "Healthy"},
                {"fieldname": "latitude", "fieldtype": "Float", "label": "Latitude"},
                {"fieldname": "longitude", "fieldtype": "Float", "label": "Longitude"},
                {"fieldname": "last_inspected", "fieldtype": "Date", "label": "Last Inspected"}
            ],
            "permissions": [
                {"role": "Tree Manager", "read": 1, "write": 1, "create": 1, "delete": 1},
                {"role": "Tree Technician", "read": 1, "write": 1, "create": 1},
                {"role": "Urban Household", "read": 1, "write": 0},
                {"role": "Citizen", "read": 1, "write": 0}
            ]
        })
        tree_doc.insert(ignore_permissions=True)
        print("Created DocType: Urban Tree")

    # 3. Urban Household
    if not frappe.db.exists("DocType", "Urban Household"):
        hh_doc = frappe.get_doc({
            "doctype": "DocType",
            "name": "Urban Household",
            "module": "Cay Xanh Do Thi",
            "custom": 1,
            "autoname": "field:household_head",
            "naming_rule": "By fieldname",
            "fields": [
                {"fieldname": "household_head", "fieldtype": "Data", "label": "Household Head", "reqd": 1},
                {"fieldname": "user_account", "fieldtype": "Link", "options": "User", "label": "User Account"},
                {"fieldname": "member_count", "fieldtype": "Int", "label": "Member Count"},
                {"fieldname": "ward", "fieldtype": "Link", "options": "Urban Ward", "label": "Ward"},
                {"fieldname": "address", "fieldtype": "Text", "label": "Address"},
                {"fieldname": "latitude", "fieldtype": "Float", "label": "Latitude"},
                {"fieldname": "longitude", "fieldtype": "Float", "label": "Longitude"}
            ],
            "permissions": [
                {"role": "Tree Manager", "read": 1, "write": 1, "create": 1, "delete": 1},
                {"role": "Tree Technician", "read": 1, "write": 1, "create": 1},
                {"role": "Urban Household", "read": 1, "write": 1, "create": 1},
                {"role": "Citizen", "read": 0, "write": 0}
            ]
        })
        hh_doc.insert(ignore_permissions=True)
        print("Created DocType: Urban Household")

    # 4. Tree Incident
    if not frappe.db.exists("DocType", "Tree Incident"):
        inc_doc = frappe.get_doc({
            "doctype": "DocType",
            "name": "Tree Incident",
            "module": "Cay Xanh Do Thi",
            "custom": 1,
            "autoname": "naming_series:",
            "fields": [
                {"fieldname": "naming_series", "fieldtype": "Select", "options": "INC-.####", "label": "Series", "hidden": 1},
                {"fieldname": "incident_title", "fieldtype": "Data", "label": "Incident Title", "reqd": 1},
                {"fieldname": "tree", "fieldtype": "Link", "options": "Urban Tree", "label": "Tree"},
                {"fieldname": "reporter", "fieldtype": "Link", "options": "Urban Household", "label": "Reporter"},
                {"fieldname": "ward", "fieldtype": "Link", "options": "Urban Ward", "label": "Ward"},
                {"fieldname": "status", "fieldtype": "Select", "options": "Pending\nIn Progress\nResolved", "label": "Status", "default": "Pending"},
                {"fieldname": "image", "fieldtype": "Attach Image", "label": "Image"},
                {"fieldname": "description", "fieldtype": "Text Editor", "label": "Description"},
                {"fieldname": "assigned_technician", "fieldtype": "Link", "options": "User", "label": "Assigned Technician"},
                {"fieldname": "ai_is_hazardous", "fieldtype": "Check", "label": "AI Is Hazardous"},
                {"fieldname": "ai_reason", "fieldtype": "Small Text", "label": "AI Reason"}
            ],
            "permissions": [
                {"role": "Tree Manager", "read": 1, "write": 1, "create": 1, "delete": 1},
                {"role": "Tree Technician", "read": 1, "write": 1, "create": 1},
                {"role": "Urban Household", "read": 1, "write": 1, "create": 1},
                {"role": "Citizen", "read": 1, "write": 1, "create": 1}
            ]
        })
        inc_doc.insert(ignore_permissions=True)
        print("Created DocType: Tree Incident")

    # 5. Work Order (for Trees)
    if frappe.db.exists("DocType", "Work Order"):
        frappe.delete_doc("DocType", "Work Order")
    
    doc = frappe.get_doc({
        "doctype": "DocType",
        "name": "Work Order",
        "module": "Cay Xanh Do Thi",
        "custom": 1,
        "autoname": "naming_series:",
        "fields": [
            {"fieldname": "naming_series", "fieldtype": "Select", "options": "WO-.####", "label": "Series", "hidden": 1},
            {"fieldname": "ten_cong_viec", "fieldtype": "Data", "label": "Tên công việc", "reqd": 1},
            {"fieldname": "tree", "fieldtype": "Link", "options": "Tai Nguyen Ha Tang", "label": "Cây xanh"},
            {"fieldname": "su_co", "fieldtype": "Link", "options": "Bao Cao Van De", "label": "Sự cố liên quan"},
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
            {"role": "Urban Household", "read": 1, "write": 0},
            {"role": "Citizen", "read": 1, "write": 0}
        ]
    })
    # 5. Work Order (for Trees)
    if frappe.db.exists("DocType", "Work Order"):
        frappe.delete_doc("DocType", "Work Order")
    
    doc = frappe.get_doc({
        "doctype": "DocType",
        "name": "Work Order",
        "module": "Cay Xanh Do Thi",
        "custom": 1,
        "autoname": "naming_series:",
        "fields": [
            {"fieldname": "naming_series", "fieldtype": "Select", "options": "WO-.####", "label": "Series", "hidden": 1},
            {"fieldname": "ten_cong_viec", "fieldtype": "Data", "label": "Tên công việc", "reqd": 1},
            {"fieldname": "tree", "fieldtype": "Link", "options": "Tai Nguyen Ha Tang", "label": "Cây xanh"},
            {"fieldname": "su_co", "fieldtype": "Link", "options": "Bao Cao Van De", "label": "Sự cố liên quan"},
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
            {"role": "Urban Household", "read": 1, "write": 0},
            {"role": "Citizen", "read": 1, "write": 0}
        ]
    })
    doc.insert(ignore_permissions=True)
    print("Created DocType: Work Order")

    # 6. Loai Cay
    if not frappe.db.exists("DocType", "Loai Cay"):
        lc_doc = frappe.get_doc({
            "doctype": "DocType",
            "name": "Loai Cay",
            "module": "Cay Xanh Do Thi",
            "custom": 1,
            "autoname": "field:ma_loai_cay",
            "naming_rule": "By fieldname",
            "fields": [
                {"fieldname": "ma_loai_cay", "fieldtype": "Data", "label": "Mã loài", "reqd": 1, "unique": 1},
                {"fieldname": "ten_loai_cay", "fieldtype": "Data", "label": "Tên loại cây", "reqd": 1},
                {"fieldname": "nhom_cay", "fieldtype": "Select", "options": "Cây bảo tồn\nCây bóng mát\nCây cảnh quan\nCây hoa\nKhác", "label": "Nhóm cây", "default": "Cây bóng mát"},
                {"fieldname": "ten_khoa_hoc", "fieldtype": "Data", "label": "Tên khoa học"},
                {"fieldname": "chieu_cao_tb", "fieldtype": "Float", "label": "Chiều cao TB (m)"},
                {"fieldname": "duong_kinh_tan_tb", "fieldtype": "Float", "label": "Đường kính tán TB (m)"},
                {"fieldname": "dac_diem_sinh_truong", "fieldtype": "Small Text", "label": "Đặc điểm sinh trưởng"},
                {"fieldname": "dac_diem_re", "fieldtype": "Small Text", "label": "Đặc điểm rễ"},
                {"fieldname": "ghi_chu_rui_ro", "fieldtype": "Small Text", "label": "Ghi chú rủi ro"},
                {"fieldname": "trang_thai_hoat_dong", "fieldtype": "Check", "label": "Đang hoạt động", "default": 1}
            ],
            "permissions": [
                {"role": "Tree Manager", "read": 1, "write": 1, "create": 1, "delete": 1},
                {"role": "Tree Technician", "read": 1, "write": 1, "create": 1},
                {"role": "Citizen", "read": 1, "write": 0}
            ]
        })
        lc_doc.insert(ignore_permissions=True)
        print("Created DocType: Loai Cay")

    # 7. Muc Do Su Co
    if not frappe.db.exists("DocType", "Muc Do Su Co"):
        frappe.get_doc({
            "doctype": "DocType",
            "name": "Muc Do Su Co",
            "module": "Cay Xanh Do Thi",
            "custom": 1,
            "autoname": "field:ten_muc_do",
            "naming_rule": "By fieldname",
            "fields": [
                {"fieldname": "ten_muc_do", "fieldtype": "Data", "label": "Tên mức độ", "reqd": 1, "unique": 1},
                {"fieldname": "mo_ta", "fieldtype": "Small Text", "label": "Mô tả"},
                {"fieldname": "trang_thai", "fieldtype": "Select", "options": "Đang dùng\nTạm dừng", "label": "Trạng thái", "default": "Đang dùng"}
            ],
            "permissions": [{"role": "Tree Manager", "read": 1, "write": 1, "create": 1, "delete": 1}, {"role": "Tree Technician", "read": 1, "write": 1, "create": 1}, {"role": "Citizen", "read": 1, "write": 0}]
        }).insert(ignore_permissions=True)
        print("Created DocType: Muc Do Su Co")

    # 8. Nguon Su Co
    if not frappe.db.exists("DocType", "Nguon Su Co"):
        frappe.get_doc({
            "doctype": "DocType",
            "name": "Nguon Su Co",
            "module": "Cay Xanh Do Thi",
            "custom": 1,
            "autoname": "field:ten_nguon",
            "naming_rule": "By fieldname",
            "fields": [
                {"fieldname": "ten_nguon", "fieldtype": "Data", "label": "Tên nguồn", "reqd": 1, "unique": 1},
                {"fieldname": "mo_ta", "fieldtype": "Small Text", "label": "Mô tả"},
                {"fieldname": "trang_thai", "fieldtype": "Select", "options": "Đang dùng\nTạm dừng", "label": "Trạng thái", "default": "Đang dùng"}
            ],
            "permissions": [{"role": "Tree Manager", "read": 1, "write": 1, "create": 1, "delete": 1}, {"role": "Tree Technician", "read": 1, "write": 1, "create": 1}, {"role": "Citizen", "read": 1, "write": 0}]
        }).insert(ignore_permissions=True)
        print("Created DocType: Nguon Su Co")

    # 9. Loai Su Co
    if not frappe.db.exists("DocType", "Loai Su Co"):
        frappe.get_doc({
            "doctype": "DocType",
            "name": "Loai Su Co",
            "module": "Cay Xanh Do Thi",
            "custom": 1,
            "autoname": "field:ten_loai",
            "naming_rule": "By fieldname",
            "fields": [
                {"fieldname": "ten_loai", "fieldtype": "Data", "label": "Tên loại", "reqd": 1, "unique": 1},
                {"fieldname": "mo_ta", "fieldtype": "Small Text", "label": "Mô tả"},
                {"fieldname": "trang_thai", "fieldtype": "Select", "options": "Đang dùng\nTạm dừng", "label": "Trạng thái", "default": "Đang dùng"}
            ],
            "permissions": [{"role": "Tree Manager", "read": 1, "write": 1, "create": 1, "delete": 1}, {"role": "Tree Technician", "read": 1, "write": 1, "create": 1}, {"role": "Citizen", "read": 1, "write": 0}]
        }).insert(ignore_permissions=True)
        print("Created DocType: Loai Su Co")

    # Create Cong Vien (Park) DocType
    if not frappe.db.exists("DocType", "Cong Vien"):
        frappe.get_doc({
            "doctype": "DocType",
            "name": "Cong Vien",
            "module": "Cay Xanh Do Thi",
            "custom": 1,
            "autoname": "field:ma_cong_vien",
            "naming_rule": "By fieldname",
            "fields": [
                {"fieldname": "ma_cong_vien", "fieldtype": "Data", "label": "Mã công viên", "reqd": 1, "unique": 1},
                {"fieldname": "ten_cong_vien", "fieldtype": "Data", "label": "Tên công viên", "reqd": 1},
                {"fieldname": "dien_tich", "fieldtype": "Float", "label": "Diện tích (m2)"},
                {"fieldname": "geojson_boundary", "fieldtype": "Code", "options": "JSON", "label": "GeoJSON Boundary"}
            ],
            "permissions": [{"role": "Tree Manager", "read": 1, "write": 1, "create": 1, "delete": 1}, {"role": "Tree Technician", "read": 1, "write": 1, "create": 1}, {"role": "Citizen", "read": 1, "write": 0}]
        }).insert(ignore_permissions=True)
        print("Created DocType: Cong Vien")

    # Update Tai Nguyen Ha Tang fields
    if frappe.db.exists("DocType", "Tai Nguyen Ha Tang"):
        tnh_doc = frappe.get_doc("DocType", "Tai Nguyen Ha Tang")
        fieldnames = [f.fieldname for f in tnh_doc.fields]
        
        # Change loai_cay to Link
        for f in tnh_doc.fields:
            if f.fieldname == "loai_cay":
                f.fieldtype = "Link"
                f.options = "Loai Cay"
                
        if "du_an" not in fieldnames:
            tnh_doc.append("fields", {"fieldname": "du_an", "fieldtype": "Data", "label": "Dự án"})
        if "tuyen_duong" not in fieldnames:
            tnh_doc.append("fields", {"fieldname": "tuyen_duong", "fieldtype": "Link", "options": "Tuyen Cay Xanh", "label": "Tuyến đường"})
        if "cong_vien" not in fieldnames:
            tnh_doc.append("fields", {"fieldname": "cong_vien", "fieldtype": "Link", "options": "Cong Vien", "label": "Công viên"})
            
        tnh_doc.save(ignore_permissions=True)
        print("Updated DocType: Tai Nguyen Ha Tang fields")

    # Update Tuyen Cay Xanh fields
    if not frappe.db.exists("DocType", "Tuyen Cay Xanh"):
        frappe.get_doc({
            "doctype": "DocType",
            "name": "Tuyen Cay Xanh",
            "module": "Cay Xanh Do Thi",
            "custom": 1,
            "autoname": "field:ma_tuyen",
            "naming_rule": "By fieldname",
            "fields": [
                {"fieldname": "ma_tuyen", "fieldtype": "Data", "label": "Mã tuyến", "reqd": 1, "unique": 1},
                {"fieldname": "ten_tuyen", "fieldtype": "Data", "label": "Tên tuyến đường", "reqd": 1},
                {"fieldname": "geojson_data", "fieldtype": "Code", "options": "JSON", "label": "GeoJSON Data"}
            ],
            "permissions": [{"role": "Tree Manager", "read": 1, "write": 1, "create": 1, "delete": 1}, {"role": "Tree Technician", "read": 1, "write": 1, "create": 1}, {"role": "Citizen", "read": 1, "write": 0}]
        }).insert(ignore_permissions=True)
        print("Created DocType: Tuyen Cay Xanh")
    else:
        tcx_doc = frappe.get_doc("DocType", "Tuyen Cay Xanh")
        fieldnames = [f.fieldname for f in tcx_doc.fields]
        if "geojson_data" not in fieldnames:
            tcx_doc.append("fields", {"fieldname": "geojson_data", "fieldtype": "Code", "options": "JSON", "label": "GeoJSON Data"})
            tcx_doc.save(ignore_permissions=True)
            print("Updated DocType: Tuyen Cay Xanh fields")

    # Update Bao Cao Van De fields
    if frappe.db.exists("DocType", "Bao Cao Van De"):
        bcvd_doc = frappe.get_doc("DocType", "Bao Cao Van De")
        fieldnames = [f.fieldname for f in bcvd_doc.fields]
        if "loai_su_co" not in fieldnames:
            bcvd_doc.append("fields", {"fieldname": "loai_su_co", "fieldtype": "Data", "label": "Loại sự cố"})
        if "nguon_su_co" not in fieldnames:
            bcvd_doc.append("fields", {"fieldname": "nguon_su_co", "fieldtype": "Link", "options": "Nguon Su Co", "label": "Nguồn sự cố"})
        for f in bcvd_doc.fields:
            if f.fieldname == "muc_do_uu_tien":
                f.options = "Khẩn cấp\nCao\nBình thường\nThấp"
                f.default = "Bình thường"
        bcvd_doc.save(ignore_permissions=True)
        print("Updated DocType: Bao Cao Van De fields")
 
def seed_mock_data():
    # 1. Ward
    ward_name = "Phường Hòa Khánh Bắc"
    if not frappe.db.exists("Urban Ward", ward_name):
        ward = frappe.get_doc({
            "doctype": "Urban Ward",
            "ward_name": ward_name,
            "district": "Liên Chiểu",
            "latitude_center": 16.0748,
            "longitude_center": 108.1512,
            "area": 14.5,
            "population": 30000,
            "geojson_boundary": '{"type": "Feature", "properties": {}, "geometry": {"type": "Polygon", "coordinates": [[[108.140, 16.080], [108.160, 16.080], [108.160, 16.060], [108.140, 16.060], [108.140, 16.080]]]}}'
        })
        ward.insert(ignore_permissions=True)
        print(f"Seeded Ward: {ward_name}")
 
    # 2. Mock Users & Roles
    users = [
        {"email": "loi@greencity.local", "first_name": "Loi Tree Manager", "role": "Tree Manager"},
        {"email": "hau@greencity.local", "first_name": "Hau Tree Technician", "role": "Tree Technician"}
    ]
    for u in users:
        if not frappe.db.exists("User", u["email"]):
            user_doc = frappe.get_doc({
                "doctype": "User",
                "email": u["email"],
                "first_name": u["first_name"],
                "send_welcome_email": 0,
                "enabled": 1,
                "roles": [{"role": u["role"]}]
            })
            user_doc.insert(ignore_permissions=True)
            user_doc.new_password = "Greencity@123456"
            user_doc.save(ignore_permissions=True)
            print(f"Created User: {u['email']} with role {u['role']}")
        else:
            user_doc = frappe.get_doc("User", u["email"])
            role_exists = any(r.role == u["role"] for r in user_doc.roles)
            if not role_exists:
                user_doc.add_roles(u["role"])
                print(f"Assigned Role {u['role']} to User {u['email']}")

    # 3. Seed Loai Cay (Species)
    mock_species = [
        {"ma_loai_cay": "SP001", "ten_loai_cay": "Lim xẹt", "nhom_cay": "Cây bóng mát", "ten_khoa_hoc": "Peltophorum pterocarpum", "chieu_cao_tb": 15.0, "duong_kinh_tan_tb": 8.0, "trang_thai_hoat_dong": 1},
        {"ma_loai_cay": "SP002", "ten_loai_cay": "Bàng đài loan", "nhom_cay": "Cây bóng mát", "ten_khoa_hoc": "Terminalia mantaly", "chieu_cao_tb": 12.0, "duong_kinh_tan_tb": 6.0, "trang_thai_hoat_dong": 1},
        {"ma_loai_cay": "SP003", "ten_loai_cay": "Phượng vĩ", "nhom_cay": "Cây hoa", "ten_khoa_hoc": "Delonix regia", "chieu_cao_tb": 10.0, "duong_kinh_tan_tb": 7.0, "trang_thai_hoat_dong": 1}
    ]
    for s in mock_species:
        if not frappe.db.exists("Loai Cay", s["ma_loai_cay"]):
            doc = frappe.get_doc({
                "doctype": "Loai Cay",
                **s
            })
            doc.insert(ignore_permissions=True)
            print(f"Seeded Species: {s['ma_loai_cay']}")

    # Seed Muc Do Su Co
    priorities = ["Sự cố mắt sáng", "Bình thường", "Cao", "Khẩn cấp"]
    for p in priorities:
        if not frappe.db.exists("Muc Do Su Co", p):
            frappe.get_doc({"doctype": "Muc Do Su Co", "ten_muc_do": p, "trang_thai": "Đang dùng"}).insert(ignore_permissions=True)
            
    # Seed Nguon Su Co
    sources = ["Kiểm tra thực địa", "Báo cáo từ người dân", "Báo cáo từ đơn vị quản lý", "Giám sát camera", "Khác"]
    for s in sources:
        if not frappe.db.exists("Nguon Su Co", s):
            frappe.get_doc({"doctype": "Nguon Su Co", "ten_nguon": s, "trang_thai": "Đang dùng"}).insert(ignore_permissions=True)
            
    # Seed Loai Su Co
    types = ["Khác", "Cây nghiêng", "Gãy cành", "Cây đổ ngã", "Thân cây mục ruỗng", "Sâu bệnh nặng", "Vướng đường điện", "Cản trở giao thông"]
    for t in types:
        if not frappe.db.exists("Loai Su Co", t):
            frappe.get_doc({"doctype": "Loai Su Co", "ten_loai": t, "trang_thai": "Đang dùng"}).insert(ignore_permissions=True)
 
    # 4. Seed mock trees into Tai Nguyen Ha Tang
    mock_assets = [
        {"ma_tai_san": "CX-001", "ten_tai_san": "Cây xanh 100", "khu_vuc": "KV-HKB", "loai_tai_san": "Cây xanh", "loai_cay": "SP001", "toa_do_gps": "16.0752,108.1518", "trang_thai": "Tốt", "chi_phi_bao_duong": 120000, "ngay_lap_dat": "2024-01-15", "du_an": "Dự án hạ tầng kỹ thuật", "tuyen_duong": "T-NVL"},
        {"ma_tai_san": "CX-002", "ten_tai_san": "Cây xanh 101", "khu_vuc": "KV-HKB", "loai_tai_san": "Cây xanh", "loai_cay": "SP002", "toa_do_gps": "16.0740,108.1500", "trang_thai": "Cần cắt tỉa", "chi_phi_bao_duong": 85000, "ngay_lap_dat": "2024-02-10", "du_an": "Dự án hạ tầng kỹ thuật", "tuyen_duong": "T-NVL"},
        {"ma_tai_san": "CX-003", "ten_tai_san": "Cây xanh 102", "khu_vuc": "KV-HKB", "loai_tai_san": "Cây xanh", "loai_cay": "SP003", "toa_do_gps": "16.0760,108.1530", "trang_thai": "Sâu bệnh", "chi_phi_bao_duong": 150000, "ngay_lap_dat": "2023-11-20", "du_an": "Dự án hạ tầng kỹ thuật", "tuyen_duong": "T-NVL"},
        {"ma_tai_san": "CX-004", "ten_tai_san": "Cây xanh 103", "khu_vuc": "KV-HKB", "loai_tai_san": "Cây xanh", "loai_cay": "SP001", "toa_do_gps": "16.0765,108.1535", "trang_thai": "Tốt", "chi_phi_bao_duong": 130000, "ngay_lap_dat": "2023-12-05", "du_an": "Dự án hạ tầng kỹ thuật", "tuyen_duong": "T-NVL"}
    ]
    for ma in mock_assets:
        if frappe.db.exists("Tai Nguyen Ha Tang", ma["ma_tai_san"]):
            doc = frappe.get_doc("Tai Nguyen Ha Tang", ma["ma_tai_san"])
            doc.update(ma)
            doc.save(ignore_permissions=True)
        else:
            doc = frappe.get_doc({
                "doctype": "Tai Nguyen Ha Tang",
                **ma
            })
            doc.insert(ignore_permissions=True)
        print(f"Seeded/Updated Asset: {ma['ma_tai_san']}")
 
    # 5. Seed mock tree Work Orders
    orders = [
        {
            "ten_cong_viec": "Thu gom cành cây gãy",
            "tree": "CX-001",
            "nguoi_thuc_hien": "Administrator",
            "don_vi_thi_cong": "Đội cây xanh Quận Liên Chiểu",
            "trang_thai": "Chờ nghiệm thu",
            "ngay_bat_dau": "2026-06-10",
            "ngay_hoan_thanh": "2026-06-15",
            "han_chot": "2026-06-17",
            "muc_do_uu_tien": "Medium"
        },
        {
            "ten_cong_viec": "Cắt tỉa cành sâu bệnh",
            "tree": "CX-002",
            "nguoi_thuc_hien": "Administrator",
            "don_vi_thi_cong": "Đội công trình đô thị",
            "trang_thai": "Đang thực hiện",
            "ngay_bat_dau": "2026-06-16",
            "han_chot": "2026-06-20",
            "muc_do_uu_tien": "High"
        },
        {
            "ten_cong_viec": "Khảo sát cây sâu bệnh",
            "tree": "CX-003",
            "nguoi_thuc_hien": "hau@greencity.local",
            "don_vi_thi_cong": "Đội công trình đô thị",
            "trang_thai": "Chưa xử lý",
            "ngay_bat_dau": "2026-06-16",
            "han_chot": "2026-06-25",
            "muc_do_uu_tien": "Low"
        }
    ]
    
    frappe.db.delete("Work Order")
    for o in orders:
        doc = frappe.get_doc({
            "doctype": "Work Order",
            **o
        })
        doc.insert(ignore_permissions=True)
        print(f"Seeded Tree Work Order: {doc.name}")

    # 6. Seed mock incidents into Bao Cao Van De
    mock_incidents = [
        {
            "name": "INC20260528172409",
            "tieu_de": "Cản trở giao thông ở đường Hùng Vương",
            "loai_su_co": "Cản trở giao thông",
            "muc_do_uu_tien": "Khẩn cấp",
            "trang_thai": "Mới",
            "nguoi_bao_cao": "Nguyễn Đức Hòa",
            "creation": "2026-05-21 10:24:00"
        },
        {
            "name": "SC-INS20260422142628",
            "tieu_de": "Sâu bệnh nặng ở cây xanh đường Nguyễn Trác",
            "loai_su_co": "Sâu bệnh nặng",
            "muc_do_uu_tien": "Bình thường",
            "trang_thai": "Đang xử lý",
            "nguoi_bao_cao": "—",
            "creation": "2026-04-22 07:26:00"
        },
        {
            "name": "INC-2026-020",
            "tieu_de": "Lim xẹt bị đổ nghiêng",
            "loai_su_co": "Cây nghiêng",
            "muc_do_uu_tien": "Khẩn cấp",
            "trang_thai": "Mới",
            "nguoi_bao_cao": "Nguyễn Văn X",
            "creation": "2026-04-11 00:00:00"
        },
        {
            "name": "INC-2026-022",
            "tieu_de": "Cành cây gãy đổ lớn",
            "loai_su_co": "Fallen Branch",
            "muc_do_uu_tien": "Cao",
            "trang_thai": "Mới",
            "nguoi_bao_cao": "Nguyễn Văn X",
            "creation": "2026-04-10 00:00:00"
        }
    ]
    for mi in mock_incidents:
        if frappe.db.exists("Bao Cao Van De", mi["name"]):
            doc = frappe.get_doc("Bao Cao Van De", mi["name"])
            doc.update(mi)
            doc.save(ignore_permissions=True)
        else:
            doc = frappe.get_doc({
                "doctype": "Bao Cao Van De",
                **mi
            })
            doc.insert(ignore_permissions=True)
            frappe.db.set_value("Bao Cao Van De", mi["name"], "creation", mi["creation"])
        print(f"Seeded Incident: {mi['name']}")
