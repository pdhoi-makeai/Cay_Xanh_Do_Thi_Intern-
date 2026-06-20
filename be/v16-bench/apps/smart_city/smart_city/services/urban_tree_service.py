import frappe
import random
import requests
import json
import base64
import math
from frappe import _
from frappe.utils import today
from frappe.utils.file_manager import save_file

GEMINI_API_KEY = "AQ.Ab8RN6Jr574_r0Xe74HTm2s-Xw6tFNNonoo67CqZLKqZaJqc4Q"

@frappe.whitelist(allow_guest=True)
def send_otp(email):
    if not email:
        frappe.throw(_("Email là bắt buộc"))
    
    otp = str(random.randint(100000, 999999))
    frappe.cache().set_value(f"otp_{email}", otp, expires_in_sec=300)
    
    # In developer mode, we print to log and also return it for easier testing
    print(f"\n[OTP FOR {email}]: {otp}\n")
    
    response = {
        "status": "success",
        "message": _("Mã OTP đã được gửi đến email của bạn")
    }
    if frappe.conf.developer_mode:
        response["otp"] = otp  # Assist development/testing
        
    return response

@frappe.whitelist(allow_guest=True)
def verify_otp_login(email, otp):
    if not email or not otp:
        frappe.throw(_("Email và OTP là bắt buộc"))
        
    cached_otp = frappe.cache().get_value(f"otp_{email}")
    if not cached_otp:
        frappe.throw(_("Mã OTP đã hết hạn hoặc không tồn tại. Vui lòng gửi lại."))
        
    if str(cached_otp) != str(otp):
        frappe.throw(_("Mã OTP không hợp lệ"))
        
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
            roles = [r.role for r in user_doc.roles]
            has_other_roles = any(role in ["Tree Manager", "Tree Technician", "Urban Household"] for role in roles)
            if has_other_roles:
                frappe.throw(_("Tài khoản của bạn đang chờ phê duyệt từ người quản lý."))
            else:
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
def get_tree_dashboard():
    total_trees = frappe.db.count("Tai Nguyen Ha Tang", {"loai_tai_san": "Cây xanh"})
    healthy_trees = frappe.db.count("Tai Nguyen Ha Tang", {"loai_tai_san": "Cây xanh", "trang_thai": "Tốt"})
    pruning_needed_trees = frappe.db.count("Tai Nguyen Ha Tang", {"loai_tai_san": "Cây xanh", "trang_thai": "Cần cắt tỉa"})
    diseased_fallen_trees = frappe.db.count("Tai Nguyen Ha Tang", {"loai_tai_san": "Cây xanh", "trang_thai": ["in", ["Sâu bệnh", "Gãy đổ"]]})
    
    open_incidents = frappe.db.count("Bao Cao Van De", {"loai_van_de": "Sự cố cây xanh", "trang_thai": ["in", ["Mới", "Đang xử lý"]]})
    resolved_incidents = frappe.db.count("Bao Cao Van De", {"loai_van_de": "Sự cố cây xanh", "trang_thai": ["in", ["Đã giải quyết", "Đã cưa hạ-di dời"]]})

    # Status group chart
    trees_by_status_raw = frappe.db.sql("""
        select trang_thai, count(*) as cnt 
        from `tabTai Nguyen Ha Tang` 
        where loai_tai_san = 'Cây xanh' 
        group by trang_thai
    """, as_dict=True)
    trees_by_status = [{"status": r["trang_thai"], "count": r["cnt"]} for r in trees_by_status_raw]

    # Species group chart
    trees_by_species_raw = frappe.db.sql("""
        select loai_cay, count(*) as cnt 
        from `tabTai Nguyen Ha Tang` 
        where loai_tai_san = 'Cây xanh' 
        group by loai_cay
    """, as_dict=True)
    trees_by_species = [{"species": r["loai_cay"] or "Không rõ", "count": r["cnt"]} for r in trees_by_species_raw]

    # Incidents by status chart
    incidents_by_status_raw = frappe.db.sql("""
        select trang_thai, count(*) as cnt 
        from `tabBao Cao Van De` 
        where loai_van_de = 'Sự cố cây xanh' 
        group by trang_thai
    """, as_dict=True)
    incidents_by_status = [{"status": r["trang_thai"], "count": r["cnt"]} for r in incidents_by_status_raw]

    # Area group chart
    trees_by_area_raw = frappe.db.sql("""
        select k.ten_khu_vuc, count(*) as cnt 
        from `tabTai Nguyen Ha Tang` t
        join `tabKhu Vuc` k on t.khu_vuc = k.name
        where t.loai_tai_san = 'Cây xanh'
        group by k.ten_khu_vuc
    """, as_dict=True)
    trees_by_area = [{"area": r["ten_khu_vuc"], "count": r["cnt"]} for r in trees_by_area_raw]

    return {
        "total_trees": total_trees,
        "healthy_trees": healthy_trees,
        "pruning_needed_trees": pruning_needed_trees,
        "diseased_fallen_trees": diseased_fallen_trees,
        "open_incidents": open_incidents,
        "resolved_incidents": resolved_incidents,
        "charts": {
            "trees_by_status": trees_by_status,
            "trees_by_species": trees_by_species,
            "incidents_by_status": incidents_by_status,
            "trees_by_area": trees_by_area
        }
    }

