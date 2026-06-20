import frappe
import random
import requests
import json
import base64
from frappe import _
from frappe.utils.file_manager import save_file

GEMINI_API_KEY = "AQ.Ab8RN6Jr574_r0Xe74HTm2s-Xw6tFNNonoo67CqZLKqZaJqc4Q"

@frappe.whitelist(allow_guest=True)
def send_otp(email):
    if not email:
        frappe.throw(_("Email is required"))
    
    otp = str(random.randint(100000, 999999))
    frappe.cache().set_value(f"otp_{email}", otp, expires_in_sec=300)
    
    # In developer mode, we print to log and also return it for easier testing
    print(f"\n[OTP FOR {email}]: {otp}\n")
    
    response = {
        "status": "success",
        "message": _("OTP has been sent to your email")
    }
    if frappe.conf.developer_mode:
        response["otp"] = otp  # Assist development/testing
        
    return response

@frappe.whitelist(allow_guest=True)
def verify_otp_login(email, otp):
    if not email or not otp:
        frappe.throw(_("Email and OTP are required"))
        
    cached_otp = frappe.cache().get_value(f"otp_{email}")
    if not cached_otp:
        frappe.throw(_("OTP expired or not found. Please request a new one."))
        
    if str(cached_otp) != str(otp):
        frappe.throw(_("Invalid OTP"))
        
    # Clear OTP after verification
    frappe.cache().delete_value(f"otp_{email}")
    
    # Check if User exists
    user_exists = frappe.db.exists("User", email)
    if not user_exists:
        # Create new Citizen user
        user_doc = frappe.get_doc({
            "doctype": "User",
            "email": email,
            "first_name": email.split("@")[0],
            "enabled": 1,
            "send_welcome_email": 0,
            "roles": [{"role": "Citizen"}]
        })
        user_doc.insert(ignore_permissions=True)
        user_doc.new_password = frappe.generate_hash()[:12]
        user_doc.save(ignore_permissions=True)
    else:
        user_doc = frappe.get_doc("User", email)
        # Check if enabled
        if not user_doc.enabled:
            # If user has roles other than Citizen, they need approval
            roles = [r.role for r in user_doc.roles]
            has_other_roles = any(role in ["Tree Manager", "Tree Technician", "Urban Household"] for role in roles)
            if has_other_roles:
                frappe.throw(_("Your account is pending manager approval."))
            else:
                # Citizens are auto-enabled
                user_doc.enabled = 1
                user_doc.save(ignore_permissions=True)
                
    # Perform login
    frappe.local.login_manager.login_as(email)
    frappe.db.commit()
    
    # Return user details
    roles = [r.role for r in user_doc.roles]
    return {
        "status": "success",
        "email": email,
        "first_name": user_doc.first_name,
        "roles": roles,
        "sid": frappe.session.sid
    }

@frappe.whitelist()
def get_map_data():
    user = frappe.session.user
    roles = frappe.get_roles(user)
    
    # Check if Manager/Technician
    is_manager = "Tree Manager" in roles or "Administrator" in roles
    is_tech = "Tree Technician" in roles
    
    # Default: see all
    trees = frappe.get_all("Urban Tree", fields=["name", "tree_code", "species", "status", "latitude", "longitude", "ward", "last_inspected"])
    households = frappe.get_all("Urban Household", fields=["name", "household_head", "member_count", "latitude", "longitude", "ward", "address"])
    wards = frappe.get_all("Urban Ward", fields=["name", "ward_name", "district", "latitude_center", "longitude_center", "geojson_boundary"])
    
    # Apply technician ward filtering if technician
    if is_tech and not is_manager:
        # Determine technician's ward if assigned (e.g. check if they have a household in a ward, or default to first ward)
        # For our mock environment, let's assume they see the ward "Phường Hòa Khánh Bắc"
        tech_ward = "Phường Hòa Khánh Bắc"
        trees = [t for t in trees if t.ward == tech_ward]
        households = [h for h in households if h.ward == tech_ward]
        
    return {
        "trees": trees,
        "households": households,
        "wards": wards
    }

@frappe.whitelist()
def report_incident(incident_title, tree, reporter_name=None, reporter_phone=None, description=None, image_base64=None, muc_do_uu_tien=None, loai_su_co=None, nguon_su_co=None, trang_thai=None):
    # Resolve area and GPS from tree (Tai Nguyen Ha Tang) if not provided
    gps = None
    area = None
    if tree:
        tree_details = frappe.db.get_value("Tai Nguyen Ha Tang", tree, ["toa_do_gps", "khu_vuc"], as_dict=True)
        if tree_details:
            gps = tree_details.toa_do_gps
            area = tree_details.khu_vuc

    # AI evaluation logic
    ai_is_hazardous = 0
    ai_reason = "No threat detected by AI."
    tree_update_status = None
    
    # Prompt Gemini API
    gemini_prompt = f"""
    Analyze this urban tree incident report.
    Title: {incident_title}
    Description: {description or 'No description provided.'}
    
    Determine if this incident represents a hazard (e.g. tree falling, large branch broken, root rot, leaning severely, blocking road).
    If it is a hazard, state which status fits the tree best: "Diseased" or "Fallen" or "Needs Pruning".
    
    You must respond strictly in JSON format with no additional text or formatting:
    {{
      "is_hazardous": true/false,
      "reason": "short explanation of the hazard and status determination",
      "tree_status": "Healthy" or "Needs Pruning" or "Diseased" or "Fallen"
    }}
    """
    
    try:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={GEMINI_API_KEY}"
        headers = {"Content-Type": "application/json"}
        
        parts = [{"text": gemini_prompt}]
        if image_base64:
            parts.append({
                "inlineData": {
                    "mimeType": "image/jpeg",
                    "data": image_base64
                }
            })
            
        payload = {
            "contents": [
                {
                    "parts": parts
                }
            ]
        }
        
        res = requests.post(url, json=payload, headers=headers, timeout=15)
        if res.status_code == 200:
            res_data = res.json()
            ai_text = res_data['candidates'][0]['content']['parts'][0]['text'].strip()
            
            # Remove markdown JSON wrapping if present
            if ai_text.startswith("```json"):
                ai_text = ai_text[7:]
            if ai_text.endswith("```"):
                ai_text = ai_text[:-3]
            ai_text = ai_text.strip()
            
            ai_result = json.loads(ai_text)
            if ai_result.get("is_hazardous"):
                ai_is_hazardous = 1
                ai_reason = ai_result.get("reason", "Hazard detected.")
                tree_update_status = ai_result.get("tree_status")
            else:
                ai_reason = ai_result.get("reason", "Normal incident reported.")
    except Exception as e:
        ai_reason = f"AI processing failed: {str(e)}"
        
    # Create incident doc
    inc_doc = frappe.get_doc({
        "doctype": "Bao Cao Van De",
        "tieu_de": incident_title,
        "tai_nguyen": tree,
        "khu_vuc": area,
        "vi_tri_gps": gps,
        "mo_ta_chi_tiet": description,
        "muc_do_uu_tien": muc_do_uu_tien or ("Khẩn cấp" if ai_is_hazardous else "Bình thường"),
        "nguoi_bao_cao": reporter_name or "—",
        "sdt_lien_he": reporter_phone or "—",
        "trang_thai": trang_thai or "Mới",
        "loai_van_de": "Sự cố cây xanh",
        "loai_su_co": loai_su_co,
        "nguon_su_co": nguon_su_co,
        "ai_is_hazardous": ai_is_hazardous,
        "ai_reason": ai_reason
    })
    inc_doc.insert(ignore_permissions=True)
    
    # Save image if provided as base64
    if image_base64:
        if "," in image_base64:
            header, image_base64 = image_base64.split(",", 1)
        
        filedata = base64.b64decode(image_base64)
        file_doc = save_file("incident_image.jpg", filedata, "Bao Cao Van De", inc_doc.name, decode=False, is_private=0)
        inc_doc.hinh_anh_minh_hoa = file_doc.file_url
        inc_doc.save(ignore_permissions=True)

    # Update linked tree status if needed
    if tree_update_status and tree_update_status != "Healthy" and tree:
        en_to_vi = {
            "Needs Pruning": "Cần cắt tỉa",
            "Diseased": "Sâu bệnh",
            "Fallen": "Gãy đổ"
        }
        trang_thai_vi = en_to_vi.get(tree_update_status, "Sâu bệnh")
        frappe.db.set_value("Tai Nguyen Ha Tang", tree, "trang_thai", trang_thai_vi)
        
    frappe.db.commit()
    
    return {
        "status": "success",
        "incident": inc_doc.name,
        "ai_is_hazardous": ai_is_hazardous,
        "ai_reason": ai_reason,
        "tree_status_updated": tree_update_status
    }

