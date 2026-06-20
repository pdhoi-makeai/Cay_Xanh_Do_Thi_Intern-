import axios from 'axios';

const api = axios.create({
  withCredentials: true,
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  }
});

const SERVICE_BASE = '/api/method/smart_city.services.urban_tree_service';

export interface TreeStatusCount {
  status: string;
  count: number;
}

export interface TreeSpeciesCount {
  species: string;
  count: number;
}

export interface IncidentStatusCount {
  status: string;
  count: number;
}

export interface TreeAreaCount {
  area: string;
  count: number;
}

export interface TreeDashboardData {
  total_trees: number;
  healthy_trees: number;
  pruning_needed_trees: number;
  diseased_fallen_trees: number;
  open_incidents: number;
  resolved_incidents: number;
  charts: {
    trees_by_status: TreeStatusCount[];
    trees_by_species: TreeSpeciesCount[];
    incidents_by_status: IncidentStatusCount[];
    trees_by_area: TreeAreaCount[];
  };
}

export interface TreeRecord {
  name: string;
  ma_tai_san: string;
  ten_tai_san: string;
  loai_cay: string;
  khu_vuc: string;
  latitude: number;
  longitude: number;
  trang_thai: 'Tốt' | 'Cần cắt tỉa' | 'Sâu bệnh' | 'Gãy đổ';
  chi_phi_bao_duong?: number;
  ngay_lap_dat?: string;
}

export interface TreeRouteRecord {
  name: string;
  ma_tuyen: string;
  ten_tuyen: string;
  khu_vuc: string;
  polyline_json: string;
  so_diem: number;
  ghi_chu?: string;
}

export interface IncidentRecord {
  name: string;
  tieu_de: string;
  tai_nguyen?: string;
  khu_vuc?: string;
  vi_tri_gps?: string;
  mo_ta_chi_tiet?: string;
  hinh_anh_minh_hoa?: string;
  muc_do_uu_tien: 'Thấp' | 'Trung bình' | 'Cao';
  nguoi_bao_cao?: string;
  sdt_lien_he?: string;
  trang_thai: 'Mới' | 'Đang xử lý' | 'Đã giải quyết' | 'Đã cưa hạ-di dời';
  loai_van_de: string;
  ai_is_hazardous?: number;
  ai_reason?: string;
}

export interface UserInfo {
  email: string;
  first_name: string;
  roles: string[];
}

export const urbanTreeApi = {
  // Authentication
  sendOtp: async (email: string) => {
    const res = await api.post(`${SERVICE_BASE}.send_otp`, { email });
    return res.data.message as { status: string; message: string; otp?: string };
  },
  
  verifyOtp: async (email: string, otp: string) => {
    const res = await api.post(`${SERVICE_BASE}.verify_otp_login`, { email, otp });
    return res.data.message as UserInfo;
  },

  loginAsAdmin: async () => {
    await api.post('/api/method/login', {
      usr: 'Administrator',
      pwd: 'admin123456'
    });
    return {
      email: 'admin@greencity.local',
      first_name: 'Administrator',
      roles: ['Administrator']
    } as UserInfo;
  },

  logout: async () => {
    await api.post('/api/method/logout');
  },

  getCurrentUser: async () => {
    try {
      const res = await api.get('/api/method/frappe.auth.get_logged_user');
      return res.data.message as string;
    } catch {
      return null;
    }
  },

  // Dashboard stats
  getTreeDashboard: async () => {
    const res = await api.get(`${SERVICE_BASE}.get_tree_dashboard`);
    return res.data.message as TreeDashboardData;
  },

  // Map Data
  getTreeMap: async (khu_vuc?: string, trang_thai?: string, loai_cay?: string) => {
    const res = await api.get(`${SERVICE_BASE}.get_tree_map`, {
      params: { khu_vuc, trang_thai, loai_cay }
    });
    return res.data.message as TreeRecord[];
  },

  // Trees list
  getTrees: async (khu_vuc?: string, trang_thai?: string, limit = 100) => {
    const res = await api.get(`${SERVICE_BASE}.get_trees`, {
      params: { khu_vuc, trang_thai, limit }
    });
    return res.data.message as TreeRecord[];
  },

  // Create single Tree
  createTree: async (data: Partial<TreeRecord> & { latitude: number; longitude: number }) => {
    const res = await api.post(`${SERVICE_BASE}.create_tree`, { data });
    return res.data.message as TreeRecord;
  },

  // Update tree status
  updateTreeStatus: async (name: string, trang_thai: string) => {
    const res = await api.post(`${SERVICE_BASE}.update_tree_status`, { name, trang_thai });
    return res.data.message as { status: string };
  },

  // Routes
  getTreeRoutes: async (khu_vuc?: string) => {
    const res = await api.get(`${SERVICE_BASE}.get_tree_routes`, {
      params: { khu_vuc }
    });
    return res.data.message as TreeRouteRecord[];
  },

  createTreeRoute: async (data: Partial<TreeRouteRecord>) => {
    const res = await api.post(`${SERVICE_BASE}.create_tree_route`, { data });
    return res.data.message as TreeRouteRecord;
  },

  // Auto-generation
  generateTreesForRoute: async (data: {
    route: string;
    ma_prefix: string;
    count: number;
    loai_cay: string;
    both_sides?: boolean;
    offset?: number;
  }) => {
    const res = await api.post(`${SERVICE_BASE}.generate_trees_for_route`, { data });
    return res.data.message as { status: string; generated: string[] };
  },

  // Incident reporting
  reportIncident: async (data: {
    incident_title: string;
    tree: string;
    description?: string;
    image_base64?: string;
    nguoi_bao_cao?: string;
    sdt_lien_he?: string;
  }) => {
    const res = await api.post(`${SERVICE_BASE}.report_incident`, data);
    return res.data.message as {
      status: string;
      incident: string;
      ai_is_hazardous: number;
      ai_reason: string;
      tree_status_updated?: string;
    };
  }
};

export default api;
