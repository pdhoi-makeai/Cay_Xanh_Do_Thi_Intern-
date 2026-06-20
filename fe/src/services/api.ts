import axios from 'axios';

const api = axios.create({
  withCredentials: true,
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  }
});

// Frappe API base method path
const METHOD_BASE = '/api/method/cay_xanh_do_thi.api';

export interface UserInfo {
  email: string;
  first_name: string;
  roles: string[];
}

export interface TreeData {
  name: string;
  tree_code: string;
  species: string;
  status: 'Healthy' | 'Needs Pruning' | 'Diseased' | 'Fallen';
  latitude: number;
  longitude: number;
  ward: string;
  last_inspected?: string;
}

export interface HouseholdData {
  name: string;
  household_head: string;
  member_count: number;
  latitude: number;
  longitude: number;
  ward: string;
  address: string;
}

export interface WardData {
  name: string;
  ward_name: string;
  district: string;
  latitude_center: number;
  longitude_center: number;
  population: number;
  geojson_boundary: string;
}

export interface MapDataResponse {
  trees: TreeData[];
  households: HouseholdData[];
  wards: WardData[];
}

export interface IncidentReportResponse {
  status: 'success';
  incident: string;
  ai_is_hazardous: number;
  ai_reason: string;
  tree_status_updated?: string;
}

export const authService = {
  sendOtp: async (email: string) => {
    const response = await api.post(`${METHOD_BASE}.send_otp`, { email });
    return response.data.message as { status: string; message: string; otp?: string };
  },
  verifyOtp: async (email: string, otp: string) => {
    const response = await api.post(`${METHOD_BASE}.verify_otp_login`, { email, otp });
    return response.data.message as UserInfo;
  },
  logout: async () => {
    await api.post('/api/method/logout');
  },
  getCurrentUser: async () => {
    try {
      const response = await api.get('/api/method/frappe.auth.get_logged_user');
      return response.data.message;
    } catch {
      return null;
    }
  }
};

export const mapService = {
  getMapData: async () => {
    const response = await api.get(`${METHOD_BASE}.get_map_data`);
    return response.data.message as MapDataResponse;
  }
};

export const incidentService = {
  reportIncident: async (data: {
    incident_title: string;
    tree: string;
    reporter_name?: string;
    reporter_phone?: string;
    description?: string;
    image_base64?: string;
    muc_do_uu_tien?: string;
    loai_su_co?: string;
    nguon_su_co?: string;
    trang_thai?: string;
  }) => {
    const response = await api.post(`${METHOD_BASE}.report_incident`, data);
    return response.data.message as IncidentReportResponse;
  },
  getIncidentsList: async (params?: { loai_su_co?: string; muc_do_uu_tien?: string; trang_thai?: string; search?: string }) => {
    const response = await api.get(`${METHOD_BASE}.get_incidents_list`, { params });
    return response.data.message as any[];
  },
  deleteIncident: async (name: string) => {
    const response = await api.post(`${METHOD_BASE}.delete_incident`, { name });
    return response.data.message;
  },
  updateIncident: async (name: string, data: any) => {
    const response = await api.post(`${METHOD_BASE}.update_incident`, { name, data });
    return response.data.message;
  },
  
  // Areas and Routes
  getAreasList: async () => {
    const response = await api.get(`${METHOD_BASE}.get_areas_list`);
    return response.data.message as any[];
  },
  getRoutesList: async () => {
    const response = await api.get(`${METHOD_BASE}.get_routes_list`);
    return response.data.message as any[];
  },
  updateRouteGeometry: async (name: string, geojson_data: string) => {
    const response = await api.post(`${METHOD_BASE}.update_route_geometry`, { name, geojson_data });
    return response.data.message;
  },
  
  // Parks
  getParksList: async () => {
    const response = await api.get(`${METHOD_BASE}.get_parks_list`);
    return response.data.message as any[];
  },
  createPark: async (data: any) => {
    const response = await api.post(`${METHOD_BASE}.create_park`, { data });
    return response.data.message;
  },
  updateParkGeometry: async (name: string, geojson_boundary: string, dien_tich?: number) => {
    const response = await api.post(`${METHOD_BASE}.update_park_geometry`, { name, geojson_boundary, dien_tich });
    return response.data.message;
  },
  
  // Priority CRUD
  getPrioritiesList: async (search?: string) => {
    const response = await api.get(`${METHOD_BASE}.get_priorities_list`, { params: { search } });
    return response.data.message as any[];
  },
  createPriority: async (data: any) => {
    const response = await api.post(`${METHOD_BASE}.create_priority`, { data });
    return response.data.message;
  },
  deletePriority: async (name: string) => {
    const response = await api.post(`${METHOD_BASE}.delete_priority`, { name });
    return response.data.message;
  },

  // Source CRUD
  getSourcesList: async (search?: string) => {
    const response = await api.get(`${METHOD_BASE}.get_sources_list`, { params: { search } });
    return response.data.message as any[];
  },
  createSource: async (data: any) => {
    const response = await api.post(`${METHOD_BASE}.create_source`, { data });
    return response.data.message;
  },
  deleteSource: async (name: string) => {
    const response = await api.post(`${METHOD_BASE}.delete_source`, { name });
    return response.data.message;
  },

  // Type CRUD
  getTypesList: async (search?: string) => {
    const response = await api.get(`${METHOD_BASE}.get_types_list`, { params: { search } });
    return response.data.message as any[];
  },
  createType: async (data: any) => {
    const response = await api.post(`${METHOD_BASE}.create_type`, { data });
    return response.data.message;
  },
  deleteType: async (name: string) => {
    const response = await api.post(`${METHOD_BASE}.delete_type`, { name });
    return response.data.message;
  }
};