@frappe.whitelist()
def get_tree_dashboard_data(from_date=None, to_date=None, area=None, contractor=None):
    tree_filters = {"loai_tai_san": "Cây xanh"}
    incident_filters = {"loai_van_de": "Sự cố cây xanh"}
    wo_filters = {}
    
    if area:
        kv_name = frappe.db.get_value("Khu Vuc", {"ten_khu_vuc": area}, "name") or area
        tree_filters["khu_vuc"] = kv_name
        incident_filters["khu_vuc"] = kv_name
        trees_in_area = frappe.get_all("Tai Nguyen Ha Tang", filters={"khu_vuc": kv_name, "loai_tai_san": "Cây xanh"}, pluck="name")
        wo_filters["tree"] = ["in", trees_in_area] if trees_in_area else "None"

    if contractor:
        wo_filters["don_vi_thi_cong"] = contractor

    if from_date and to_date:
        incident_filters["creation"] = ["between", [from_date, to_date]]
        wo_filters["creation"] = ["between", [from_date, to_date]]

    total_trees = frappe.db.count("Tai Nguyen Ha Tang", tree_filters)
    danger_trees = frappe.db.count("Tai Nguyen Ha Tang", {**tree_filters, "trang_thai": "Gãy đổ"})
    monitoring_trees = frappe.db.count("Tai Nguyen Ha Tang", {**tree_filters, "trang_thai": "Cần cắt tỉa"})
    
    new_incidents = frappe.db.count("Bao Cao Van De", {**incident_filters, "trang_thai": "Mới"})
    in_progress_plans = frappe.db.count("Work Order", {**wo_filters, "trang_thai": "Đang thực hiện"})
    pending_acceptance = frappe.db.count("Work Order", {**wo_filters, "trang_thai": "Chờ nghiệm thu"})
    
    # Overdue tasks
    overdue_filters = {**wo_filters, "trang_thai": ["in", ["Chưa xử lý", "Đang thực hiện"]]}
    from frappe.utils import today
    current_date = today()
    overdue_filters["han_chot"] = ["<", current_date]
    overdue_tasks = frappe.db.count("Work Order", overdue_filters)
    
    total_wos = frappe.db.count("Work Order", wo_filters)
    completed_wos = frappe.db.count("Work Order", {**wo_filters, "trang_thai": "Đã nghiệm thu đạt"})
    completion_rate = (completed_wos / total_wos * 100) if total_wos > 0 else 0.0

    # build where clause for status_counts
    where_conds = ["loai_tai_san = 'Cây xanh'"]
    query_values = {}
    if area:
        kv_name = frappe.db.get_value("Khu Vuc", {"ten_khu_vuc": area}, "name") or area
        where_conds.append("khu_vuc = %(khu_vuc)s")
        query_values["khu_vuc"] = kv_name
    
    where_clause = " AND ".join(where_conds)
    status_counts = frappe.db.sql(f"""
        select trang_thai as status, count(*) as count 
        from `tabTai Nguyen Ha Tang` 
        where {where_clause}
        group by trang_thai
    """, query_values, as_dict=True)

    vi_to_en = {
        "Tốt": "Healthy",
        "Cần cắt tỉa": "Needs Pruning",
        "Sâu bệnh": "Diseased",
        "Gãy đổ": "Fallen"
    }
    tree_status_distribution = {}
    for row in status_counts:
        status_en = vi_to_en.get(row["status"], row["status"])
        tree_status_distribution[status_en] = row["count"]

    incidents = frappe.get_all("Bao Cao Van De", filters=incident_filters, fields=["creation"])
    trends = {}
    for inc in incidents:
        date_str = inc.creation.strftime("%Y-%m-%d")
        trends[date_str] = trends.get(date_str, 0) + 1
    sorted_trends = [{"date": k, "count": v} for k, v in sorted(trends.items())]

    # build where clause for wo_status_counts (Work Order)
    wo_conds = ["1=1"]
    wo_values = {}
    if area:
        kv_name = frappe.db.get_value("Khu Vuc", {"ten_khu_vuc": area}, "name") or area
        trees_in_area = frappe.get_all("Tai Nguyen Ha Tang", filters={"khu_vuc": kv_name, "loai_tai_san": "Cây xanh"}, pluck="name")
        if trees_in_area:
            wo_conds.append("tree in %(trees)s")
            wo_values["trees"] = tuple(trees_in_area)
        else:
            wo_conds.append("1=0")
            
    if contractor:
        wo_conds.append("don_vi_thi_cong = %(contractor)s")
        wo_values["contractor"] = contractor
        
    if from_date and to_date:
        wo_conds.append("creation between %(from_date)s and %(to_date)s")
        wo_values["from_date"] = from_date
        wo_values["to_date"] = to_date

    wo_where_clause = " AND ".join(wo_conds)
    wo_status_counts = frappe.db.sql(f"""
        select trang_thai, count(*) as count 
        from `tabWork Order` 
        where {wo_where_clause}
        group by trang_thai
    """, wo_values, as_dict=True)
    task_status_distribution = {row["trang_thai"]: row["count"] for row in wo_status_counts}

    return {
        "total_trees": total_trees,
        "danger_trees": danger_trees,
        "monitoring_trees": monitoring_trees,
        "new_incidents": new_incidents,
        "in_progress_plans": in_progress_plans,
        "overdue_tasks": overdue_tasks,
        "pending_acceptance": pending_acceptance,
        "completion_rate": round(completion_rate, 1),
        "tree_status_distribution": tree_status_distribution,
        "incident_trends": sorted_trends,
        "task_status_distribution": task_status_distribution
    }

