import frappe

def execute():
    # Thêm nhiều sự cố (Bao Cao Van De) cho CX-001 và CX-002
    mock_incidents = [
        {
            "tieu_de": "Phát hiện sâu đục thân đợt 1",
            "tai_nguyen": "CX-001",
            "khu_vuc": "KV-HKB",
            "loai_su_co": "Sâu bệnh nặng",
            "muc_do_uu_tien": "Cao",
            "trang_thai": "Đã giải quyết",
            "nguoi_bao_cao": "Người dân A",
            "creation_date": "2025-05-10 10:00:00"
        },
        {
            "tieu_de": "Phát hiện rệp sáp",
            "tai_nguyen": "CX-001",
            "khu_vuc": "KV-HKB",
            "loai_su_co": "Sâu bệnh",
            "muc_do_uu_tien": "Bình thường",
            "trang_thai": "Đã giải quyết",
            "nguoi_bao_cao": "Nhân viên kiểm tra",
            "creation_date": "2025-11-20 14:30:00"
        },
        {
            "tieu_de": "Cành cây có nguy cơ gãy do bão",
            "tai_nguyen": "CX-002",
            "khu_vuc": "KV-HKB",
            "loai_su_co": "Cây nghiêng",
            "muc_do_uu_tien": "Khẩn cấp",
            "trang_thai": "Đã giải quyết",
            "nguoi_bao_cao": "Giám sát camera",
            "creation_date": "2025-09-15 08:00:00"
        }
    ]
    
    for mi in mock_incidents:
        creation_date = mi.pop("creation_date")
        doc = frappe.get_doc({
            "doctype": "Bao Cao Van De",
            **mi
        })
        doc.insert(ignore_permissions=True)
        frappe.db.set_value("Bao Cao Van De", doc.name, "creation", creation_date)
        print(f"Seeded Incident for {mi['tai_nguyen']}: {doc.name}")

    # Thêm Work Orders (Bảo trì)
    orders = [
        {
            "ten_cong_viec": "Phun thuốc trừ sâu đục thân",
            "tree": "CX-001",
            "nguoi_thuc_hien": "Administrator",
            "don_vi_thi_cong": "Đội cây xanh Quận Liên Chiểu",
            "trang_thai": "Đã nghiệm thu đạt",
            "ngay_bat_dau": "2025-05-11",
            "ngay_hoan_thanh": "2025-05-12",
            "han_chot": "2025-05-15",
            "muc_do_uu_tien": "High"
        },
        {
            "ten_cong_viec": "Cắt tỉa tạo tán định kỳ",
            "tree": "CX-001",
            "nguoi_thuc_hien": "Administrator",
            "don_vi_thi_cong": "Đội công trình đô thị",
            "trang_thai": "Đã nghiệm thu đạt",
            "ngay_bat_dau": "2025-12-01",
            "ngay_hoan_thanh": "2025-12-02",
            "han_chot": "2025-12-05",
            "muc_do_uu_tien": "Medium"
        },
        {
            "ten_cong_viec": "Gia cố chống đỡ cây nghiêng",
            "tree": "CX-002",
            "nguoi_thuc_hien": "Administrator",
            "don_vi_thi_cong": "Đội phản ứng nhanh",
            "trang_thai": "Đã nghiệm thu đạt",
            "ngay_bat_dau": "2025-09-15",
            "ngay_hoan_thanh": "2025-09-16",
            "han_chot": "2025-09-16",
            "muc_do_uu_tien": "High"
        }
    ]
    
    for o in orders:
        doc = frappe.get_doc({
            "doctype": "Work Order",
            **o
        })
        doc.insert(ignore_permissions=True)
        print(f"Seeded Work Order for {o['tree']}: {doc.name}")

    frappe.db.commit()
    print("Seed completed!")