@frappe.whitelist()
def get_tree_map(khu_vuc=None, trang_thai=None, loai_cay=None):
    filters = {"loai_tai_san": "Cây xanh"}
    if khu_vuc:
        filters["khu_vuc"] = khu_vuc
    if trang_thai:
        filters["trang_thai"] = trang_thai
    if loai_cay:
        filters["loai_cay"] = loai_cay

    raw_trees = frappe.get_all("Tai Nguyen Ha Tang", filters=filters, fields=["name", "ma_tai_san", "ten_tai_san", "loai_cay", "khu_vuc", "toa_do_gps", "trang_thai"])

    # Cache species model info to avoid N+1 queries
    species_cache = {}

    parsed_trees = []
    for t in raw_trees:
        lat, lng = 0.0, 0.0
        if t.toa_do_gps:
            try:
                parts = t.toa_do_gps.split(",")
                if len(parts) == 2:
                    lat = float(parts[0].strip())
                    lng = float(parts[1].strip())
            except Exception:
                pass

        # Lookup model_3d and scale_3d from species table
        model_3d = ""
        scale_3d = 1.0
        if t.loai_cay:
            if t.loai_cay not in species_cache:
                species_info = frappe.db.get_value(
                    "Loai Cay", t.loai_cay, ["model_3d", "scale_3d"], as_dict=True
                )
                species_cache[t.loai_cay] = species_info or {}
            cached = species_cache[t.loai_cay]
            model_3d = cached.get("model_3d") or ""
            raw_scale = cached.get("scale_3d")
            scale_3d = float(raw_scale) if raw_scale is not None else 1.0

        parsed_trees.append({
            "name": t.name,
            "ma_tai_san": t.ma_tai_san,
            "ten_tai_san": t.ten_tai_san,
            "loai_cay": t.loai_cay,
            "khu_vuc": t.khu_vuc,
            "latitude": lat,
            "longitude": lng,
            "trang_thai": t.trang_thai,
            "model_3d": model_3d,
            "scale_3d": scale_3d,
        })
    return parsed_trees

@frappe.whitelist()
def get_trees(khu_vuc=None, trang_thai=None, limit=100):
    filters = {"loai_tai_san": "Cây xanh"}
    if khu_vuc:
        filters["khu_vuc"] = khu_vuc
    if trang_thai:
        filters["trang_thai"] = trang_thai

    return frappe.get_all("Tai Nguyen Ha Tang", filters=filters, fields=["name", "ma_tai_san", "ten_tai_san", "loai_cay", "khu_vuc", "toa_do_gps", "trang_thai", "chi_phi_bao_duong", "ngay_lap_dat"], limit=limit)