@frappe.whitelist()
def get_my_work_orders():
    user = frappe.session.user
    orders = frappe.get_all("Work Order", 
                            filters={"nguoi_thuc_hien": user}, 
                            fields=["name", "ten_cong_viec", "tree", "su_co", "trang_thai", "ngay_bat_dau", "ngay_hoan_thanh", "han_chot", "muc_do_uu_tien", "don_vi_thi_cong", "ket_qua_nghiem_thu"])
    
    for order in orders:
        if order.tree:
            order.device_name = frappe.db.get_value("Tai Nguyen Ha Tang", order.tree, "loai_cay")
            gps = frappe.db.get_value("Tai Nguyen Ha Tang", order.tree, "toa_do_gps")
            order.device_gps = gps if gps else "—"
    return orders

@frappe.whitelist()
def submit_acceptance_result(work_order, status, notes=None):
    if not work_order or not status:
        frappe.throw(_("Work Order and Status are required"))
        
    doc = frappe.get_doc("Work Order", work_order)
    doc.trang_thai = status
    if notes:
        doc.ket_qua_nghiem_thu = notes
    doc.save(ignore_permissions=True)
    
    # Auto-revert tree status to healthy if work order is successfully accepted
    if status == "Đã nghiệm thu đạt" and doc.tree:
        frappe.db.set_value("Tai Nguyen Ha Tang", doc.tree, "trang_thai", "Tốt")
        
    frappe.db.commit()
    
    return {"status": "success", "message": _("Work Order updated successfully")}

# Tree Species APIs
@frappe.whitelist()
def get_tree_species(nhom_cay=None):
    filters = {}
    if nhom_cay:
        filters["nhom_cay"] = nhom_cay
    return frappe.get_all("Loai Cay", filters=filters, fields=["name", "ma_loai_cay", "ten_loai_cay", "nhom_cay", "ten_khoa_hoc", "chieu_cao_tb", "duong_kinh_tan_tb", "dac_diem_sinh_truong", "dac_diem_re", "ghi_chu_rui_ro", "trang_thai_hoat_dong", "model_3d", "scale_3d"])

@frappe.whitelist()
def create_tree_species(data):
    if isinstance(data, str):
        data = json.loads(data)
    
    ma = data.get("ma_loai_cay")
    if not ma:
        frappe.throw(_("Mã loài là bắt buộc"))
        
    if frappe.db.exists("Loai Cay", ma):
        doc = frappe.get_doc("Loai Cay", ma)
        doc.update(data)
        doc.save(ignore_permissions=True)
    else:
        doc = frappe.get_doc({
            "doctype": "Loai Cay",
            **data
        })
        doc.insert(ignore_permissions=True)
    frappe.db.commit()
    return doc

@frappe.whitelist()
def delete_tree_species(ma_loai_cay):
    if frappe.db.exists("Loai Cay", ma_loai_cay):
        frappe.delete_doc("Loai Cay", ma_loai_cay)
        frappe.db.commit()
        return {"status": "success"}
    return {"status": "error", "message": "Species not found"}

# Tree Asset APIs
@frappe.whitelist()
def get_trees_list(du_an=None, tuyen_duong=None, khu_vuc=None, search=None):
    filters = {"loai_tai_san": "Cây xanh"}
    if du_an:
        filters["du_an"] = du_an
    if tuyen_duong:
        filters["tuyen_duong"] = tuyen_duong
    if khu_vuc:
        filters["khu_vuc"] = khu_vuc
    if search:
        filters["ten_tai_san"] = ["like", f"%{search}%"]
        
    trees = frappe.get_all("Tai Nguyen Ha Tang", 
                           filters=filters, 
                           fields=["name", "ma_tai_san", "ten_tai_san", "loai_cay", "khu_vuc", "tuyen_duong", "cong_vien", "du_an", "toa_do_gps", "trang_thai", "chi_phi_bao_duong", "ngay_lap_dat"])
    
    for t in trees:
        t.tuyen_duong_title = frappe.db.get_value("Tuyen Cay Xanh", t.tuyen_duong, "ten_tuyen") if t.tuyen_duong else ""
        t.cong_vien_title = frappe.db.get_value("Cong Vien", t.cong_vien, "ten_cong_vien") if t.cong_vien else ""
        t.khu_vuc_title = frappe.db.get_value("Khu Vuc", t.khu_vuc, "ten_khu_vuc") if t.khu_vuc else ""
        
        if t.loai_cay:
            species_details = frappe.db.get_value("Loai Cay", t.loai_cay, ["ten_loai_cay", "model_3d", "scale_3d"], as_dict=True)
            if species_details:
                t.loai_cay_title = species_details.ten_loai_cay
                t.model_3d = species_details.model_3d
                t.scale_3d = species_details.scale_3d
            else:
                t.loai_cay_title = t.loai_cay
                t.model_3d = ""
                t.scale_3d = 1.0
        else:
            t.loai_cay_title = ""
            t.model_3d = ""
            t.scale_3d = 1.0
        
    return trees