export interface TreeDashboardData {
  total_trees: number;
  danger_trees: number;
  monitoring_trees: number;
  new_incidents: number;
  in_progress_plans: number;
  overdue_tasks: number;
  pending_acceptance: number;
  completion_rate: number;
  tree_status_distribution: Record<string, number>;
  incident_trends: { date: string; count: number }[];
  task_status_distribution: Record<string, number>;
}

export interface WorkOrderData {
  name: string;
  ten_cong_viec: string;
  tree: string;
  device_name?: string;
  device_gps?: string;
  su_co?: string;
  trang_thai: string;
  ngay_bat_dau?: string;
  ngay_hoan_thanh?: string;
  han_chot?: string;
  muc_do_uu_tien: 'Low' | 'Medium' | 'High';
  don_vi_thi_cong?: string;
  ket_qua_nghiem_thu?: string;
}

export const treeService = {
  getDashboardData: async (params?: {
    from_date?: string;
    to_date?: string;
    area?: string;
    contractor?: string;
  }) => {
    const response = await api.get(`${METHOD_BASE}.get_tree_dashboard_data`, { params });
    return response.data.message as TreeDashboardData;
  },
  getMyWorkOrders: async () => {
    const response = await api.get(`${METHOD_BASE}.get_my_work_orders`);
    return response.data.message as WorkOrderData[];
  },
  submitAcceptanceResult: async (work_order: string, status: string, notes?: string) => {
    const response = await api.post(`${METHOD_BASE}.submit_acceptance_result`, {
      work_order,
      status,
      notes
    });
    return response.data.message;
  },
  
  // Tree Species CRUD
  getTreeSpecies: async (nhom_cay?: string) => {
    const response = await api.get(`${METHOD_BASE}.get_tree_species`, { params: { nhom_cay } });
    return response.data.message as any[];
  },
  createTreeSpecies: async (data: any) => {
    const response = await api.post(`${METHOD_BASE}.create_tree_species`, { data });
    return response.data.message;
  },
  deleteTreeSpecies: async (ma_loai_cay: string) => {
    const response = await api.post(`${METHOD_BASE}.delete_tree_species`, { ma_loai_cay });
    return response.data.message;
  },
  uploadFile: async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("is_private", "0");
    const response = await api.post("/api/method/upload_file", formData, {
      headers: {
        "Content-Type": "multipart/form-data"
      }
    });
    return response.data.message;
  },

  // Tree Assets CRUD
  getTreeDetails: async (ma_tai_san: string) => {
    const response = await api.get(`${METHOD_BASE}.get_tree_details`, { params: { ma_tai_san } });
    return response.data.message;
  },
  getTreesList: async (params?: { du_an?: string; tuyen_duong?: string; khu_vuc?: string; search?: string }) => {
    const response = await api.get(`${METHOD_BASE}.get_trees_list`, { params });
    return response.data.message as any[];
  },
  createTreeAsset: async (data: any) => {
    const response = await api.post(`${METHOD_BASE}.create_tree_asset`, { data });
    return response.data.message;
  },
  deleteTreeAsset: async (ma_tai_san: string) => {
    const response = await api.post(`${METHOD_BASE}.delete_tree_asset`, { ma_tai_san });
    return response.data.message;
  }
};