@frappe.whitelist()
def create_tree(data):
    if isinstance(data, str):
        data = json.loads(data)

    ma_tai_san = data.get("ma_tai_san")
    if not ma_tai_san:
        frappe.throw(_("Mã số cây (ma_tai_san) là bắt buộc"))

    if frappe.db.exists("Tai Nguyen Ha Tang", ma_tai_san):
        frappe.throw(_("Mã số cây đã tồn tại trên hệ thống"))

    lat = data.get("latitude")
    lng = data.get("longitude")
    toa_do_gps = f"{lat},{lng}" if lat and lng else ""

    doc = frappe.get_doc({
        "doctype": "Tai Nguyen Ha Tang",
        "ma_tai_san": ma_tai_san,
        "ten_tai_san": data.get("ten_tai_san") or f"{data.get('loai_cay')} - {ma_tai_san}",
        "khu_vuc": data.get("khu_vuc"),
        "loai_tai_san": "Cây xanh",
        "loai_cay": data.get("loai_cay"),
        "toa_do_gps": toa_do_gps,
        "trang_thai": data.get("trang_thai") or "Tốt",
        "chi_phi_bao_duong": data.get("chi_phi_bao_duong") or 0.0,
        "ngay_lap_dat": data.get("ngay_lap_dat") or today()
    })
    doc.insert(ignore_permissions=True)
    frappe.db.commit()

    frappe.publish_realtime("tree_updated", {
        "event_type": "tree_created",
        "ma_tai_san": ma_tai_san
    })
    return doc

@frappe.whitelist()
def update_tree_status(name, trang_thai):
    if not frappe.db.exists("Tai Nguyen Ha Tang", name):
        frappe.throw(_("Không tìm thấy cây xanh cần cập nhật"))

    frappe.db.set_value("Tai Nguyen Ha Tang", name, "trang_thai", trang_thai)
    frappe.db.commit()

    frappe.publish_realtime("tree_updated", {
        "event_type": "tree_status_updated",
        "name": name,
        "trang_thai": trang_thai
    })
    return {"status": "success"}

@frappe.whitelist()
def get_tree_routes(khu_vuc=None):
    filters = {}
    if khu_vuc:
        filters["khu_vuc"] = khu_vuc
    return frappe.get_all("Tuyen Cay Xanh", filters=filters, fields=["name", "ma_tuyen", "ten_tuyen", "khu_vuc", "polyline_json", "so_diem", "ghi_chu"])

@frappe.whitelist()
def create_tree_route(data):
    if isinstance(data, str):
        data = json.loads(data)

    ma_tuyen = data.get("ma_tuyen")
    if not ma_tuyen:
        frappe.throw(_("Mã tuyến là bắt buộc"))

    doc = None
    if frappe.db.exists("Tuyen Cay Xanh", ma_tuyen):
        doc = frappe.get_doc("Tuyen Cay Xanh", ma_tuyen)
        doc.ten_tuyen = data.get("ten_tuyen") or doc.ten_tuyen
        doc.khu_vuc = data.get("khu_vuc") or doc.khu_vuc
        doc.polyline_json = data.get("polyline_json") or doc.polyline_json
        doc.so_diem = data.get("so_diem") or doc.so_diem
        doc.ghi_chu = data.get("ghi_chu") or doc.ghi_chu
        doc.save(ignore_permissions=True)
    else:
        doc = frappe.get_doc({
            "doctype": "Tuyen Cay Xanh",
            "ma_tuyen": ma_tuyen,
            "ten_tuyen": data.get("ten_tuyen"),
            "khu_vuc": data.get("khu_vuc"),
            "polyline_json": data.get("polyline_json"),
            "so_diem": data.get("so_diem") or 0,
            "ghi_chu": data.get("ghi_chu")
        })
        doc.insert(ignore_permissions=True)
        
    frappe.db.commit()

    frappe.publish_realtime("tree_updated", {
        "event_type": "tree_route_saved",
        "ma_tuyen": ma_tuyen
    })
    return doc