@frappe.whitelist()
def create_tree_asset(data):
    if isinstance(data, str):
        data = json.loads(data)
        
    ma = data.get("ma_tai_san")
    if not ma:
        frappe.throw(_("Mã tài sản là bắt buộc"))
        
    if frappe.db.exists("Tai Nguyen Ha Tang", ma):
        doc = frappe.get_doc("Tai Nguyen Ha Tang", ma)
        doc.update(data)
        doc.save(ignore_permissions=True)
    else:
        data["loai_tai_san"] = "Cây xanh"
        doc = frappe.get_doc({
            "doctype": "Tai Nguyen Ha Tang",
            **data
        })
        doc.insert(ignore_permissions=True)
    frappe.db.commit()
    return doc

@frappe.whitelist()
def delete_tree_asset(ma_tai_san):
    if frappe.db.exists("Tai Nguyen Ha Tang", ma_tai_san):
        frappe.delete_doc("Tai Nguyen Ha Tang", ma_tai_san)
        frappe.db.commit()
        return {"status": "success"}
    return {"status": "error", "message": "Tree not found"}

# Tree Incident Management APIs
@frappe.whitelist()
def get_incidents_list(loai_su_co=None, muc_do_uu_tien=None, trang_thai=None, search=None):
    filters = {}
    if loai_su_co:
        filters["loai_su_co"] = loai_su_co
    if muc_do_uu_tien:
        filters["muc_do_uu_tien"] = muc_do_uu_tien
    if trang_thai:
        filters["trang_thai"] = trang_thai
    if search:
        # Match title, ID or reporter name
        filters["or"] = [
            ["tieu_de", "like", f"%{search}%"],
            ["name", "like", f"%{search}%"],
            ["nguoi_bao_cao", "like", f"%{search}%"]
        ]
        
    incidents = frappe.get_all("Bao Cao Van De", 
                               filters=filters, 
                               fields=["name", "tieu_de", "tai_nguyen", "khu_vuc", "vi_tri_gps", "mo_ta_chi_tiet", "hinh_anh_minh_hoa", "muc_do_uu_tien", "nguoi_bao_cao", "sdt_lien_he", "trang_thai", "loai_van_de", "creation", "loai_su_co"],
                               order_by="creation desc")
    return incidents

@frappe.whitelist()
def delete_incident(name):
    if frappe.db.exists("Bao Cao Van De", name):
        frappe.delete_doc("Bao Cao Van De", name)
        frappe.db.commit()
        return {"status": "success"}
    return {"status": "error", "message": "Incident not found"}

@frappe.whitelist()
def update_incident(name, data):
    if isinstance(data, str):
        data = json.loads(data)
    if frappe.db.exists("Bao Cao Van De", name):
        doc = frappe.get_doc("Bao Cao Van De", name)
        doc.update(data)
        doc.save(ignore_permissions=True)
        frappe.db.commit()
        return doc
    return None

# Priority CRUD
@frappe.whitelist()
def get_priorities_list(search=None):
    filters = {}
    if search:
        filters["ten_muc_do"] = ["like", f"%{search}%"]
    return frappe.get_all("Muc Do Su Co", filters=filters, fields=["name", "ten_muc_do", "mo_ta", "trang_thai"])

@frappe.whitelist()
def create_priority(data):
    if isinstance(data, str):
        data = json.loads(data)
    name = data.get("ten_muc_do")
    if not name:
        frappe.throw(_("Tên mức độ là bắt buộc"))
    if frappe.db.exists("Muc Do Su Co", name):
        doc = frappe.get_doc("Muc Do Su Co", name)
        doc.update(data)
        doc.save(ignore_permissions=True)
    else:
        doc = frappe.get_doc({"doctype": "Muc Do Su Co", **data})
        doc.insert(ignore_permissions=True)
    frappe.db.commit()
    return doc

@frappe.whitelist()
def delete_priority(name):
    if frappe.db.exists("Muc Do Su Co", name):
        frappe.delete_doc("Muc Do Su Co", name)
        frappe.db.commit()
        return {"status": "success"}
    return {"status": "error", "message": "Priority not found"}

# Source CRUD
@frappe.whitelist()
def get_sources_list(search=None):
    filters = {}
    if search:
        filters["ten_nguon"] = ["like", f"%{search}%"]
    return frappe.get_all("Nguon Su Co", filters=filters, fields=["name", "ten_nguon", "mo_ta", "trang_thai"])

@frappe.whitelist()
def create_source(data):
    if isinstance(data, str):
        data = json.loads(data)
    name = data.get("ten_nguon")
    if not name:
        frappe.throw(_("Tên nguồn là bắt buộc"))
    if frappe.db.exists("Nguon Su Co", name):
        doc = frappe.get_doc("Nguon Su Co", name)
        doc.update(data)
        doc.save(ignore_permissions=True)
    else:
        doc = frappe.get_doc({"doctype": "Nguon Su Co", **data})
        doc.insert(ignore_permissions=True)
    frappe.db.commit()
    return doc

@frappe.whitelist()
def delete_source(name):
    if frappe.db.exists("Nguon Su Co", name):
        frappe.delete_doc("Nguon Su Co", name)
        frappe.db.commit()
        return {"status": "success"}
    return {"status": "error", "message": "Source not found"}

# Type CRUD
@frappe.whitelist()
def get_types_list(search=None):
    filters = {}
    if search:
        filters["ten_loai"] = ["like", f"%{search}%"]
    return frappe.get_all("Loai Su Co", filters=filters, fields=["name", "ten_loai", "mo_ta", "trang_thai"])

@frappe.whitelist()
def create_type(data):
    if isinstance(data, str):
        data = json.loads(data)
    name = data.get("ten_loai")
    if not name:
        frappe.throw(_("Tên loại là bắt buộc"))
    if frappe.db.exists("Loai Su Co", name):
        doc = frappe.get_doc("Loai Su Co", name)
        doc.update(data)
        doc.save(ignore_permissions=True)
    else:
        doc = frappe.get_doc({"doctype": "Loai Su Co", **data})
        doc.insert(ignore_permissions=True)
    frappe.db.commit()
    return doc

@frappe.whitelist()
def delete_type(name):
    if frappe.db.exists("Loai Su Co", name):
        frappe.delete_doc("Loai Su Co", name)
        frappe.db.commit()
        return {"status": "success"}
    return {"status": "error", "message": "Type not found"}

