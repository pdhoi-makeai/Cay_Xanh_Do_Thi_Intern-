import React, { useState, useEffect } from 'react';
import { executionService, carePlanService, treeService, incidentService } from '../services/api';
import { 
  Button, 
  Table, 
  TableHeader, 
  TableBody, 
  TableRow, 
  TableCell, 
  TableHeaderCell,
  Input,
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
  Select,
  Textarea
} from '@fluentui/react-components';
import { 
  AddRegular, 
  EditRegular, 
  DeleteRegular, 
  ArrowClockwiseRegular,
  SearchRegular,
  EyeRegular,
  DocumentRegular
} from '@fluentui/react-icons';
import { useNavigate } from 'react-router-dom';

interface WorkOrder {
  name: string;
  ten_cong_viec: string;
  tree?: string;
  su_co?: string;
  nguoi_thuc_hien?: string;
  don_vi_thi_cong?: string;
  trang_thai: string;
  ngay_bat_dau?: string;
  ngay_hoan_thanh?: string;
  han_chot?: string;
  muc_do_uu_tien: string;
  ke_hoach?: string;
  tieu_de_ke_hoach?: string;
  loai_cv?: string;
  ket_qua_nghiem_thu?: string;
}

export const WorkOrders: React.FC = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);

  // Metadata dropdown lists
  const [carePlans, setCarePlans] = useState<any[]>([]);
  const [actionTypes, setActionTypes] = useState<any[]>([]);
  const [trees, setTrees] = useState<any[]>([]);
  const [incidents, setIncidents] = useState<any[]>([]);
  const [contractors, setContractors] = useState<string[]>([]);
  const [assignees] = useState<string[]>([
    'Administrator',
    'loi@greencity.local',
    'hau@greencity.local'
  ]);

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterUnit, setFilterUnit] = useState('');
  const [filterActionType, setFilterActionType] = useState('');
  const [filterPriority, setFilterPriority] = useState('');

  // Dialog state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit' | 'view'>('create');
  const [selectedRecord, setSelectedRecord] = useState<Partial<WorkOrder>>({});
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  const fetchMetadata = async () => {
    try {
      const [plansList, actionsList, treesList, incidentsList] = await Promise.all([
        carePlanService.getCarePlansList(),
        executionService.getActionTypesList(),
        treeService.getTreesList(),
        incidentService.getIncidentsList()
      ]);
      setCarePlans(plansList);
      setActionTypes(actionsList);
      setTrees(treesList);
      setIncidents(incidentsList);
      
      // Extract unique contractor units for the filter dropdown
      const rawOrders = await executionService.getWorkOrdersList();
      const uniqueUnits = Array.from(new Set(rawOrders.map(o => o.don_vi_thi_cong).filter(Boolean))) as string[];
      setContractors(uniqueUnits);
    } catch (err) {
      console.error('Failed to load work order metadata', err);
    }
  };

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const list = await executionService.getWorkOrdersList({
        search: searchQuery || undefined,
        trang_thai: filterStatus || undefined,
        don_vi_thi_cong: filterUnit || undefined,
        loai_cv: filterActionType || undefined,
        muc_do_uu_tien: filterPriority || undefined
      });
      setOrders(list);
    } catch (err) {
      console.error('Failed to load work orders', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetadata();
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [searchQuery, filterStatus, filterUnit, filterActionType, filterPriority]);

  const handleOpenDialog = (mode: 'create' | 'edit' | 'view', rec?: WorkOrder) => {
    setFormMode(mode);
    setFormError('');
    setFormSuccess('');
    if (rec) {
      setSelectedRecord(rec);
    } else {
      setSelectedRecord({
        ten_cong_viec: '',
        tree: '',
        su_co: '',
        nguoi_thuc_hien: 'Administrator',
        don_vi_thi_cong: '',
        trang_thai: 'Chưa xử lý',
        ngay_bat_dau: new Date().toISOString().split('T')[0],
        ngay_hoan_thanh: '',
        han_chot: '',
        muc_do_uu_tien: 'Medium',
        ke_hoach: '',
        loai_cv: '',
        ket_qua_nghiem_thu: ''
      });
    }
    setIsDialogOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formMode === 'view') {
      setIsDialogOpen(false);
      return;
    }
    setFormError('');
    setFormSuccess('');

    if (!selectedRecord.ten_cong_viec) {
      setFormError('Vui lòng nhập tên công việc.');
      return;
    }

    try {
      await executionService.createWorkOrder(selectedRecord);
      setFormSuccess(formMode === 'create' ? 'Tạo phiếu công việc thành công!' : 'Cập nhật phiếu công việc thành công!');
      setTimeout(() => {
        setIsDialogOpen(false);
        fetchOrders();
      }, 1000);
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Không thể lưu phiếu công việc.');
    }
  };

  const handleDelete = async (name: string) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa phiếu công việc ${name}?`)) {
      try {
        await executionService.deleteWorkOrder(name);
        fetchOrders();
      } catch (err) {
        alert('Không thể xóa phiếu công việc này.');
      }
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '—';
    try {
      const parts = dateStr.split('-');
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    } catch {
      return dateStr;
    }
  };

  const getPriorityBadgeClass = (priority?: string) => {
    switch (priority) {
      case 'High':
      case 'Cao':
        return 'bg-rose-50 text-rose-700 border border-rose-200';
      case 'Medium':
      case 'Trung bình':
        return 'bg-blue-50 text-blue-700 border border-blue-200';
      case 'Low':
      case 'Thấp':
        return 'bg-slate-100 text-slate-600';
      default:
        return 'bg-slate-100 text-slate-600';
    }
  };

  const translatePriority = (priority?: string) => {
    switch (priority) {
      case 'High': return 'Cao';
      case 'Medium': return 'Trung bình';
      case 'Low': return 'Thấp';
      default: return priority || '—';
    }
  };

  return (
    <div className="flex flex-col gap-6 bg-slate-50 min-h-full">
      {/* Header Panel */}
      <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-800 m-0">Phiếu công việc</h2>
          <p className="text-sm text-slate-500 m-0">Quản lý các phiếu giao việc, sửa chữa, cắt tỉa và xử lý sự cố cây xanh</p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            appearance="outline" 
            icon={<ArrowClockwiseRegular />} 
            onClick={fetchOrders}
          >
            Làm mới
          </Button>
          <Button 
            appearance="primary" 
            icon={<AddRegular />}
            onClick={() => handleOpenDialog('create')}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            Tạo phiếu công việc
          </Button>
        </div>
      </div>

      {/* Advanced Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
        <Input
          contentBefore={<SearchRegular />}
          placeholder="Tìm kiếm theo mã phiếu, kế hoạch..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full"
        />

        <Select 
          value={filterStatus} 
          onChange={(e) => setFilterStatus(e.target.value)}
          className="w-full"
        >
          <option value="">Trạng thái (Tất cả)</option>
          <option value="Chưa xử lý">Chưa xử lý</option>
          <option value="Đang thực hiện">Đang thực hiện</option>
          <option value="Chờ nghiệm thu">Chờ nghiệm thu</option>
          <option value="Đã nghiệm thu đạt">Đã nghiệm thu đạt</option>
          <option value="Đã nghiệm thu lỗi">Đã nghiệm thu lỗi</option>
        </Select>

        <Select 
          value={filterUnit} 
          onChange={(e) => setFilterUnit(e.target.value)}
          className="w-full"
        >
          <option value="">Đơn vị (Tất cả)</option>
          {contractors.map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </Select>

        <Select 
          value={filterActionType} 
          onChange={(e) => setFilterActionType(e.target.value)}
          className="w-full"
        >
          <option value="">Loại công việc (Tất cả)</option>
          {actionTypes.map(at => (
            <option key={at.name} value={at.name}>{at.ten_hanh_dong}</option>
          ))}
        </Select>

        <Select 
          value={filterPriority} 
          onChange={(e) => setFilterPriority(e.target.value)}
          className="w-full"
        >
          <option value="">Ưu tiên (Tất cả)</option>
          <option value="Low">Thấp</option>
          <option value="Medium">Trung bình</option>
          <option value="High">Cao</option>
        </Select>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center p-12">
            <Spinner label="Đang tải danh sách phiếu công việc..." />
          </div>
        ) : (
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow>
                <TableHeaderCell className="font-bold text-slate-700">Mã phiếu</TableHeaderCell>
                <TableHeaderCell className="font-bold text-slate-700">Kế hoạch</TableHeaderCell>
                <TableHeaderCell className="font-bold text-slate-700">Loại CV</TableHeaderCell>
                <TableHeaderCell className="font-bold text-slate-700">Đơn vị</TableHeaderCell>
                <TableHeaderCell className="font-bold text-slate-700">Người TH</TableHeaderCell>
                <TableHeaderCell className="font-bold text-slate-700">Trạng thái</TableHeaderCell>
                <TableHeaderCell className="font-bold text-slate-700">Ưu tiên</TableHeaderCell>
                <TableHeaderCell className="font-bold text-slate-700">Ngày PH</TableHeaderCell>
                <TableHeaderCell className="font-bold text-slate-700 w-36">Thao tác</TableHeaderCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((rec) => (
                <TableRow key={rec.name} className="hover:bg-slate-50/40">
                  <TableCell className="font-mono text-xs font-semibold text-slate-700">{rec.name}</TableCell>
                  <TableCell className="text-slate-800 font-semibold max-w-xs truncate" title={rec.tieu_de_ke_hoach || '—'}>
                    {rec.tieu_de_ke_hoach || '—'}
                  </TableCell>
                  <TableCell className="text-slate-600">{rec.loai_cv || '—'}</TableCell>
                  <TableCell className="text-slate-600">{rec.don_vi_thi_cong || '—'}</TableCell>
                  <TableCell className="text-slate-500 text-xs truncate max-w-[120px]">{rec.nguoi_thuc_hien || '—'}</TableCell>
                  <TableCell>
                    <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                      rec.trang_thai === 'Đã nghiệm thu đạt' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                      rec.trang_thai === 'Đang thực hiện' ? 'bg-blue-50 text-blue-700 border border-blue-100' :
                      rec.trang_thai === 'Chờ nghiệm thu' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                      rec.trang_thai === 'Đã nghiệm thu lỗi' ? 'bg-rose-50 text-rose-700 border border-rose-100' :
                      'bg-slate-100 text-slate-600'
                    }`}>
                      {rec.trang_thai}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className={`text-[11px] px-2.5 py-0.5 rounded font-semibold ${getPriorityBadgeClass(rec.muc_do_uu_tien)}`}>
                      {translatePriority(rec.muc_do_uu_tien)}
                    </span>
                  </TableCell>
                  <TableCell className="text-slate-500 text-xs">{formatDate(rec.ngay_bat_dau)}</TableCell>
                  <TableCell>
                    <div className="flex gap-0.5">
                      <Button 
                        size="small" 
                        appearance="subtle" 
                        icon={<EyeRegular className="text-blue-500 text-base" />}
                        title="Xem chi tiết"
                        onClick={() => handleOpenDialog('view', rec)}
                      />
                      <Button 
                        size="small" 
                        appearance="subtle" 
                        icon={<DocumentRegular className="text-emerald-600 text-base" />}
                        title="Nhật ký thi công"
                        onClick={() => navigate('/work-logs')}
                      />
                      <Button 
                        size="small" 
                        appearance="subtle" 
                        icon={<EditRegular className="text-amber-600 text-base" />}
                        title="Sửa"
                        onClick={() => handleOpenDialog('edit', rec)}
                      />
                      <Button 
                        size="small" 
                        appearance="subtle" 
                        icon={<DeleteRegular className="text-rose-600 text-base" />}
                        title="Xóa"
                        onClick={() => handleDelete(rec.name)}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {orders.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-10 text-slate-400">
                    Không tìm thấy phiếu công việc nào.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Create / Edit / View Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={(_, data) => setIsDialogOpen(data.open)}>
        <DialogSurface className="max-w-xl w-full">
          <DialogBody>
            <DialogTitle>
              {formMode === 'create' ? 'Tạo phiếu công việc mới' : 
               formMode === 'edit' ? 'Sửa phiếu công việc' : 'Chi tiết phiếu công việc'}
            </DialogTitle>
            <DialogContent className="py-4">
              <form onSubmit={handleSave} className="flex flex-col gap-4">
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

                <div className="flex flex-col gap-1">
                  <Label htmlFor="ten_cong_viec_form" className="font-semibold text-gray-700">Tên công việc *</Label>
                  <Input
                    id="ten_cong_viec_form"
                    required
                    disabled={formMode === 'view'}
                    value={selectedRecord.ten_cong_viec || ''}
                    onChange={(e) => setSelectedRecord({ ...selectedRecord, ten_cong_viec: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <Label htmlFor="tree_form" className="font-semibold text-gray-700">Cây xanh liên quan</Label>
                    <Select
                      id="tree_form"
                      disabled={formMode === 'view'}
                      value={selectedRecord.tree || ''}
                      onChange={(e) => setSelectedRecord({ ...selectedRecord, tree: e.target.value })}
                    >
                      <option value="">-- Chọn cây xanh --</option>
                      {trees.map(t => (
                        <option key={t.name} value={t.name}>{t.tree_code} ({t.species})</option>
                      ))}
                    </Select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <Label htmlFor="su_co_form" className="font-semibold text-gray-700">Sự cố liên quan</Label>
                    <Select
                      id="su_co_form"
                      disabled={formMode === 'view'}
                      value={selectedRecord.su_co || ''}
                      onChange={(e) => setSelectedRecord({ ...selectedRecord, su_co: e.target.value })}
                    >
                      <option value="">-- Chọn sự cố --</option>
                      {incidents.map(i => (
                        <option key={i.name} value={i.name}>{i.name} - {i.incident_title}</option>
                      ))}
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <Label htmlFor="ke_hoach_form" className="font-semibold text-gray-700">Kế hoạch chăm sóc</Label>
                    <Select
                      id="ke_hoach_form"
                      disabled={formMode === 'view'}
                      value={selectedRecord.ke_hoach || ''}
                      onChange={(e) => setSelectedRecord({ ...selectedRecord, ke_hoach: e.target.value })}
                    >
                      <option value="">-- Chọn kế hoạch --</option>
                      {carePlans.map(cp => (
                        <option key={cp.name} value={cp.name}>{cp.ten_ke_hoach}</option>
                      ))}
                    </Select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <Label htmlFor="loai_cv_form" className="font-semibold text-gray-700">Loại hành động</Label>
                    <Select
                      id="loai_cv_form"
                      disabled={formMode === 'view'}
                      value={selectedRecord.loai_cv || ''}
                      onChange={(e) => setSelectedRecord({ ...selectedRecord, loai_cv: e.target.value })}
                    >
                      <option value="">-- Chọn loại hành động --</option>
                      {actionTypes.map(at => (
                        <option key={at.name} value={at.name}>{at.ten_hanh_dong}</option>
                      ))}
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <Label htmlFor="don_vi_thi_cong_form" className="font-semibold text-gray-700">Đơn vị thi công</Label>
                    <Input
                      id="don_vi_thi_cong_form"
                      disabled={formMode === 'view'}
                      value={selectedRecord.don_vi_thi_cong || ''}
                      onChange={(e) => setSelectedRecord({ ...selectedRecord, don_vi_thi_cong: e.target.value })}
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <Label htmlFor="nguoi_thuc_hien_form" className="font-semibold text-gray-700">Người thực hiện</Label>
                    <Select
                      id="nguoi_thuc_hien_form"
                      disabled={formMode === 'view'}
                      value={selectedRecord.nguoi_thuc_hien || 'Administrator'}
                      onChange={(e) => setSelectedRecord({ ...selectedRecord, nguoi_thuc_hien: e.target.value })}
                    >
                      {assignees.map(a => (
                        <option key={a} value={a}>{a}</option>
                      ))}
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="flex flex-col gap-1">
                    <Label htmlFor="ngay_bat_dau_form" className="font-semibold text-gray-700">Ngày bắt đầu</Label>
                    <Input
                      id="ngay_bat_dau_form"
                      type="date"
                      disabled={formMode === 'view'}
                      value={selectedRecord.ngay_bat_dau || ''}
                      onChange={(e) => setSelectedRecord({ ...selectedRecord, ngay_bat_dau: e.target.value })}
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <Label htmlFor="ngay_hoan_thanh_form" className="font-semibold text-gray-700">Ngày hoàn thành</Label>
                    <Input
                      id="ngay_hoan_thanh_form"
                      type="date"
                      disabled={formMode === 'view'}
                      value={selectedRecord.ngay_hoan_thanh || ''}
                      onChange={(e) => setSelectedRecord({ ...selectedRecord, ngay_hoan_thanh: e.target.value })}
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <Label htmlFor="han_chot_form" className="font-semibold text-gray-700">Hạn chót</Label>
                    <Input
                      id="han_chot_form"
                      type="date"
                      disabled={formMode === 'view'}
                      value={selectedRecord.han_chot || ''}
                      onChange={(e) => setSelectedRecord({ ...selectedRecord, han_chot: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <Label htmlFor="muc_do_uu_tien_form" className="font-semibold text-gray-700">Mức độ ưu tiên</Label>
                    <Select
                      id="muc_do_uu_tien_form"
                      disabled={formMode === 'view'}
                      value={selectedRecord.muc_do_uu_tien || 'Medium'}
                      onChange={(e) => setSelectedRecord({ ...selectedRecord, muc_do_uu_tien: e.target.value })}
                    >
                      <option value="Low">Thấp</option>
                      <option value="Medium">Trung bình</option>
                      <option value="High">Cao</option>
                    </Select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <Label htmlFor="trang_thai_form" className="font-semibold text-gray-700">Trạng thái</Label>
                    <Select
                      id="trang_thai_form"
                      disabled={formMode === 'view'}
                      value={selectedRecord.trang_thai || 'Chưa xử lý'}
                      onChange={(e) => setSelectedRecord({ ...selectedRecord, trang_thai: e.target.value })}
                    >
                      <option value="Chưa xử lý">Chưa xử lý</option>
                      <option value="Đang thực hiện">Đang thực hiện</option>
                      <option value="Chờ nghiệm thu">Chờ nghiệm thu</option>
                      <option value="Đã nghiệm thu đạt">Đã nghiệm thu đạt</option>
                      <option value="Đã nghiệm thu lỗi">Đã nghiệm thu lỗi</option>
                    </Select>
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <Label htmlFor="ket_qua_nghiem_thu_form" className="font-semibold text-gray-700">Kết quả nghiệm thu / Ghi chú</Label>
                  <Textarea
                    id="ket_qua_nghiem_thu_form"
                    disabled={formMode === 'view'}
                    value={selectedRecord.ket_qua_nghiem_thu || ''}
                    onChange={(e) => setSelectedRecord({ ...selectedRecord, ket_qua_nghiem_thu: e.target.value })}
                    rows={2}
                  />
                </div>

                <DialogActions className="mt-4 pt-4 border-t border-slate-100 flex justify-end gap-2">
                  <DialogTrigger disableButtonEnhancement>
                    <Button appearance="secondary">Đóng</Button>
                  </DialogTrigger>
                  {formMode !== 'view' && (
                    <Button 
                      type="submit" 
                      appearance="primary"
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      Lưu phiếu
                    </Button>
                  )}
                </DialogActions>
              </form>
            </DialogContent>
          </DialogBody>
        </DialogSurface>
      </Dialog>
    </div>
  );
};