@frappe.whitelist()
def generate_trees_for_route(data):
    if isinstance(data, str):
        data = json.loads(data)

    route_id = data.get("route")
    ma_prefix = data.get("ma_prefix")
    count = int(data.get("count") or 10)
    loai_cay = data.get("loai_cay")
    both_sides = data.get("both_sides", False)
    offset_val = float(data.get("offset") or 0.0001)

    if not frappe.db.exists("Tuyen Cay Xanh", route_id):
        frappe.throw(_("Không tìm thấy tuyến đường quy hoạch"))

    route_doc = frappe.get_doc("Tuyen Cay Xanh", route_id)
    if not route_doc.polyline_json:
        frappe.throw(_("Tuyến đường không có dữ liệu tọa độ"))

    coords = json.loads(route_doc.polyline_json)
    if len(coords) < 2:
        frappe.throw(_("Tuyến đường phải chứa ít nhất 2 điểm tọa độ"))

    segments = []
    total_length = 0.0
    for i in range(len(coords) - 1):
        p1 = coords[i]
        p2 = coords[i+1]
        dist = math.sqrt((p2[0] - p1[0])**2 + (p2[1] - p1[1])**2)
        segments.append({
            "p1": p1,
            "p2": p2,
            "dist": dist,
            "start_dist": total_length
        })
        total_length += dist

    if total_length == 0:
        frappe.throw(_("Chiều dài tuyến phố không hợp lệ"))

    generated_trees = []

    def get_interpolated_point_with_normal(t_ratio):
        target_dist = t_ratio * total_length
        seg = segments[-1]
        for s in segments:
            if s["start_dist"] <= target_dist <= (s["start_dist"] + s["dist"]):
                seg = s
                break
                
        seg_dist = target_dist - seg["start_dist"]
        ratio = seg_dist / seg["dist"] if seg["dist"] > 0 else 0
        
        lat = seg["p1"][0] + ratio * (seg["p2"][0] - seg["p1"][0])
        lng = seg["p1"][1] + ratio * (seg["p2"][1] - seg["p1"][1])
        
        dx = seg["p2"][0] - seg["p1"][0]
        dy = seg["p2"][1] - seg["p1"][1]
        seg_len = math.sqrt(dx**2 + dy**2)
        
        if seg_len > 0:
            nx = -dy / seg_len
            ny = dx / seg_len
        else:
            nx, ny = 0, 0
            
        return lat, lng, nx, ny

    points_to_generate = []
    if count == 1:
        points_to_generate.append(get_interpolated_point_with_normal(0.5))
    else:
        for i in range(count):
            t_ratio = i / (count - 1)
            points_to_generate.append(get_interpolated_point_with_normal(t_ratio))

    index = 1
    for lat, lng, nx, ny in points_to_generate:
        side_points = []
        if both_sides:
            lat_l = lat + nx * offset_val
            lng_l = lng + ny * offset_val
            side_points.append((lat_l, lng_l, "L"))
            lat_r = lat - nx * offset_val
            lng_r = lng - ny * offset_val
            side_points.append((lat_r, lng_r, "R"))
        else:
            side_points.append((lat, lng, ""))

        for s_lat, s_lng, side in side_points:
            tree_id = f"{ma_prefix}-{index:04d}{side}"
            
            if not frappe.db.exists("Tai Nguyen Ha Tang", tree_id):
                doc = frappe.get_doc({
                    "doctype": "Tai Nguyen Ha Tang",
                    "ma_tai_san": tree_id,
                    "ten_tai_san": f"{loai_cay} - {tree_id}",
                    "khu_vuc": route_doc.khu_vuc,
                    "loai_tai_san": "Cây xanh",
                    "loai_cay": loai_cay,
                    "toa_do_gps": f"{s_lat},{s_lng}",
                    "trang_thai": "Tốt",
                    "chi_phi_bao_duong": 0.0,
                    "ngay_lap_dat": today()
                })
                doc.insert(ignore_permissions=True)
                generated_trees.append(tree_id)
            index += 1

    frappe.db.commit()

    frappe.publish_realtime("tree_updated", {
        "event_type": "trees_generated",
        "route": route_id,
        "count": len(generated_trees)
    })
    return {"status": "success", "generated": generated_trees}