@frappe.whitelist()
def get_areas_list():
    return frappe.get_all("Khu Vuc", fields=["name", "ten_khu_vuc"])

@frappe.whitelist()
def get_routes_list():
    return frappe.get_all("Tuyen Cay Xanh", fields=["name", "ten_tuyen", "geojson_data"])

@frappe.whitelist()
def update_route_geometry(name, geojson_data):
    if not frappe.db.exists("Tuyen Cay Xanh", name):
        frappe.throw(_("Tuyến đường không tồn tại"))
    doc = frappe.get_doc("Tuyen Cay Xanh", name)
    doc.geojson_data = geojson_data
    doc.save(ignore_permissions=True)
    frappe.db.commit()
    return doc

# Cong Vien APIs
@frappe.whitelist()
def get_parks_list():
    return frappe.get_all("Cong Vien", fields=["name", "ma_cong_vien", "ten_cong_vien", "dien_tich", "geojson_boundary"])

@frappe.whitelist()
def create_park(data):
    if isinstance(data, str):
        data = json.loads(data)
    doc = frappe.get_doc({"doctype": "Cong Vien", **data})
    doc.insert(ignore_permissions=True)
    frappe.db.commit()
    return doc

@frappe.whitelist()
def update_park_geometry(name, geojson_boundary, dien_tich=None):
    if not frappe.db.exists("Cong Vien", name):
        frappe.throw(_("Công viên không tồn tại"))
    doc = frappe.get_doc("Cong Vien", name)
    doc.geojson_boundary = geojson_boundary
    if dien_tich:
        doc.dien_tich = dien_tich
    doc.save(ignore_permissions=True)
    frappe.db.commit()
    return doc

# 1. Loai Kiem Tra CRUD
@frappe.whitelist()
def get_inspection_types_list(search=None):
    filters = {}
    if search:
        filters["ten_loai"] = ["like", f"%{search}%"]
    return frappe.get_all("Loai Kiem Tra", filters=filters, fields=["name", "ten_loai", "mo_ta", "trang_thai"])

@frappe.whitelist()
def create_inspection_type(data):
    if isinstance(data, str):
        data = json.loads(data)
    name = data.get("ten_loai")
    if not name:
        frappe.throw(_("Tên loại là bắt buộc"))
    if frappe.db.exists("Loai Kiem Tra", name):
        doc = frappe.get_doc("Loai Kiem Tra", name)
        doc.update(data)
        doc.save(ignore_permissions=True)
    else:
        doc = frappe.get_doc({"doctype": "Loai Kiem Tra", **data})
        doc.insert(ignore_permissions=True)
    frappe.db.commit()
    return doc

@frappe.whitelist()
def delete_inspection_type(name):
    if frappe.db.exists("Loai Kiem Tra", name):
        frappe.delete_doc("Loai Kiem Tra", name)
        frappe.db.commit()
        return {"status": "success"}
    return {"status": "error", "message": "Inspection Type not found"}

# 2. Trang Thai Nghieng CRUD
@frappe.whitelist()
def get_leaning_statuses_list(search=None):
    filters = {}
    if search:
        filters["ten_trang_thai"] = ["like", f"%{search}%"]
    return frappe.get_all("Trang Thai Nghieng", filters=filters, fields=["name", "ten_trang_thai", "mo_ta", "trang_thai"])

@frappe.whitelist()
def create_leaning_status(data):
    if isinstance(data, str):
        data = json.loads(data)
    name = data.get("ten_trang_thai")
    if not name:
        frappe.throw(_("Tên trạng thái là bắt buộc"))
    if frappe.db.exists("Trang Thai Nghieng", name):
        doc = frappe.get_doc("Trang Thai Nghieng", name)
        doc.update(data)
        doc.save(ignore_permissions=True)
    else:
        doc = frappe.get_doc({"doctype": "Trang Thai Nghieng", **data})
        doc.insert(ignore_permissions=True)
    frappe.db.commit()
    return doc

@frappe.whitelist()
def delete_leaning_status(name):
    if frappe.db.exists("Trang Thai Nghieng", name):
        frappe.delete_doc("Trang Thai Nghieng", name)
        frappe.db.commit()
        return {"status": "success"}
    return {"status": "error", "message": "Leaning status not found"}

# 3. Trang Thai Sau Benh CRUD
@frappe.whitelist()
def get_disease_statuses_list(search=None):
    filters = {}
    if search:
        filters["ten_trang_thai"] = ["like", f"%{search}%"]
    return frappe.get_all("Trang Thai Sau Benh", filters=filters, fields=["name", "ten_trang_thai", "mo_ta", "trang_thai"])

@frappe.whitelist()
def create_disease_status(data):
    if isinstance(data, str):
        data = json.loads(data)
    name = data.get("ten_trang_thai")
    if not name:
        frappe.throw(_("Tên trạng thái là bắt buộc"))
    if frappe.db.exists("Trang Thai Sau Benh", name):
        doc = frappe.get_doc("Trang Thai Sau Benh", name)
        doc.update(data)
        doc.save(ignore_permissions=True)
    else:
        doc = frappe.get_doc({"doctype": "Trang Thai Sau Benh", **data})
        doc.insert(ignore_permissions=True)
    frappe.db.commit()
    return doc

@frappe.whitelist()
def delete_disease_status(name):
    if frappe.db.exists("Trang Thai Sau Benh", name):
        frappe.delete_doc("Trang Thai Sau Benh", name)
        frappe.db.commit()
        return {"status": "success"}
    return {"status": "error", "message": "Disease status not found"}

# 4. Muc An Toan CRUD
@frappe.whitelist()
def get_safety_levels_list(search=None):
    filters = {}
    if search:
        filters["ten_muc_do"] = ["like", f"%{search}%"]
    return frappe.get_all("Muc An Toan", filters=filters, fields=["name", "ten_muc_do", "mo_ta", "trang_thai"])

@frappe.whitelist()
def create_safety_level(data):
    if isinstance(data, str):
        data = json.loads(data)
    name = data.get("ten_muc_do")
    if not name:
        frappe.throw(_("Tên mức độ là bắt buộc"))
    if frappe.db.exists("Muc An Toan", name):
        doc = frappe.get_doc("Muc An Toan", name)
        doc.update(data)
        doc.save(ignore_permissions=True)
    else:
        doc = frappe.get_doc({"doctype": "Muc An Toan", **data})
        doc.insert(ignore_permissions=True)
    frappe.db.commit()
    return doc