export const inspectionService = {
  // 1. Loai Kiem Tra
  getInspectionTypesList: async (search?: string) => {
    const response = await api.get(`${METHOD_BASE}.get_inspection_types_list`, { params: { search } });
    return response.data.message as any[];
  },
  createInspectionType: async (data: any) => {
    const response = await api.post(`${METHOD_BASE}.create_inspection_type`, { data });
    return response.data.message;
  },
  deleteInspectionType: async (name: string) => {
    const response = await api.post(`${METHOD_BASE}.delete_inspection_type`, { name });
    return response.data.message;
  },

  // 2. Trang Thai Nghieng
  getLeaningStatusesList: async (search?: string) => {
    const response = await api.get(`${METHOD_BASE}.get_leaning_statuses_list`, { params: { search } });
    return response.data.message as any[];
  },
  createLeaningStatus: async (data: any) => {
    const response = await api.post(`${METHOD_BASE}.create_leaning_status`, { data });
    return response.data.message;
  },
  deleteLeaningStatus: async (name: string) => {
    const response = await api.post(`${METHOD_BASE}.delete_leaning_status`, { name });
    return response.data.message;
  },

  // 3. Trang Thai Sau Benh
  getDiseaseStatusesList: async (search?: string) => {
    const response = await api.get(`${METHOD_BASE}.get_disease_statuses_list`, { params: { search } });
    return response.data.message as any[];
  },
  createDiseaseStatus: async (data: any) => {
    const response = await api.post(`${METHOD_BASE}.create_disease_status`, { data });
    return response.data.message;
  },
  deleteDiseaseStatus: async (name: string) => {
    const response = await api.post(`${METHOD_BASE}.delete_disease_status`, { name });
    return response.data.message;
  },

  // 4. Muc An Toan
  getSafetyLevelsList: async (search?: string) => {
    const response = await api.get(`${METHOD_BASE}.get_safety_levels_list`, { params: { search } });
    return response.data.message as any[];
  },
  createSafetyLevel: async (data: any) => {
    const response = await api.post(`${METHOD_BASE}.create_safety_level`, { data });
    return response.data.message;
  },
  deleteSafetyLevel: async (name: string) => {
    const response = await api.post(`${METHOD_BASE}.delete_safety_level`, { name });
    return response.data.message;
  },

  // 5. Tinh Trang Bo Phan
  getPartStatusesList: async (search?: string) => {
    const response = await api.get(`${METHOD_BASE}.get_part_statuses_list`, { params: { search } });
    return response.data.message as any[];
  },
  createPartStatus: async (data: any) => {
    const response = await api.post(`${METHOD_BASE}.create_part_status`, { data });
    return response.data.message;
  },
  deletePartStatus: async (name: string) => {
    const response = await api.post(`${METHOD_BASE}.delete_part_status`, { name });
    return response.data.message;
  },

  // 6. Nhom Cay
  getTreeGroupsList: async (search?: string) => {
    const response = await api.get(`${METHOD_BASE}.get_tree_groups_list`, { params: { search } });
    return response.data.message as any[];
  },
  createTreeGroup: async (data: any) => {
    const response = await api.post(`${METHOD_BASE}.create_tree_group`, { data });
    return response.data.message;
  },
  deleteTreeGroup: async (name: string) => {
    const response = await api.post(`${METHOD_BASE}.delete_tree_group`, { name });
    return response.data.message;
  },

  // 7. Phieu Kiem Tra
  getInspectionTicketsList: async (params?: { search?: string; loai_kt?: string; an_toan?: string; trang_thai?: string }) => {
    const response = await api.get(`${METHOD_BASE}.get_inspection_tickets_list`, { params });
    return response.data.message as any[];
  },
  createInspectionTicket: async (data: any) => {
    const response = await api.post(`${METHOD_BASE}.create_inspection_ticket`, { data });
    return response.data.message;
  },
  deleteInspectionTicket: async (name: string) => {
    const response = await api.post(`${METHOD_BASE}.delete_inspection_ticket`, { name });
    return response.data.message;
  }
};