@frappe.whitelist()
def report_incident(incident_title, tree, description=None, image_base64=None, khu_vuc=None, vi_tri_gps=None, nguoi_bao_cao=None, sdt_lien_he=None):
    # Resolve ward/area from tree if not provided
    if tree and not khu_vuc:
        khu_vuc = frappe.db.get_value("Tai Nguyen Ha Tang", tree, "khu_vuc")
    if tree and not vi_tri_gps:
        vi_tri_gps = frappe.db.get_value("Tai Nguyen Ha Tang", tree, "toa_do_gps")

    # Save image
    image_url = None
    if image_base64:
        if "," in image_base64:
            header, image_base64 = image_base64.split(",", 1)
        
        filedata = base64.b64decode(image_base64)
        file_doc = save_file("incident_image.jpg", filedata, "Bao Cao Van De", incident_title, decode=False, is_private=0)
        image_url = file_doc.file_url

    # AI evaluation logic
    ai_is_hazardous = 0
    ai_reason = "Không phát hiện nguy hại lớn từ AI."
    tree_update_status = None
    
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
      "tree_status": "Tốt" or "Cần cắt tỉa" or "Sâu bệnh" or "Gãy đổ"
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
            
        payload = {"contents": [{"parts": parts}]}
        
        res = requests.post(url, json=payload, headers=headers, timeout=15)
        if res.status_code == 200:
            res_data = res.json()
            ai_text = res_data['candidates'][0]['content']['parts'][0]['text'].strip()
            
            if ai_text.startswith("```json"):
                ai_text = ai_text[7:]
            if ai_text.endswith("```"):
                ai_text = ai_text[:-3]
            ai_text = ai_text.strip()
            
            ai_result = json.loads(ai_text)
            if ai_result.get("is_hazardous"):
                ai_is_hazardous = 1
                ai_reason = ai_result.get("reason", "Phát hiện nguy hiểm.")
                tree_update_status = ai_result.get("tree_status")
            else:
                ai_reason = ai_result.get("reason", "Phản ánh bình thường.")
    except Exception as e:
        ai_reason = f"AI processing failed: {str(e)}"
        
    inc_doc = frappe.get_doc({
        "doctype": "Bao Cao Van De",
        "tieu_de": incident_title,
        "tai_nguyen": tree,
        "khu_vuc": khu_vuc,
        "vi_tri_gps": vi_tri_gps,
        "mo_ta_chi_tiet": description,
        "hinh_anh_minh_hoa": image_url,
        "trang_thai": "Đang xử lý" if ai_is_hazardous else "Mới",
        "loai_van_de": "Sự cố cây xanh",
        "nguoi_bao_cao": nguoi_bao_cao or frappe.session.user,
        "sdt_lien_he": sdt_lien_he or "",
        "ai_is_hazardous": ai_is_hazardous,
        "ai_reason": ai_reason
    })
    inc_doc.insert(ignore_permissions=True)
    
    if tree_update_status and tree_update_status != "Tốt":
        frappe.db.set_value("Tai Nguyen Ha Tang", tree, "trang_thai", tree_update_status)
        
    frappe.db.commit()
    
    # Realtime trigger
    frappe.publish_realtime("tree_updated", {
        "event_type": "tree_status_updated",
        "name": tree,
        "trang_thai": tree_update_status or "Tốt"
    })
    
    return {
        "status": "success",
        "incident": inc_doc.name,
        "ai_is_hazardous": ai_is_hazardous,
        "ai_reason": ai_reason,
        "tree_status_updated": tree_update_status
    }
