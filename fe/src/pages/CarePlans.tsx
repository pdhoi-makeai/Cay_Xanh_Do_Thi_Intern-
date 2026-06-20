import React, { useState, useEffect } from 'react';
import { carePlanService } from '../services/api';
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
  SearchRegular
} from '@fluentui/react-icons';

interface CarePlan {
  name: string;
  ma_kh: string;
  ten_ke_hoach: string;
  loai_ke_hoach: string;
  muc_uu_tien: string;
  ngay_bat_dau?: string;
  trang_thai: string;
  ghi_chu?: string;
}

export const CarePlans: React.FC = () => {
  const [plans, setPlans] = useState<CarePlan[]>([]);
  const [loading, setLoading] = useState(true);

  // Dropdown lists
  const [types, setTypes] = useState<any[]>([]);
  const [priorities, setPriorities] = useState<any[]>([]);

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // Dialog state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [selectedRecord, setSelectedRecord] = useState<Partial<CarePlan>>({});
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  const fetchMetadata = async () => {
    try {
      const [typeList, priorityList] = await Promise.all([
        carePlanService.getPlanTypesList(),
        carePlanService.getPlanPrioritiesList()
      ]);
      setTypes(typeList.filter(t => t.trang_thai !== 'Tạm dừng'));
      setPriorities(priorityList.filter(p => p.trang_thai !== 'Tạm dừng'));
    } catch (err) {
      console.error('Failed to load care plan metadata', err);
    }
  };

  const fetchPlans = async () => {
    setLoading(true);
    try {
      const list = await carePlanService.getCarePlansList({
        search: searchQuery || undefined,
        loai_ke_hoach: filterType || undefined,
        muc_uu_tien: filterPriority || undefined,
        trang_thai: filterStatus || undefined
      });
      setPlans(list);
    } catch (err) {
      console.error('Failed to load care plans', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetadata();
  }, []);

  useEffect(() => {
    fetchPlans();
  }, [searchQuery, filterType, filterPriority, filterStatus]);

  const handleOpenDialog = (mode: 'create' | 'edit', rec?: CarePlan) => {
    setFormMode(mode);
    setFormError('');
    setFormSuccess('');

    if (rec) {
      setSelectedRecord(rec);
    } else {
      const now = new Date();
      const yyyy = now.getFullYear();
      const mm = String(now.getMonth() + 1).padStart(2, '0');
      const dd = String(now.getDate()).padStart(2, '0');
      const hh = String(now.getHours()).padStart(2, '0');
      const min = String(now.getMinutes()).padStart(2, '0');
      const ss = String(now.getSeconds()).padStart(2, '0');
      const generatedCode = `PLN${yyyy}${mm}${dd}${hh}${min}${ss}`;

      setSelectedRecord({
        ma_kh: generatedCode,
        ten_ke_hoach: '',
        loai_ke_hoach: '',
        muc_uu_tien: '',
        ngay_bat_dau: '',
        trang_thai: 'Mới',
        ghi_chu: ''
      });
    }
    setIsDialogOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    if (!selectedRecord.ten_ke_hoach) {
      setFormError('Vui lòng nhập tên kế hoạch.');
      return;
    }

    try {
      await carePlanService.createCarePlan(selectedRecord);
      setFormSuccess(formMode === 'create' ? 'Tạo kế hoạch thành công!' : 'Cập nhật kế hoạch thành công!');
      setTimeout(() => {
        setIsDialogOpen(false);
        fetchPlans();
      }, 1000);
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Không thể lưu kế hoạch chăm sóc.');
    }
  };

  const handleDelete = async (name: string) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa kế hoạch ${name}?`)) {
      try {
        await carePlanService.deleteCarePlan(name);
        fetchPlans();
      } catch (err) {
        alert('Không thể xóa kế hoạch chăm sóc này.');
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
      case 'Cao':
        return 'bg-rose-50 text-rose-700 border border-rose-200';
      case 'Trung bình':
        return 'bg-blue-50 text-blue-700 border border-blue-200';
      case 'Thấp':
        return 'bg-slate-100 text-slate-600';
      default:
        return 'bg-slate-100 text-slate-600';
    }
  };

  return (
    <div className="flex flex-col gap-6 bg-slate-50 min-h-full">
      {/* Header Panel */}
      <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-800 m-0">Kế hoạch chăm sóc cây xanh</h2>
          <p className="text-sm text-slate-500 m-0">Quản lý và lập kế hoạch chăm sóc, cắt tỉa và bảo dưỡng định kỳ cây xanh đô thị</p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            appearance="outline" 
            icon={<ArrowClockwiseRegular />} 
            onClick={fetchPlans}
          >
            Làm mới
          </Button>
          <Button 
            appearance="primary" 
            icon={<AddRegular />}
            onClick={() => handleOpenDialog('create')}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            Tạo kế hoạch
          </Button>
        </div>
      </div>

      {/* Advanced Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
        <Input
          contentBefore={<SearchRegular />}
          placeholder="Tìm kiếm theo mã, tên kế hoạch..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full"
        />

        <Select 
          value={filterType} 
          onChange={(e) => setFilterType(e.target.value)}
          className="w-full"
        >
          <option value="">Loại kế hoạch (Tất cả)</option>
          {types.map(t => (
            <option key={t.name} value={t.name}>{t.ten_loai}</option>
          ))}
        </Select>

        <Select 
          value={filterPriority} 
          onChange={(e) => setFilterPriority(e.target.value)}
          className="w-full"
        >
          <option value="">Mức ưu tiên (Tất cả)</option>
          {priorities.map(p => (
            <option key={p.name} value={p.name}>{p.ten_muc_do}</option>
          ))}
        </Select>

        <Select 
          value={filterStatus} 
          onChange={(e) => setFilterStatus(e.target.value)}
          className="w-full"
        >
          <option value="">Trạng thái (Tất cả)</option>
          <option value="Mới">Mới</option>
          <option value="Đang thực hiện">Đang thực hiện</option>
          <option value="Đã hoàn thành">Đã hoàn thành</option>
          <option value="Tạm dừng">Tạm dừng</option>
        </Select>
      </div>

      {/* Plans Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center p-12">
            <Spinner label="Đang tải danh sách kế hoạch..." />
          </div>
        ) : (
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow>
                <TableHeaderCell className="font-bold text-slate-700">Mã KH</TableHeaderCell>
                <TableHeaderCell className="font-bold text-slate-700">Tên kế hoạch</TableHeaderCell>
                <TableHeaderCell className="font-bold text-slate-700">Loại</TableHeaderCell>
                <TableHeaderCell className="font-bold text-slate-700">Trạng thái</TableHeaderCell>
                <TableHeaderCell className="font-bold text-slate-700">Ưu tiên</TableHeaderCell>
                <TableHeaderCell className="font-bold text-slate-700">Bắt đầu</TableHeaderCell>
                <TableHeaderCell className="font-bold text-slate-700 w-24">Thao tác</TableHeaderCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {plans.map((p) => (
                <TableRow key={p.name} className="hover:bg-slate-50/40">
                  <TableCell className="font-mono text-xs font-semibold text-slate-700">{p.ma_kh}</TableCell>
                  <TableCell className="text-slate-800 font-semibold">{p.ten_ke_hoach}</TableCell>
                  <TableCell className="text-slate-600">{p.loai_ke_hoach || '—'}</TableCell>
                  <TableCell>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${p.trang_thai === 'Đã hoàn thành' ? 'bg-teal-50 text-teal-700' : p.trang_thai === 'Đang thực hiện' ? 'bg-blue-50 text-blue-700' : p.trang_thai === 'Tạm dừng' ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>
                      {p.trang_thai}
                    </span>
                  </TableCell>
                  <TableCell>
                    {p.muc_uu_tien ? (
                      <span className={`text-xs px-2.5 py-0.5 rounded font-semibold ${getPriorityBadgeClass(p.muc_uu_tien)}`}>
                        {p.muc_uu_tien}
                      </span>
                    ) : '—'}
                  </TableCell>
                  <TableCell className="text-slate-500 text-xs">{formatDate(p.ngay_bat_dau)}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button 
                        size="small" 
                        appearance="subtle" 
                        icon={<EditRegular className="text-blue-600" />}
                        onClick={() => handleOpenDialog('edit', p)}
                      />
                      <Button 
                        size="small" 
                        appearance="subtle" 
                        icon={<DeleteRegular className="text-rose-600" />}
                        onClick={() => handleDelete(p.name)}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {plans.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-10 text-slate-400">
                    Không tìm thấy kế hoạch nào.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Create / Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={(_, data) => setIsDialogOpen(data.open)}>
        <DialogSurface className="max-w-md w-full">
          <DialogBody>
            <DialogTitle>{formMode === 'create' ? 'Tạo kế hoạch mới' : 'Sửa kế hoạch chăm sóc'}</DialogTitle>
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
                  <Label htmlFor="ma_kh_form" className="font-semibold text-gray-700">Mã kế hoạch *</Label>
                  <Input
                    id="ma_kh_form"
                    required
                    disabled={formMode === 'edit'}
                    value={selectedRecord.ma_kh || ''}
                    onChange={(e) => setSelectedRecord({ ...selectedRecord, ma_kh: e.target.value })}
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <Label htmlFor="ten_ke_hoach_form" className="font-semibold text-gray-700">Tên kế hoạch *</Label>
                  <Input
                    id="ten_ke_hoach_form"
                    required
                    placeholder="Nhập tên kế hoạch chăm sóc..."
                    value={selectedRecord.ten_ke_hoach || ''}
                    onChange={(e) => setSelectedRecord({ ...selectedRecord, ten_ke_hoach: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <Label htmlFor="loai_ke_hoach_form" className="font-semibold text-gray-700">Loại kế hoạch</Label>
                    <Select
                      id="loai_ke_hoach_form"
                      value={selectedRecord.loai_ke_hoach || ''}
                      onChange={(e) => setSelectedRecord({ ...selectedRecord, loai_ke_hoach: e.target.value })}
                    >
                      <option value="">-- Chọn loại --</option>
                      {types.map(t => (
                        <option key={t.name} value={t.name}>{t.ten_loai}</option>
                      ))}
                    </Select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <Label htmlFor="muc_uu_tien_form" className="font-semibold text-gray-700">Mức ưu tiên</Label>
                    <Select
                      id="muc_uu_tien_form"
                      value={selectedRecord.muc_uu_tien || ''}
                      onChange={(e) => setSelectedRecord({ ...selectedRecord, muc_uu_tien: e.target.value })}
                    >
                      <option value="">-- Chọn ưu tiên --</option>
                      {priorities.map(p => (
                        <option key={p.name} value={p.name}>{p.ten_muc_do}</option>
                      ))}
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <Label htmlFor="ngay_bat_dau_form" className="font-semibold text-gray-700">Ngày bắt đầu</Label>
                    <Input
                      id="ngay_bat_dau_form"
                      type="date"
                      value={selectedRecord.ngay_bat_dau || ''}
                      onChange={(e) => setSelectedRecord({ ...selectedRecord, ngay_bat_dau: e.target.value })}
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <Label htmlFor="trang_thai_form" className="font-semibold text-gray-700">Trạng thái</Label>
                    <Select
                      id="trang_thai_form"
                      value={selectedRecord.trang_thai || 'Mới'}
                      onChange={(e) => setSelectedRecord({ ...selectedRecord, trang_thai: e.target.value })}
                    >
                      <option value="Mới">Mới</option>
                      <option value="Đang thực hiện">Đang thực hiện</option>
                      <option value="Đã hoàn thành">Đã hoàn thành</option>
                      <option value="Tạm dừng">Tạm dừng</option>
                    </Select>
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <Label htmlFor="ghi_chu_form" className="font-semibold text-gray-700">Ghi chú chi tiết</Label>
                  <Textarea
                    id="ghi_chu_form"
                    placeholder="Nhập ghi chú chi tiết..."
                    value={selectedRecord.ghi_chu || ''}
                    onChange={(e) => setSelectedRecord({ ...selectedRecord, ghi_chu: e.target.value })}
                    rows={3}
                  />
                </div>

                <DialogActions className="mt-4 pt-4 border-t border-slate-100 flex justify-end gap-2">
                  <DialogTrigger disableButtonEnhancement>
                    <Button appearance="secondary">Đóng</Button>
                  </DialogTrigger>
                  <Button 
                    type="submit" 
                    appearance="primary"
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Lưu kế hoạch
                  </Button>
                </DialogActions>
              </form>
            </DialogContent>
          </DialogBody>
        </DialogSurface>
      </Dialog>
    </div>
  );
};