@frappe.whitelist()
def delete_safety_level(name):
    if frappe.db.exists("Muc An Toan", name):
        frappe.delete_doc("Muc An Toan", name)
        frappe.db.commit()
        return {"status": "success"}
    return {"status": "error", "message": "Safety level not found"}

# 5. Tinh Trang Bo Phan CRUD
@frappe.whitelist()
def get_part_statuses_list(search=None):
    filters = {}
    if search:
        filters["ten_tinh_trang"] = ["like", f"%{search}%"]
    return frappe.get_all("Tinh Trang Bo Phan", filters=filters, fields=["name", "ten_tinh_trang", "mo_ta", "trang_thai"])

@frappe.whitelist()
def create_part_status(data):
    if isinstance(data, str):
        data = json.loads(data)
    name = data.get("ten_tinh_trang")
    if not name:
        frappe.throw(_("Tên tình trạng là bắt buộc"))
    if frappe.db.exists("Tinh Trang Bo Phan", name):
        doc = frappe.get_doc("Tinh Trang Bo Phan", name)
        doc.update(data)
        doc.save(ignore_permissions=True)
    else:
        doc = frappe.get_doc({"doctype": "Tinh Trang Bo Phan", **data})
        doc.insert(ignore_permissions=True)
    frappe.db.commit()
    return doc

@frappe.whitelist()
def delete_part_status(name):
    if frappe.db.exists("Tinh Trang Bo Phan", name):
        frappe.delete_doc("Tinh Trang Bo Phan", name)
        frappe.db.commit()
        return {"status": "success"}
    return {"status": "error", "message": "Part status not found"}

# 6. Nhom Cay CRUD
@frappe.whitelist()
def get_tree_groups_list(search=None):
    filters = {}
    if search:
        filters["ten_nhom"] = ["like", f"%{search}%"]
    return frappe.get_all("Nhom Cay", filters=filters, fields=["name", "ten_nhom", "mo_ta", "trang_thai"])

@frappe.whitelist()
def create_tree_group(data):
    if isinstance(data, str):
        data = json.loads(data)
    name = data.get("ten_nhom")
    if not name:
        frappe.throw(_("Tên nhóm là bắt buộc"))
    if frappe.db.exists("Nhom Cay", name):
        doc = frappe.get_doc("Nhom Cay", name)
        doc.update(data)
        doc.save(ignore_permissions=True)
    else:
        doc = frappe.get_doc({"doctype": "Nhom Cay", **data})
        doc.insert(ignore_permissions=True)
    frappe.db.commit()
    return doc

@frappe.whitelist()
def delete_tree_group(name):
    if frappe.db.exists("Nhom Cay", name):
        frappe.delete_doc("Nhom Cay", name)
        frappe.db.commit()
        return {"status": "success"}
    return {"status": "error", "message": "Tree group not found"}

# 7. Phieu Kiem Tra CRUD
@frappe.whitelist()
def get_inspection_tickets_list(search=None, loai_kt=None, an_toan=None, trang_thai=None):
    filters = {}
    if loai_kt:
        filters["loai_kt"] = loai_kt
    if an_toan:
        filters["an_toan"] = an_toan
    if trang_thai:
        filters["trang_thai"] = trang_thai
    if search:
        filters["or"] = [
            ["ma_phieu", "like", f"%{search}%"],
            ["nguoi_kt", "like", f"%{search}%"],
            ["tai_nguyen", "like", f"%{search}%"]
        ]
    return frappe.get_all("Phieu Kiem Tra", filters=filters, fields=["name", "ma_phieu", "ngay_kt", "gio_kt", "loai_kt", "nguoi_kt", "an_toan", "trang_thai", "de_xuat", "tai_nguyen", "trang_thai_ngieng", "trang_thai_sau_benh", "tinh_trang_bo_phan", "ghi_chu"], order_by="ngay_kt desc, gio_kt desc")

@frappe.whitelist()
def create_inspection_ticket(data):
    if isinstance(data, str):
        data = json.loads(data)
    name = data.get("ma_phieu")
    if not name:
        frappe.throw(_("Mã phiếu là bắt buộc"))
    if frappe.db.exists("Phieu Kiem Tra", name):
        doc = frappe.get_doc("Phieu Kiem Tra", name)
        doc.update(data)
        doc.save(ignore_permissions=True)
    else:
        doc = frappe.get_doc({"doctype": "Phieu Kiem Tra", **data})
        doc.insert(ignore_permissions=True)
    frappe.db.commit()
    return doc

@frappe.whitelist()
def delete_inspection_ticket(name):
    if frappe.db.exists("Phieu Kiem Tra", name):
        frappe.delete_doc("Phieu Kiem Tra", name)
        frappe.db.commit()
        return {"status": "success"}
    return {"status": "error", "message": "Inspection ticket not found"}

# 1. Loai Ke Hoach CRUD
@frappe.whitelist()
def get_plan_types_list(search=None):
    filters = {}
    if search:
        filters["ten_loai"] = ["like", f"%{search}%"]
    return frappe.get_all("Loai Ke Hoach", filters=filters, fields=["name", "ten_loai", "mo_ta", "trang_thai"])

@frappe.whitelist()
def create_plan_type(data):
    if isinstance(data, str):
        data = json.loads(data)
    name = data.get("ten_loai")
    if not name:
        frappe.throw(_("Tên loại là bắt buộc"))
    if frappe.db.exists("Loai Ke Hoach", name):
        doc = frappe.get_doc("Loai Ke Hoach", name)
        doc.update(data)
        doc.save(ignore_permissions=True)
    else:
        doc = frappe.get_doc({"doctype": "Loai Ke Hoach", **data})
        doc.insert(ignore_permissions=True)
    frappe.db.commit()
    return doc

@frappe.whitelist()
def delete_plan_type(name):
    if frappe.db.exists("Loai Ke Hoach", name):
        frappe.delete_doc("Loai Ke Hoach", name)
        frappe.db.commit()
        return {"status": "success"}
    return {"status": "error", "message": "Plan Type not found"}

# 2. Muc Uu Tien (Care Plan) CRUD
@frappe.whitelist()
def get_plan_priorities_list(search=None):
    filters = {}
    if search:
        filters["ten_muc_do"] = ["like", f"%{search}%"]
    return frappe.get_all("Muc Uu Tien", filters=filters, fields=["name", "ten_muc_do", "mo_ta", "trang_thai"])