import json
import struct
import math
import os

@frappe.whitelist()
def generate_3d_tiles():
    # Fetch all trees with location and species
    trees = frappe.get_all("Tai Nguyen Ha Tang", filters={"loai_tai_san": "Cây xanh"}, fields=["ma_tai_san", "toa_do_gps", "trang_thai", "loai_cay"])
    
    parsed_trees = []
    for t in trees:
        if t.toa_do_gps:
            try:
                parts = t.toa_do_gps.split(",")
                if len(parts) == 2:
                    lat = float(parts[0].strip())
                    lng = float(parts[1].strip())
                    scale = 1.0
                    model_url = "/tree.glb"
                    
                    if t.loai_cay:
                        species_details = frappe.db.get_value("Loai Cay", t.loai_cay, ["model_3d", "scale_3d"], as_dict=True)
                        if species_details:
                            if species_details.scale_3d:
                                try:
                                    scale = float(species_details.scale_3d)
                                except: pass
                            if species_details.model_3d:
                                model_url = species_details.model_3d
                    
                    parsed_trees.append({
                        "ma_tai_san": t.ma_tai_san,
                        "latitude": lat,
                        "longitude": lng,
                        "trang_thai": t.trang_thai,
                        "model_3d": model_url,
                        "scale_3d": scale
                    })
            except Exception:
                pass
                
    if not parsed_trees:
        return {"status": "error", "message": "Không có dữ liệu tọa độ để tạo 3D Tiles."}
        
    site_path = frappe.utils.get_site_path()
    output_dir = os.path.join(site_path, "public", "files", "3dtiles", "trees")
    
    generate_tileset(parsed_trees, output_dir)
    
    return {"status": "success", "message": f"Tạo 3D Tiles thành công cho {len(parsed_trees)} cây.", "url": "/files/3dtiles/trees/tileset.json"}

