import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { treeService } from '../services/api';
import { urbanTreeApi } from '../api/urbanTreeApi';
import { 
  Button, 
  Table, 
  TableHeader, 
  TableBody, 
  TableRow, 
  TableCell, 
  TableHeaderCell,
  Input,
  Select,
  Dialog,
  DialogTrigger,
  DialogSurface,
  DialogTitle,
  DialogBody,
  DialogContent,
  DialogActions,
  Label,
  Spinner,
  MessageBar,
  MessageBarBody,
  TabList,
  Tab,
  Badge
} from '@fluentui/react-components';
import { 
  AddRegular, 
  EyeRegular, 
  EditRegular, 
  DeleteRegular, 
  ArrowClockwiseRegular,
  SearchRegular,
  WarningRegular
} from '@fluentui/react-icons';

interface TreeAsset {
  name: string;
  ma_tai_san: string;
  ten_tai_san: string;
  loai_cay: string;
  loai_cay_title?: string;
  khu_vuc: string;
  khu_vuc_title?: string;
  tuyen_duong: string;
  tuyen_duong_title?: string;
  du_an: string;
  toa_do_gps?: string;
  trang_thai: string;
  chi_phi_bao_duong?: number;
  ngay_lap_dat?: string;
}

export const TreeManagement: React.FC = () => {
  const navigate = useNavigate();
  const [trees, setTrees] = useState<TreeAsset[]>([]);
  const [species, setSpecies] = useState<any[]>([]);
  const [routes, setRoutes] = useState<any[]>([]);
  const [areas, setAreas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filter states
  const [filterProject, setFilterProject] = useState('');
  const [filterRoute, setFilterRoute] = useState('');
  const [filterArea, setFilterArea] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Dialog / Form states
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit' | 'view'>('create');
  const [selectedTree, setSelectedTree] = useState<Partial<TreeAsset>>({});
  
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  const [selectedTab, setSelectedTab] = useState<string>('info');
  const [treeDetails, setTreeDetails] = useState<any>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      // Fetch trees list
      const treeList = await treeService.getTreesList({
        du_an: filterProject || undefined,
        tuyen_duong: filterRoute || undefined,
        khu_vuc: filterArea || undefined,
        search: searchQuery || undefined
      });
      setTrees(treeList);

      // Fetch species
      const speciesList = await treeService.getTreeSpecies();
      setSpecies(speciesList);

      // Fetch routes
      const routesList = await urbanTreeApi.getTreeRoutes();
      setRoutes(routesList);

      // Fetch areas
      const mapData = await urbanTreeApi.getTreeMap();
      // Extract unique khu_vuc objects or hardcode areas based on what is available
      const uniqueAreas = Array.from(new Set(mapData.map(t => t.khu_vuc))).map(kv => {
        return { name: kv, title: kv === 'KV-HKB' ? 'Phường Hòa Khánh Bắc' : kv };
      });
      setAreas(uniqueAreas);
    } catch (error) {
      console.error('Failed to fetch tree assets data', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, [filterProject, filterRoute, filterArea, searchQuery]);

  const handleOpenDialog = async (mode: 'create' | 'edit' | 'view', tree?: TreeAsset) => {
    setFormMode(mode);
    setFormError('');
    setFormSuccess('');
    setSelectedTab('info');
    if (tree) {
      setSelectedTree(tree);
      if (mode === 'view') {
        setLoadingDetails(true);
        try {
          const details = await treeService.getTreeDetails(tree.ma_tai_san);
          setTreeDetails(details);
        } catch (err) {
          console.error("Failed to fetch tree details", err);
          setFormError('Không thể tải chi tiết lịch sử cây.');
        } finally {
          setLoadingDetails(false);
        }
      }
    } else {
      setSelectedTree({
        ma_tai_san: 'CX-' + Date.now().toString().slice(-6),
        ten_tai_san: '',
        loai_cay: species[0]?.ma_loai_cay || '',
        khu_vuc: 'KV-HKB',
        tuyen_duong: routes[0]?.ma_tuyen || '',
        du_an: 'Dự án hạ tầng kỹ thuật',
        toa_do_gps: '16.075,108.15',
        trang_thai: 'Tốt',
        chi_phi_bao_duong: 0,
        ngay_lap_dat: new Date().toISOString().split('T')[0]
      });
    }
    setIsDialogOpen(true);
  };

  const handleSaveTree = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');
    try {
      await treeService.createTreeAsset(selectedTree);
      setFormSuccess(formMode === 'create' ? 'Thêm mới cây xanh thành công!' : 'Cập nhật cây xanh thành công!');
      setTimeout(() => {
        setIsDialogOpen(false);
        fetchInitialData();
      }, 1000);
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Có lỗi xảy ra khi lưu cây xanh.');
    }
  };

  const handleDeleteTree = async (ma_tai_san: string) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa cây xanh ${ma_tai_san}?`)) {
      try {
        await treeService.deleteTreeAsset(ma_tai_san);
        fetchInitialData();
      } catch (err) {
        alert('Không thể xóa cây xanh này.');
      }
    }
  };

  return (
    <div className="flex flex-col gap-6 bg-slate-50 min-h-full">
      {/* Top Header Panel */}
      <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-800 m-0">Quản lý cây xanh</h2>
          <p className="text-sm text-slate-500 m-0">Danh sách tài sản cây xanh đô thị thông minh</p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            appearance="outline" 
            icon={<ArrowClockwiseRegular />} 
            onClick={fetchInitialData}
          >
            Đồng bộ 3D
          </Button>
          <Button appearance="outline">
            Import
          </Button>
          <Button 
            appearance="primary" 
            icon={<AddRegular />}
            onClick={() => handleOpenDialog('create')}
            className="bg-teal-600 hover:bg-teal-700 text-white"
          >
            Thêm cây
          </Button>
        </div>
      </div>

      {/* Advanced Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row gap-4 items-center">
        <div className="flex-1 w-full grid grid-cols-1 md:grid-cols-4 gap-4">
          <Select 
            value={filterProject} 
            onChange={(e) => setFilterProject(e.target.value)}
            className="w-full"
          >
            <option value="">Dự án (Tất cả)</option>
            <option value="Dự án hạ tầng kỹ thuật">Dự án hạ tầng kỹ thuật</option>
          </Select>

          <Select 
            value={filterRoute} 
            onChange={(e) => setFilterRoute(e.target.value)}
            className="w-full"
          >
            <option value="">Tuyến đường (Tất cả)</option>
            {routes.map(r => (
              <option key={r.ma_tuyen} value={r.ma_tuyen}>{r.ten_tuyen}</option>
            ))}
          </Select>

          <Select 
            value={filterArea} 
            onChange={(e) => setFilterArea(e.target.value)}
            className="w-full"
          >
            <option value="">Khu vực (Tất cả)</option>
            {areas.map(a => (
              <option key={a.name} value={a.name}>{a.title}</option>
            ))}
          </Select>

          <Input
            contentBefore={<SearchRegular />}
            placeholder="Tìm kiếm cây xanh..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full"
          />
        </div>
        <Button 
          appearance="subtle" 
          icon={<ArrowClockwiseRegular />}
          onClick={() => {
            setFilterProject('');
            setFilterRoute('');
            setFilterArea('');
            setSearchQuery('');
          }}
        />
      </div>

      {/* Trees Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center p-12">
            <Spinner label="Đang tải danh sách cây xanh..." />
          </div>
        ) : (
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow>
                <TableHeaderCell className="font-bold text-slate-700">Tên</TableHeaderCell>
                <TableHeaderCell className="font-bold text-slate-700">Dự án</TableHeaderCell>
                <TableHeaderCell className="font-bold text-slate-700">Tuyến đường</TableHeaderCell>
                <TableHeaderCell className="font-bold text-slate-700">Khu vực</TableHeaderCell>
                <TableHeaderCell className="font-bold text-slate-700 w-32">Hành động</TableHeaderCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {trees.map((tree) => (
                <TableRow key={tree.ma_tai_san} className="hover:bg-slate-50/40">
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-semibold text-slate-800">{tree.ten_tai_san || `Cây xanh ${tree.ma_tai_san}`}</span>
                      <span className="text-xs text-slate-400 font-mono">{tree.ma_tai_san} ({tree.loai_cay_title || tree.loai_cay})</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="bg-purple-50 text-purple-700 text-xs px-2 py-0.5 rounded-full font-medium">
                      {tree.du_an || 'Chưa phân loại'}
                    </span>
                  </TableCell>
                  <TableCell className="text-slate-600">{tree.tuyen_duong_title || tree.tuyen_duong || '—'}</TableCell>
                  <TableCell className="text-slate-600">{tree.khu_vuc_title || tree.khu_vuc || '—'}</TableCell>
                  <TableCell>
                    <div className="flex gap-1.5">
                      <Button 
                        size="small" 
                        appearance="subtle" 
                        icon={<EyeRegular className="text-teal-600" />}
                        onClick={() => handleOpenDialog('view', tree)}
                        title="Xem chi tiết"
                      />
                      <Button 
                        size="small" 
                        appearance="subtle" 
                        icon={<EditRegular className="text-blue-600" />}
                        onClick={() => handleOpenDialog('edit', tree)}
                        title="Sửa thông tin"
                      />
                      <Button 
                        size="small" 
                        appearance="subtle" 
                        icon={<WarningRegular className="text-amber-500" />}
                        onClick={() => navigate('/report', { state: { treeId: tree.ma_tai_san } })}
                        title="Báo cáo sự cố"
                      />
                      <Button 
                        size="small" 
                        appearance="subtle" 
                        icon={<DeleteRegular className="text-rose-600" />}
                        onClick={() => handleDeleteTree(tree.ma_tai_san)}
                        title="Xóa cây"
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {trees.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-10 text-slate-400">
                    Không tìm thấy cây xanh nào phù hợp với bộ lọc.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Add / Edit / View Dialog Form */}
      <Dialog open={isDialogOpen} onOpenChange={(_, data) => setIsDialogOpen(data.open)}>
        <DialogSurface className="max-w-xl w-full">
          <DialogBody>
            <DialogTitle>
              {formMode === 'create' && 'Thêm cây xanh mới'}
              {formMode === 'edit' && `Sửa thông tin cây xanh ${selectedTree.ma_tai_san}`}
              {formMode === 'view' && `Chi tiết cây xanh ${selectedTree.ma_tai_san}`}
            </DialogTitle>
            <DialogContent className="py-4">
              {formMode === 'view' && (
                <div className="mb-4">
                  <TabList selectedValue={selectedTab} onTabSelect={(_, data) => setSelectedTab(data.value as string)}>
                    <Tab value="info">Thông tin chung</Tab>
                    <Tab value="incidents">Lịch sử sự cố ({treeDetails?.incidents?.length || 0})</Tab>
                    <Tab value="work_orders">Lịch sử bảo trì ({treeDetails?.work_orders?.length || 0})</Tab>
                  </TabList>
                </div>
              )}
              
              {loadingDetails && formMode === 'view' ? (
                <div className="flex items-center justify-center p-12">
                  <Spinner label="Đang tải chi tiết cây xanh..." />
                </div>
              ) : formMode === 'view' && selectedTab !== 'info' ? (
                selectedTab === 'incidents' ? (
                  <div className="flex flex-col gap-4">
                    {treeDetails?.incidents?.length > 0 ? treeDetails.incidents.map((inc: any) => (
                      <div key={inc.name} className="p-3 border border-slate-200 rounded-lg bg-slate-50">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-semibold">{inc.tieu_de}</span>
                          <Badge color={inc.trang_thai === 'Mới' ? 'danger' : inc.trang_thai === 'Đã xử lý' ? 'success' : 'warning'}>{inc.trang_thai}</Badge>
                        </div>
                        <div className="text-sm text-slate-500">Mức độ: {inc.muc_do_uu_tien} | Loại: {inc.loai_su_co}</div>
                        <div className="text-xs text-slate-400 mt-1">Ngày báo cáo: {new Date(inc.creation).toLocaleDateString('vi-VN')}</div>
                      </div>
                    )) : <p className="text-slate-500 italic">Chưa có sự cố nào được ghi nhận.</p>}
                  </div>
                ) : (
                  <div className="flex flex-col gap-4">
                    {treeDetails?.work_orders?.length > 0 ? treeDetails.work_orders.map((wo: any) => (
                      <div key={wo.name} className="p-3 border border-slate-200 rounded-lg bg-slate-50">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-semibold">{wo.ten_cong_viec}</span>
                          <Badge color={wo.trang_thai === 'Đã nghiệm thu đạt' ? 'success' : 'warning'}>{wo.trang_thai}</Badge>
                        </div>
                        <div className="text-sm text-slate-500">Người thực hiện: {wo.nguoi_thuc_hien} | Đơn vị: {wo.don_vi_thi_cong}</div>
                        <div className="text-xs text-slate-400 mt-1">
                          Bắt đầu: {wo.ngay_bat_dau ? new Date(wo.ngay_bat_dau).toLocaleDateString('vi-VN') : '—'} - 
                          Hoàn thành: {wo.ngay_hoan_thanh ? new Date(wo.ngay_hoan_thanh).toLocaleDateString('vi-VN') : '—'}
                        </div>
                      </div>
                    )) : <p className="text-slate-500 italic">Chưa có lịch sử bảo trì.</p>}
                  </div>
                )
              ) : (
              <form onSubmit={handleSaveTree} className="flex flex-col gap-4">
                {formError && (
                  <MessageBar intent="error">
                    <MessageBarBody>{formError}</MessageBarBody>
                  </MessageBar>
                )}
                {formSuccess && (
                  <MessageBar intent="success">
                    <MessageBarBody>{formSuccess}</MessageBarBody>
                  </MessageBar>
                )}
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <Label htmlFor="ma_tai_san" className="font-semibold text-gray-700">Mã tài sản *</Label>
                    <Input
                      id="ma_tai_san"
                      required
                      value={selectedTree.ma_tai_san || ''}
                      onChange={(e) => setSelectedTree({ ...selectedTree, ma_tai_san: e.target.value })}
                      disabled={formMode !== 'create'}
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <Label htmlFor="ten_tai_san" className="font-semibold text-gray-700">Tên tài sản *</Label>
                    <Input
                      id="ten_tai_san"
                      required
                      value={selectedTree.ten_tai_san || ''}
                      onChange={(e) => setSelectedTree({ ...selectedTree, ten_tai_san: e.target.value })}
                      disabled={formMode === 'view'}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <Label htmlFor="loai_cay" className="font-semibold text-gray-700">Loại cây *</Label>
                    <Select
                      id="loai_cay"
                      required
                      value={selectedTree.loai_cay || ''}
                      onChange={(e) => setSelectedTree({ ...selectedTree, loai_cay: e.target.value })}
                      disabled={formMode === 'view'}
                    >
                      {species.map(s => (
                        <option key={s.ma_loai_cay} value={s.ma_loai_cay}>{s.ten_loai_cay}</option>
                      ))}
                    </Select>
                  </div>

                  <div className="flex flex-col gap-1">
                    <Label htmlFor="khu_vuc" className="font-semibold text-gray-700">Khu vực *</Label>
                    <Select
                      id="khu_vuc"
                      required
                      value={selectedTree.khu_vuc || ''}
                      onChange={(e) => setSelectedTree({ ...selectedTree, khu_vuc: e.target.value })}
                      disabled={formMode === 'view'}
                    >
                      {areas.map(a => (
                        <option key={a.name} value={a.name}>{a.title}</option>
                      ))}
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <Label htmlFor="tuyen_duong" className="font-semibold text-gray-700">Tuyến đường</Label>
                    <Select
                      id="tuyen_duong"
                      value={selectedTree.tuyen_duong || ''}
                      onChange={(e) => setSelectedTree({ ...selectedTree, tuyen_duong: e.target.value })}
                      disabled={formMode === 'view'}
                    >
                      <option value="">Không có</option>
                      {routes.map(r => (
                        <option key={r.ma_tuyen} value={r.ma_tuyen}>{r.ten_tuyen}</option>
                      ))}
                    </Select>
                  </div>

                  <div className="flex flex-col gap-1">
                    <Label htmlFor="du_an" className="font-semibold text-gray-700">Dự án</Label>
                    <Input
                      id="du_an"
                      value={selectedTree.du_an || ''}
                      onChange={(e) => setSelectedTree({ ...selectedTree, du_an: e.target.value })}
                      disabled={formMode === 'view'}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <Label htmlFor="toa_do_gps" className="font-semibold text-gray-700">Tọa độ GPS (lat,lng)</Label>
                    <Input
                      id="toa_do_gps"
                      placeholder="e.g. 16.074,108.151"
                      value={selectedTree.toa_do_gps || ''}
                      onChange={(e) => setSelectedTree({ ...selectedTree, toa_do_gps: e.target.value })}
                      disabled={formMode === 'view'}
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <Label htmlFor="trang_thai" className="font-semibold text-gray-700">Trạng thái *</Label>
                    <Select
                      id="trang_thai"
                      required
                      value={selectedTree.trang_thai || 'Tốt'}
                      onChange={(e) => setSelectedTree({ ...selectedTree, trang_thai: e.target.value })}
                      disabled={formMode === 'view'}
                    >
                      <option value="Tốt">Tốt</option>
                      <option value="Cần cắt tỉa">Cần cắt tỉa</option>
                      <option value="Sâu bệnh">Sâu bệnh</option>
                      <option value="Gãy đổ">Gãy đổ</option>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <Label htmlFor="chi_phi_bao_duong" className="font-semibold text-gray-700">Chi phí bảo dưỡng</Label>
                    <Input
                      id="chi_phi_bao_duong"
                      type="number"
                      value={selectedTree.chi_phi_bao_duong?.toString() || '0'}
                      onChange={(e) => setSelectedTree({ ...selectedTree, chi_phi_bao_duong: parseFloat(e.target.value) })}
                      disabled={formMode === 'view'}
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <Label htmlFor="ngay_lap_dat" className="font-semibold text-gray-700">Ngày trồng</Label>
                    <Input
                      id="ngay_lap_dat"
                      type="date"
                      value={selectedTree.ngay_lap_dat || ''}
                      onChange={(e) => setSelectedTree({ ...selectedTree, ngay_lap_dat: e.target.value })}
                      disabled={formMode === 'view'}
                    />
                  </div>
                </div>

                <DialogActions className="mt-4 pt-4 border-t border-slate-100 flex justify-end gap-2">
                  <DialogTrigger disableButtonEnhancement>
                    <Button appearance="secondary">Đóng</Button>
                  </DialogTrigger>
                  {formMode !== 'view' && (
                    <Button 
                      type="submit" 
                      appearance="primary"
                      className="bg-teal-600 hover:bg-teal-700 text-white"
                    >
                      Lưu lại
                    </Button>
                  )}
                </DialogActions>
              </form>
              )}
            </DialogContent>
          </DialogBody>
        </DialogSurface>
      </Dialog>
    </div>
  );
};