@frappe.whitelist()
def create_plan_priority(data):
    if isinstance(data, str):
        data = json.loads(data)
    name = data.get("ten_muc_do")
    if not name:
        frappe.throw(_("Tên mức độ là bắt buộc"))
    if frappe.db.exists("Muc Uu Tien", name):
        doc = frappe.get_doc("Muc Uu Tien", name)
        doc.update(data)
        doc.save(ignore_permissions=True)
    else:
        doc = frappe.get_doc({"doctype": "Muc Uu Tien", **data})
        doc.insert(ignore_permissions=True)
    frappe.db.commit()
    return doc

@frappe.whitelist()
def delete_plan_priority(name):
    if frappe.db.exists("Muc Uu Tien", name):
        frappe.delete_doc("Muc Uu Tien", name)
        frappe.db.commit()
        return {"status": "success"}
    return {"status": "error", "message": "Plan Priority not found"}

# 3. Ke Hoach Cham Soc CRUD
@frappe.whitelist()
def get_care_plans_list(search=None, loai_ke_hoach=None, muc_uu_tien=None, trang_thai=None):
    filters = {}
    if loai_ke_hoach:
        filters["loai_ke_hoach"] = loai_ke_hoach
    if muc_uu_tien:
        filters["muc_uu_tien"] = muc_uu_tien
    if trang_thai:
        filters["trang_thai"] = trang_thai
    if search:
        filters["or"] = [
            ["ma_kh", "like", f"%{search}%"],
            ["ten_ke_hoach", "like", f"%{search}%"]
        ]
    return frappe.get_all("Ke Hoach Cham Soc", filters=filters, fields=["name", "ma_kh", "ten_ke_hoach", "loai_ke_hoach", "muc_uu_tien", "ngay_bat_dau", "trang_thai", "ghi_chu"], order_by="ma_kh desc")

@frappe.whitelist()
def create_care_plan(data):
    if isinstance(data, str):
        data = json.loads(data)
    name = data.get("ma_kh")
    if not name:
        frappe.throw(_("Mã kế hoạch là bắt buộc"))
    if frappe.db.exists("Ke Hoach Cham Soc", name):
        doc = frappe.get_doc("Ke Hoach Cham Soc", name)
        doc.update(data)
        doc.save(ignore_permissions=True)
    else:
        doc = frappe.get_doc({"doctype": "Ke Hoach Cham Soc", **data})
        doc.insert(ignore_permissions=True)
    frappe.db.commit()
    return doc

@frappe.whitelist()
def delete_care_plan(name):
    if frappe.db.exists("Ke Hoach Cham Soc", name):
        frappe.delete_doc("Ke Hoach Cham Soc", name)
        frappe.db.commit()
        return {"status": "success"}
    return {"status": "error", "message": "Care Plan not found"}

# 1. Loai Hanh Dong CRUD
@frappe.whitelist()
def get_action_types_list(search=None):
    filters = {}
    if search:
        filters["ten_hanh_dong"] = ["like", f"%{search}%"]
    return frappe.get_all("Loai Hanh Dong", filters=filters, fields=["name", "ten_hanh_dong", "mo_ta", "trang_thai"])

@frappe.whitelist()
def create_action_type(data):
    if isinstance(data, str):
        data = json.loads(data)
    name = data.get("ten_hanh_dong")
    if not name:
        frappe.throw(_("Tên hành động là bắt buộc"))
    if frappe.db.exists("Loai Hanh Dong", name):
        doc = frappe.get_doc("Loai Hanh Dong", name)
        doc.update(data)
        doc.save(ignore_permissions=True)
    else:
        doc = frappe.get_doc({"doctype": "Loai Hanh Dong", **data})
        doc.insert(ignore_permissions=True)
    frappe.db.commit()
    return doc

@frappe.whitelist()
def delete_action_type(name):
    if frappe.db.exists("Loai Hanh Dong", name):
        frappe.delete_doc("Loai Hanh Dong", name)
        frappe.db.commit()
        return {"status": "success"}
    return {"status": "error", "message": "Action Type not found"}

# 2. Nhat Ky Thi Cong CRUD
@frappe.whitelist()
def get_work_logs_list(search=None, work_order=None):
    filters = {}
    if work_order:
        filters["work_order"] = work_order
    if search:
        filters["noi_dung"] = ["like", f"%{search}%"]
    logs = frappe.get_all("Nhat Ky Thi Cong", filters=filters, fields=["name", "ngay_ghi", "work_order", "nguoi_ghi", "noi_dung", "hinh_anh", "trang_thai_hoan_thanh"], order_by="ngay_ghi desc")
    for log in logs:
        log.ten_cong_viec = frappe.db.get_value("Work Order", log.work_order, "ten_cong_viec") if log.work_order else ""
    return logs

@frappe.whitelist()
def create_work_log(data):
    if isinstance(data, str):
        data = json.loads(data)
    
    # Generate temporary / auto-name if not provided since name uses hash
    doc = frappe.get_doc({"doctype": "Nhat Ky Thi Cong", **data})
    doc.insert(ignore_permissions=True)
    frappe.db.commit()
    return doc

@frappe.whitelist()
def delete_work_log(name):
    if frappe.db.exists("Nhat Ky Thi Cong", name):
        frappe.delete_doc("Nhat Ky Thi Cong", name)
        frappe.db.commit()
        return {"status": "success"}
    return {"status": "error", "message": "Work Log not found"}

# 3. Work Order CRUD
@frappe.whitelist()
def get_work_orders_list(search=None, trang_thai=None, don_vi_thi_cong=None, loai_cv=None, muc_do_uu_tien=None):
    filters = {}
    if trang_thai:
        filters["trang_thai"] = trang_thai
    if don_vi_thi_cong:
        filters["don_vi_thi_cong"] = don_vi_thi_cong
    if loai_cv:
        filters["loai_cv"] = loai_cv
    if muc_do_uu_tien:
        filters["muc_do_uu_tien"] = muc_do_uu_tien
    if search:
        filters["or"] = [
            ["name", "like", f"%{search}%"],
            ["ten_cong_viec", "like", f"%{search}%"],
            ["nguoi_thuc_hien", "like", f"%{search}%"]
        ]
        
    orders = frappe.get_all("Work Order", filters=filters, fields=["name", "ten_cong_viec", "tree", "su_co", "nguoi_thuc_hien", "don_vi_thi_cong", "trang_thai", "ngay_bat_dau", "ngay_hoan_thanh", "han_chot", "muc_do_uu_tien", "ke_hoach", "loai_cv"], order_by="name desc")
    for o in orders:
        o.tieu_de_ke_hoach = frappe.db.get_value("Ke Hoach Cham Soc", o.ke_hoach, "ten_ke_hoach") if o.ke_hoach else ""
    return orders