def generate_tileset(trees, output_dir):
    os.makedirs(output_dir, exist_ok=True)
    
    # Group trees by model_3d
    groups = {}
    for t in trees:
        m = t["model_3d"]
        if m not in groups:
            groups[m] = []
        groups[m].append(t)
        
    # Build tileset.json structure
    tileset_json = {
        "asset": {
            "version": "1.0",
            "tilesetVersion": "1.0.0"
        },
        "geometricError": 10000,
        "root": {
            "boundingVolume": {
                "sphere": [0, 0, 0, 6378137.0] # Earth
            },
            "geometricError": 1000,
            "refine": "ADD",
            "children": []
        }
    }
    
    a = 6378137.0
    e2 = 0.00669437999014

    idx = 0
    for model_url, group_trees in groups.items():
        positions = []
        normal_ups = []
        normal_rights = []
        scales = []
        ids = []
        statuses = []
        
        for t in group_trees:
            lat_deg = t['latitude']
            lon_deg = t['longitude']
            lat = math.radians(lat_deg)
            lon = math.radians(lon_deg)
            h = 0.0
            
            N = a / math.sqrt(1 - e2 * math.sin(lat)**2)
            X = (N + h) * math.cos(lat) * math.cos(lon)
            Y = (N + h) * math.cos(lat) * math.sin(lon)
            Z = (N * (1 - e2) + h) * math.sin(lat)
            positions.append((X, Y, Z))
            
            # Model +Y maps to NORMAL_UP. If model is Z-up, +Y is North.
            # ECEF North vector:
            nx = -math.sin(lat) * math.cos(lon)
            ny = -math.sin(lat) * math.sin(lon)
            nz = math.cos(lat)
            normal_ups.append((nx, ny, nz))
            
            # Model +X maps to NORMAL_RIGHT. ECEF East vector:
            ex = -math.sin(lon)
            ey = math.cos(lon)
            ez = 0.0
            normal_rights.append((ex, ey, ez))
            
            scales.append(t['scale_3d'])
            ids.append(t['ma_tai_san'])
            statuses.append(t['trang_thai'] or '')

        cX = sum(p[0] for p in positions) / len(positions)
        cY = sum(p[1] for p in positions) / len(positions)
        cZ = sum(p[2] for p in positions) / len(positions)
        
        rtc_positions = []
        for p in positions:
            rtc_positions.append((p[0]-cX, p[1]-cY, p[2]-cZ))
            
        num_instances = len(group_trees)
        
        feature_table_json = {
            "INSTANCES_LENGTH": num_instances,
            "RTC_CENTER": [cX, cY, cZ],
            "POSITION": {"byteOffset": 0},
            "NORMAL_UP": {"byteOffset": num_instances * 12},
            "NORMAL_RIGHT": {"byteOffset": num_instances * 24},
            "SCALE": {"byteOffset": num_instances * 36}
        }
        
        ft_json_str = json.dumps(feature_table_json, separators=(',', ':'))
        while len(ft_json_str) % 8 != 0:
            ft_json_str += ' '
            
        ft_bin = bytearray()
        for p in rtc_positions:
            ft_bin += struct.pack('<3f', p[0], p[1], p[2])
        for n in normal_ups:
            ft_bin += struct.pack('<3f', n[0], n[1], n[2])
        for n in normal_rights:
            ft_bin += struct.pack('<3f', n[0], n[1], n[2])
        for s in scales:
            ft_bin += struct.pack('<f', s)
            
        while len(ft_bin) % 8 != 0:
            ft_bin += b'\x00'

        batch_table_json = {"id": ids, "status": statuses}
        bt_json_str = json.dumps(batch_table_json, separators=(',', ':'))
        while len(bt_json_str) % 8 != 0:
            bt_json_str += ' '
            
        bt_bin = bytearray()
        
        glb_uri = model_url.encode('utf-8')
        while len(glb_uri) % 8 != 0:
            glb_uri += b' '

        magic = b'i3dm'
        version = 1
        ft_json_len = len(ft_json_str)
        ft_bin_len = len(ft_bin)
        bt_json_len = len(bt_json_str)
        bt_bin_len = len(bt_bin)
        gltf_format = 0 # URL
        
        byte_length = 32 + ft_json_len + ft_bin_len + bt_json_len + bt_bin_len + len(glb_uri)
        
        header = struct.pack('<4sIIIIIII', magic, version, byte_length, ft_json_len, ft_bin_len, bt_json_len, bt_bin_len, gltf_format)
        
        i3dm_name = f'trees_{idx}.i3dm'
        with open(os.path.join(output_dir, i3dm_name), 'wb') as f:
            f.write(header)
            f.write(ft_json_str.encode('utf-8'))
            f.write(ft_bin)
            f.write(bt_json_str.encode('utf-8'))
            f.write(bt_bin)
            f.write(glb_uri)
            
        tileset_json["root"]["children"].append({
            "boundingVolume": {"sphere": [cX, cY, cZ, 5000]},
            "geometricError": 0,
            "refine": "REPLACE",
            "content": {"uri": i3dm_name}
        })
        idx += 1
        
    with open(os.path.join(output_dir, 'tileset.json'), 'w') as f:
        json.dump(tileset_json, f, indent=2)

if __name__ == '__main__':
    # Test data
    test_trees = [
        {"ma_tai_san": "T1", "latitude": 16.0748, "longitude": 108.1512, "trang_thai": "Tốt"},
        {"ma_tai_san": "T2", "latitude": 16.0750, "longitude": 108.1514, "trang_thai": "Sâu bệnh"},
    ]
    generate_tileset(test_trees, 'public/3dtiles/trees')
    print("Tileset generated!")
