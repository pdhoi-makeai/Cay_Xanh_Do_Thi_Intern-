import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { incidentService, treeService } from '../services/api';
import { 
  Button, 
  Input, 
  Label, 
  Textarea, 
  Card, 
  MessageBar, 
  MessageBarBody,
  Spinner,
  Select
} from '@fluentui/react-components';
import { 
  CameraRegular, 
  AlertUrgentRegular, 
  CheckmarkCircleRegular,
  ArrowLeftRegular
} from '@fluentui/react-icons';

interface AreaOption {
  name: string;
  ten_khu_vuc: string;
}

interface RouteOption {
  name: string;
  ten_tuyen: string;
}

interface LookupOption {
  name: string;
  ten_nguon?: string;
  ten_loai?: string;
  ten_muc_do?: string;
}

interface TreeOption {
  name: string;
  ma_tai_san: string;
  ten_tai_san: string;
  khu_vuc: string;
  tuyen_duong: string;
  trang_thai: string;
  loai_cay_title?: string;
}

export const IncidentReport: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Generated Mã sự cố & Thời gian
  const [incidentCode] = useState(() => {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const hh = String(now.getHours()).padStart(2, '0');
    const min = String(now.getMinutes()).padStart(2, '0');
    const ss = String(now.getSeconds()).padStart(2, '0');
    return `INC${yyyy}${mm}${dd}${hh}${min}${ss}`;
  });

  const [timeOccurred] = useState(() => {
    const now = new Date();
    return now.toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  });

  // Dropdown list states
  const [areas, setAreas] = useState<AreaOption[]>([]);
  const [routes, setRoutes] = useState<RouteOption[]>([]);
  const [sources, setSources] = useState<LookupOption[]>([]);
  const [types, setTypes] = useState<LookupOption[]>([]);
  const [priorities, setPriorities] = useState<LookupOption[]>([]);
  const [allTrees, setAllTrees] = useState<TreeOption[]>([]);

  // Selected values states
  const [selectedSource, setSelectedSource] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedPriority, setSelectedPriority] = useState('');
  const [selectedStatus] = useState('Mới'); // Default/disabled status

  // Filters for Trees
  const [selectedArea, setSelectedArea] = useState('');
  const [selectedRoute, setSelectedRoute] = useState('');
  const [selectedTree, setSelectedTree] = useState(location.state?.treeId || '');

  // Reporter & details states
  const [reporterName, setReporterName] = useState('');
  const [reporterPhone, setReporterPhone] = useState('');
  const [description, setDescription] = useState('');
  const [image64, setImage64] = useState<string | undefined>(undefined);

  // Status states
  const [loading, setLoading] = useState(false);
  const [initLoading, setInitLoading] = useState(true);
  const [error, setError] = useState('');
  const [aiResponse, setAiResponse] = useState<{
    status: string;
    incident: string;
    ai_is_hazardous: number;
    ai_reason: string;
    tree_status_updated?: string;
  } | null>(null);

  // Load all lookups & metadata on mount
  useEffect(() => {
    const loadMetadata = async () => {
      setInitLoading(true);
      try {
        const [areaList, routeList, sourceList, typeList, priorityList, treeList] = await Promise.all([
          incidentService.getAreasList(),
          incidentService.getRoutesList(),
          incidentService.getSourcesList(),
          incidentService.getTypesList(),
          incidentService.getPrioritiesList(),
          treeService.getTreesList()
        ]);

        setAreas(areaList);
        setRoutes(routeList);
        setSources(sourceList.filter(s => s.trang_thai !== 'Tạm dừng'));
        setTypes(typeList.filter(t => t.trang_thai !== 'Tạm dừng'));
        setPriorities(priorityList.filter(p => p.trang_thai !== 'Tạm dừng'));
        setAllTrees(treeList);
      } catch (err) {
        console.error('Failed to load metadata', err);
        setError('Không thể tải dữ liệu danh mục. Vui lòng thử lại.');
      } finally {
        setInitLoading(false);
      }
    };
    loadMetadata();
  }, []);

  // Filtered trees based on selected Area and Route
  const filteredTrees = allTrees.filter((tree) => {
    if (selectedArea && tree.khu_vuc !== selectedArea) return false;
    if (selectedRoute && tree.tuyen_duong !== selectedRoute) return false;
    return true;
  });

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setImage64(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTree) {
      setError('Vui lòng chọn cây xanh liên quan.');
      return;
    }

    setLoading(true);
    setError('');
    setAiResponse(null);

    // Find the title based on type or fallback
    const incidentTitle = `${selectedType || 'Sự cố cây xanh'} - ${selectedTree}`;

    try {
      const res = await incidentService.reportIncident({
        incident_title: incidentTitle,
        tree: selectedTree,
        reporter_name: reporterName,
        reporter_phone: reporterPhone,
        description,
        image_base64: image64,
        muc_do_uu_tien: selectedPriority || undefined,
        loai_su_co: selectedType || undefined,
        nguon_su_co: selectedSource || undefined,
        trang_thai: selectedStatus
      });

      setAiResponse(res);
      
      // Reset input fields
      setReporterName('');
      setReporterPhone('');
      setDescription('');
      setSelectedTree('');
      setSelectedArea('');
      setSelectedRoute('');
      setSelectedType('');
      setSelectedSource('');
      setSelectedPriority('');
      setImage64(undefined);
    } catch (err: any) {
      setError(err.response?.data?.message || err.response?.data?.exception || 'Gửi báo cáo thất bại.');
    } finally {
      setLoading(false);
    }
  };

  if (initLoading) {
    return (
      <div className="flex items-center justify-center p-12 min-h-screen">
        <Spinner label="Đang tải cấu hình..." />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 bg-slate-50 min-h-full">
      {/* Header Panel */}
      <div className="flex items-center gap-4 bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm">
        <Button 
          appearance="subtle" 
          icon={<ArrowLeftRegular />} 
          onClick={() => navigate('/incident-list')}
        />
        <div>
          <span className="text-xs text-slate-400">Quản lý sự cố / Báo sự cố mới</span>
          <h2 className="text-lg font-bold text-slate-800 m-0 mt-0.5">Báo cáo sự cố mới</h2>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Form Column */}
        <form onSubmit={handleSubmit} className="lg:col-span-2 flex flex-col gap-6">
          {error && (
            <MessageBar intent="error">
              <MessageBarBody>{error}</MessageBarBody>
            </MessageBar>
          )}

          {/* Group 1: Thông tin sự cố */}
          <Card className="p-6 bg-white shadow-sm border border-slate-200/80 flex flex-col gap-4">
            <h3 className="text-base font-bold text-slate-800 border-b border-slate-100 pb-2 m-0">Thông tin sự cố</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex flex-col gap-1">
                <Label className="font-semibold text-slate-700">Mã sự cố *</Label>
                <Input value={incidentCode} disabled className="bg-slate-50 font-mono text-xs" />
              </div>
              <div className="flex flex-col gap-1">
                <Label className="font-semibold text-slate-700">Thời gian xảy ra</Label>
                <Input value={timeOccurred} disabled className="bg-slate-50 text-xs" />
              </div>
              <div className="flex flex-col gap-1">
                <Label htmlFor="source-select" className="font-semibold text-slate-700">Nguồn báo sự cố</Label>
                <Select
                  id="source-select"
                  value={selectedSource}
                  onChange={(e) => setSelectedSource(e.target.value)}
                >
                  <option value="">-- Chọn nguồn báo --</option>
                  {sources.map((s) => (
                    <option key={s.name} value={s.name}>{s.ten_nguon || s.name}</option>
                  ))}
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex flex-col gap-1">
                <Label htmlFor="type-select" className="font-semibold text-slate-700">Loại sự cố</Label>
                <Select
                  id="type-select"
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                >
                  <option value="">-- Chọn loại sự cố --</option>
                  {types.map((t) => (
                    <option key={t.name} value={t.name}>{t.ten_loai || t.name}</option>
                  ))}
                </Select>
              </div>
              <div className="flex flex-col gap-1">
                <Label htmlFor="priority-select" className="font-semibold text-slate-700">Mức độ nghiêm trọng</Label>
                <Select
                  id="priority-select"
                  value={selectedPriority}
                  onChange={(e) => setSelectedPriority(e.target.value)}
                >
                  <option value="">-- Chọn mức độ --</option>
                  {priorities.map((p) => (
                    <option key={p.name} value={p.name}>{p.ten_muc_do || p.name}</option>
                  ))}
                </Select>
              </div>
              <div className="flex flex-col gap-1">
                <Label className="font-semibold text-slate-700">Trạng thái</Label>
                <Input value="Mới tiếp nhận" disabled className="bg-slate-50" />
              </div>
            </div>
          </Card>

          {/* Group 2: Cây xanh liên quan */}
          <Card className="p-6 bg-white shadow-sm border border-slate-200/80 flex flex-col gap-4">
            <h3 className="text-base font-bold text-slate-800 border-b border-slate-100 pb-2 m-0">Cây xanh liên quan *</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex flex-col gap-1">
                <Label htmlFor="area-filter" className="font-semibold text-slate-700">Lọc theo khu vực</Label>
                <Select
                  id="area-filter"
                  value={selectedArea}
                  onChange={(e) => {
                    setSelectedArea(e.target.value);
                    setSelectedTree(''); // Reset tree selection
                  }}
                >
                  <option value="">Tất cả khu vực</option>
                  {areas.map((a) => (
                    <option key={a.name} value={a.name}>{a.ten_khu_vuc}</option>
                  ))}
                </Select>
              </div>

              <div className="flex flex-col gap-1">
                <Label htmlFor="route-filter" className="font-semibold text-slate-700">Lọc theo tuyến đường</Label>
                <Select
                  id="route-filter"
                  value={selectedRoute}
                  onChange={(e) => {
                    setSelectedRoute(e.target.value);
                    setSelectedTree(''); // Reset tree selection
                  }}
                >
                  <option value="">Tất cả tuyến đường</option>
                  {routes.map((r) => (
                    <option key={r.name} value={r.name}>{r.ten_tuyen}</option>
                  ))}
                </Select>
              </div>

              <div className="flex flex-col gap-1">
                <Label htmlFor="tree-select" className="font-semibold text-slate-700">Tìm và thêm cây...</Label>
                <Select
                  id="tree-select"
                  value={selectedTree}
                  onChange={(e) => setSelectedTree(e.target.value)}
                  required
                >
                  <option value="">-- Chọn mã cây xanh --</option>
                  {filteredTrees.map((tree) => (
                    <option key={tree.name} value={tree.ma_tai_san}>
                      {tree.ma_tai_san} - {tree.ten_tai_san} ({tree.trang_thai})
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            <div className="text-xs text-slate-500 italic mt-1">
              {selectedTree ? (
                <span className="text-teal-700 font-semibold">
                  Cây xanh đã chọn: {selectedTree} - {allTrees.find(t => t.ma_tai_san === selectedTree)?.ten_tai_san}
                </span>
              ) : (
                'Chưa có cây nào được chọn.'
              )}
            </div>
          </Card>

          {/* Group 3: Thông tin người báo */}
          <Card className="p-6 bg-white shadow-sm border border-slate-200/80 flex flex-col gap-4">
            <h3 className="text-base font-bold text-slate-800 border-b border-slate-100 pb-2 m-0">Thông tin người báo sự cố</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <Label htmlFor="reporter-name" className="font-semibold text-slate-700">Họ tên người báo</Label>
                <Input
                  id="reporter-name"
                  placeholder="Nhập họ tên..."
                  value={reporterName}
                  onChange={(e) => setReporterName(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1">
                <Label htmlFor="reporter-phone" className="font-semibold text-slate-700">Số điện thoại</Label>
                <Input
                  id="reporter-phone"
                  placeholder="Nhập số điện thoại..."
                  value={reporterPhone}
                  onChange={(e) => setReporterPhone(e.target.value)}
                />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <Label htmlFor="desc" className="font-semibold text-slate-700">Mô tả chi tiết</Label>
              <Textarea
                id="desc"
                placeholder="Mô tả mức độ nguy hiểm, cản trở giao thông hay không..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label className="font-semibold text-slate-700">Hình ảnh hiện trường</Label>
              <div className="flex items-center gap-3">
                <label 
                  htmlFor="file-upload" 
                  className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-md bg-white text-sm font-medium hover:bg-slate-50 cursor-pointer shadow-sm select-none"
                >
                  <CameraRegular className="text-lg text-slate-500" />
                  Tải ảnh lên
                </label>
                <input
                  id="file-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                {image64 && (
                  <span className="text-xs text-emerald-600 font-medium">
                    Đã chọn hình ảnh ✔
                  </span>
                )}
              </div>
              {image64 && (
                <div className="w-48 h-48 rounded-lg overflow-hidden border border-slate-200 mt-2 shadow-sm">
                  <img src={image64} alt="Preview" className="w-full h-full object-cover" />
                </div>
              )}
            </div>
          </Card>

          <div className="flex justify-end gap-3 mt-2">
            <Button 
              type="button" 
              appearance="outline" 
              onClick={() => navigate('/incident-list')}
              size="large"
            >
              Hủy bỏ
            </Button>
            <Button 
              type="submit" 
              appearance="primary" 
              size="large" 
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {loading ? <Spinner size="tiny" label="Đang gửi báo cáo..." /> : 'Gửi báo cáo sự cố'}
            </Button>
          </div>
        </form>

        {/* AI Results Side Pane */}
        <div className="flex flex-col gap-6">
          {aiResponse ? (
            <Card className="p-6 bg-gradient-to-br from-slate-900 to-teal-950 text-white shadow-xl border-0">
              <div className="flex items-center gap-3 border-b border-teal-800/50 pb-4 mb-4">
                <AlertUrgentRegular className="text-amber-400 text-3xl animate-pulse" />
                <div>
                  <h3 className="text-lg font-bold text-white m-0">AI Đánh giá tức thời</h3>
                  <span className="text-xs text-teal-300">Gemini Generative Engine</span>
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <div className="flex justify-between items-center bg-teal-900/30 p-3 rounded-lg border border-teal-800/40">
                  <span className="text-sm text-slate-300">Độ nguy hiểm (Hazardous):</span>
                  <span className={`px-2.5 py-1 rounded text-xs font-bold ${
                    aiResponse.ai_is_hazardous === 1 
                      ? 'bg-red-500/20 text-red-400 border border-red-500/30' 
                      : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  }`}>
                    {aiResponse.ai_is_hazardous === 1 ? 'Cảnh báo nguy hiểm ⚠️' : 'An toàn / Chờ duyệt'}
                  </span>
                </div>

                <div className="flex flex-col gap-1">
                  <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Lý do phân tích:</span>
                  <p className="text-sm text-slate-200 bg-black/20 p-4 rounded-lg leading-relaxed border border-teal-950 shadow-inner m-0">
                    {aiResponse.ai_reason}
                  </p>
                </div>

                {aiResponse.tree_status_updated && (
                  <div className="bg-amber-500/10 p-3 rounded-lg border border-amber-500/20 text-xs text-amber-300 leading-normal flex items-start gap-2">
                    <span>💡</span>
                    <span>AI đã tự động cập nhật trạng thái cây xanh này sang: <strong>{aiResponse.tree_status_updated}</strong> và chuyển đổi trạng thái sự cố thành <strong>Đang xử lý</strong>.</span>
                  </div>
                )}
              </div>
            </Card>
          ) : (
            <Card className="p-6 bg-gray-100 border border-dashed border-gray-300 text-center flex flex-col justify-center items-center py-20 text-gray-500">
              <CheckmarkCircleRegular className="text-gray-400 text-4xl mb-3" />
              <p className="text-sm font-semibold m-0">Chờ báo cáo...</p>
              <p className="text-xs text-gray-400 mt-1 max-w-xs m-0 font-light">
                Sau khi gửi báo cáo, Gemini AI sẽ tự động phân tích mức độ nguy hại của cây dựa trên mô tả và hình ảnh hiện trường của bạn ngay tại đây.
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};