export const carePlanService = {
  // 1. Loai Ke Hoach
  getPlanTypesList: async (search?: string) => {
    const response = await api.get(`${METHOD_BASE}.get_plan_types_list`, { params: { search } });
    return response.data.message as any[];
  },
  createPlanType: async (data: any) => {
    const response = await api.post(`${METHOD_BASE}.create_plan_type`, { data });
    return response.data.message;
  },
  deletePlanType: async (name: string) => {
    const response = await api.post(`${METHOD_BASE}.delete_plan_type`, { name });
    return response.data.message;
  },

  // 2. Muc Uu Tien
  getPlanPrioritiesList: async (search?: string) => {
    const response = await api.get(`${METHOD_BASE}.get_plan_priorities_list`, { params: { search } });
    return response.data.message as any[];
  },
  createPlanPriority: async (data: any) => {
    const response = await api.post(`${METHOD_BASE}.create_plan_priority`, { data });
    return response.data.message;
  },
  deletePlanPriority: async (name: string) => {
    const response = await api.post(`${METHOD_BASE}.delete_plan_priority`, { name });
    return response.data.message;
  },

  // 3. Ke Hoach Cham Soc
  getCarePlansList: async (params?: { search?: string; loai_ke_hoach?: string; muc_uu_tien?: string; trang_thai?: string }) => {
    const response = await api.get(`${METHOD_BASE}.get_care_plans_list`, { params });
    return response.data.message as any[];
  },
  createCarePlan: async (data: any) => {
    const response = await api.post(`${METHOD_BASE}.create_care_plan`, { data });
    return response.data.message;
  },
  deleteCarePlan: async (name: string) => {
    const response = await api.post(`${METHOD_BASE}.delete_care_plan`, { name });
    return response.data.message;
  }
};

export const executionService = {
  // 1. Action Types (Loai Hanh Dong)
  getActionTypesList: async (search?: string) => {
    const response = await api.get(`${METHOD_BASE}.get_action_types_list`, { params: { search } });
    return response.data.message as any[];
  },
  createActionType: async (data: any) => {
    const response = await api.post(`${METHOD_BASE}.create_action_type`, { data });
    return response.data.message;
  },
  deleteActionType: async (name: string) => {
    const response = await api.post(`${METHOD_BASE}.delete_action_type`, { name });
    return response.data.message;
  },

  // 2. Work Logs (Nhat Ky Thi Cong)
  getWorkLogsList: async (params?: { search?: string; work_order?: string }) => {
    const response = await api.get(`${METHOD_BASE}.get_work_logs_list`, { params });
    return response.data.message as any[];
  },
  createWorkLog: async (data: any) => {
    const response = await api.post(`${METHOD_BASE}.create_work_log`, { data });
    return response.data.message;
  },
  deleteWorkLog: async (name: string) => {
    const response = await api.post(`${METHOD_BASE}.delete_work_log`, { name });
    return response.data.message;
  },

  // 3. Work Orders (Phieu Cong Viec)
  getWorkOrdersList: async (params?: { search?: string; trang_thai?: string; don_vi_thi_cong?: string; loai_cv?: string; muc_do_uu_tien?: string }) => {
    const response = await api.get(`${METHOD_BASE}.get_work_orders_list`, { params });
    return response.data.message as any[];
  },
  createWorkOrder: async (data: any) => {
    const response = await api.post(`${METHOD_BASE}.create_work_order`, { data });
    return response.data.message;
  },
  deleteWorkOrder: async (name: string) => {
    const response = await api.post(`${METHOD_BASE}.delete_work_order`, { name });
    return response.data.message;
  }
};

export const acceptanceService = {
  // 1. Ket Qua Nghiem Thu
  getResultsList: async (search?: string) => {
    const response = await api.get(`${METHOD_BASE}.get_results_list`, { params: { search } });
    return response.data.message as any[];
  },
  createResult: async (data: any) => {
    const response = await api.post(`${METHOD_BASE}.create_result`, { data });
    return response.data.message;
  },
  deleteResult: async (name: string) => {
    const response = await api.post(`${METHOD_BASE}.delete_result`, { name });
    return response.data.message;
  },

  // 2. Bien Ban Nghiem Thu
  getAcceptanceTicketsList: async (params?: { search?: string; ket_qua?: string }) => {
    const response = await api.get(`${METHOD_BASE}.get_acceptance_tickets_list`, { params });
    return response.data.message as any[];
  },
  createAcceptanceTicket: async (data: any) => {
    const response = await api.post(`${METHOD_BASE}.create_acceptance_ticket`, { data });
    return response.data.message;
  },
  deleteAcceptanceTicket: async (name: string) => {
    const response = await api.post(`${METHOD_BASE}.delete_acceptance_ticket`, { name });
    return response.data.message;
  }
};

export default api;