@frappe.whitelist()
def create_work_order(data):
    if isinstance(data, str):
        data = json.loads(data)
    name = data.get("name")
    
    if name and frappe.db.exists("Work Order", name):
        doc = frappe.get_doc("Work Order", name)
        doc.update(data)
        doc.save(ignore_permissions=True)
    else:
        # Generate series name if not passed
        doc = frappe.get_doc({"doctype": "Work Order", **data})
        doc.insert(ignore_permissions=True)
        
    frappe.db.commit()
    return doc

@frappe.whitelist()
def delete_work_order(name):
    if frappe.db.exists("Work Order", name):
        frappe.delete_doc("Work Order", name)
        frappe.db.commit()
        return {"status": "success"}
    return {"status": "error", "message": "Work Order not found"}

# 4. Ket Qua Nghiem Thu CRUD
@frappe.whitelist()
def get_results_list(search=None):
    filters = {}
    if search:
        filters["ten_ket_qua"] = ["like", f"%{search}%"]
    return frappe.get_all("Ket Qua Nghiem Thu", filters=filters, fields=["name", "ten_ket_qua", "mo_ta", "trang_thai"])

@frappe.whitelist()
def create_result(data):
    if isinstance(data, str):
        data = json.loads(data)
    name = data.get("ten_ket_qua")
    if not name:
        frappe.throw(_("Tên kết quả là bắt buộc"))
    if frappe.db.exists("Ket Qua Nghiem Thu", name):
        doc = frappe.get_doc("Ket Qua Nghiem Thu", name)
        doc.update(data)
        doc.save(ignore_permissions=True)
    else:
        doc = frappe.get_doc({"doctype": "Ket Qua Nghiem Thu", **data})
        doc.insert(ignore_permissions=True)
    frappe.db.commit()
    return doc

@frappe.whitelist()
def delete_result(name):
    if frappe.db.exists("Ket Qua Nghiem Thu", name):
        frappe.delete_doc("Ket Qua Nghiem Thu", name)
        frappe.db.commit()
        return {"status": "success"}
    return {"status": "error", "message": "Result not found"}

# 5. Bien Ban Nghiem Thu CRUD
@frappe.whitelist()
def get_acceptance_tickets_list(search=None, ket_qua=None):
    filters = {}
    if ket_qua:
        filters["ket_qua"] = ket_qua
    if search:
        filters["or"] = [
            ["name", "like", f"%{search}%"],
            ["phieu_cv", "like", f"%{search}%"],
            ["nguoi_nt", "like", f"%{search}%"]
        ]
    return frappe.get_all("Bien Ban Nghiem Thu", filters=filters, fields=["name", "phieu_cv", "ngay_nt", "nguoi_nt", "ket_qua", "lam_lai", "ghi_chu"], order_by="name desc")

@frappe.whitelist()
def create_acceptance_ticket(data):
    if isinstance(data, str):
        data = json.loads(data)
    name = data.get("name")
    
    if name and frappe.db.exists("Bien Ban Nghiem Thu", name):
        doc = frappe.get_doc("Bien Ban Nghiem Thu", name)
        doc.update(data)
        doc.save(ignore_permissions=True)
    else:
        doc = frappe.get_doc({"doctype": "Bien Ban Nghiem Thu", **data})
        doc.insert(ignore_permissions=True)
        
    # Automatically update corresponding Work Order status based on Acceptance Result
    if doc.phieu_cv:
        wo_status = "Đã nghiệm thu đạt" if doc.ket_qua != "Không đạt" else "Đã nghiệm thu lỗi"
        frappe.db.set_value("Work Order", doc.phieu_cv, "trang_thai", wo_status)
        frappe.db.set_value("Work Order", doc.phieu_cv, "ket_qua_nghiem_thu", doc.ghi_chu or doc.ket_qua)
        
    frappe.db.commit()
    return doc

@frappe.whitelist()
def delete_acceptance_ticket(name):
    if frappe.db.exists("Bien Ban Nghiem Thu", name):
        frappe.delete_doc("Bien Ban Nghiem Thu", name)
        frappe.db.commit()
        return {"status": "success"}
    return {"status": "error", "message": "Acceptance Ticket not found"}

@frappe.whitelist()
def get_tree_details(ma_tai_san):
    if not ma_tai_san:
        frappe.throw(_("Mã tài sản là bắt buộc"))
        
    tree_info = frappe.db.get_value(
        "Tai Nguyen Ha Tang", 
        ma_tai_san, 
        ["name", "ma_tai_san", "ten_tai_san", "loai_cay", "khu_vuc", "tuyen_duong", "cong_vien", "du_an", "toa_do_gps", "trang_thai", "chi_phi_bao_duong", "ngay_lap_dat"], 
        as_dict=True
    )
    
    if not tree_info:
        frappe.throw(_("Không tìm thấy cây xanh"))
        
    # Get species name
    if tree_info.loai_cay:
        species_name = frappe.db.get_value("Loai Cay", tree_info.loai_cay, "ten_loai_cay")
        tree_info.loai_cay_title = species_name or tree_info.loai_cay
        
    # Get incidents (Bao Cao Van De)
    incidents = frappe.get_all(
        "Bao Cao Van De",
        filters={"tai_nguyen": ma_tai_san},
        fields=["name", "tieu_de", "loai_su_co", "muc_do_uu_tien", "trang_thai", "creation", "nguoi_bao_cao", "ai_is_hazardous", "ai_reason"],
        order_by="creation desc"
    )
    
    # Get work orders
    work_orders = frappe.get_all(
        "Work Order",
        filters={"tree": ma_tai_san},
        fields=["name", "ten_cong_viec", "trang_thai", "muc_do_uu_tien", "ngay_bat_dau", "ngay_hoan_thanh", "nguoi_thuc_hien", "ket_qua_nghiem_thu", "don_vi_thi_cong"],
        order_by="creation desc"
    )
    
    return {
        "tree_info": tree_info,
        "incidents": incidents,
        "work_orders": work_orders
    }
