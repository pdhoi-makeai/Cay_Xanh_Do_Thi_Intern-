import React, { useState, useEffect } from 'react';
import { inspectionService, treeService } from '../services/api';
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

interface InspectionTicket {
  name: string;
  ma_phieu: string;
  ngay_kt: string;
  gio_kt: string;
  loai_kt: string;
  nguoi_kt: string;
  an_toan?: string;
  trang_thai: string;
  de_xuat?: string;
  tai_nguyen: string;
  trang_thai_ngieng?: string;
  trang_thai_sau_benh?: string;
  tinh_trang_bo_phan?: string;
  ghi_chu?: string;
}

export const InspectionTickets: React.FC = () => {
  const [tickets, setTickets] = useState<InspectionTicket[]>([]);
  const [loading, setLoading] = useState(true);

  // Lookup lists for dropdowns
  const [types, setTypes] = useState<any[]>([]);
  const [safetyLevels, setSafetyLevels] = useState<any[]>([]);
  const [leaningStatuses, setLeaningStatuses] = useState<any[]>([]);
  const [diseaseStatuses, setDiseaseStatuses] = useState<any[]>([]);
  const [partStatuses, setPartStatuses] = useState<any[]>([]);
  const [trees, setTrees] = useState<any[]>([]);

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterSafety, setFilterSafety] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // Dialog state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [selectedRecord, setSelectedRecord] = useState<Partial<InspectionTicket>>({});
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  const fetchMetadata = async () => {
    try {
      const [typeList, safetyList, leaningList, diseaseList, partList, treeList] = await Promise.all([
        inspectionService.getInspectionTypesList(),
        inspectionService.getSafetyLevelsList(),
        inspectionService.getLeaningStatusesList(),
        inspectionService.getDiseaseStatusesList(),
        inspectionService.getPartStatusesList(),
        treeService.getTreesList()
      ]);
      setTypes(typeList.filter(t => t.trang_thai !== 'Tạm dừng'));
      setSafetyLevels(safetyList.filter(s => s.trang_thai !== 'Tạm dừng'));
      setLeaningStatuses(leaningList.filter(l => l.trang_thai !== 'Tạm dừng'));
      setDiseaseStatuses(diseaseList.filter(d => d.trang_thai !== 'Tạm dừng'));
      setPartStatuses(partList.filter(p => p.trang_thai !== 'Tạm dừng'));
      setTrees(treeList);
    } catch (err) {
      console.error('Failed to load inspection metadata', err);
    }
  };

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const list = await inspectionService.getInspectionTicketsList({
        search: searchQuery || undefined,
        loai_kt: filterType || undefined,
        an_toan: filterSafety || undefined,
        trang_thai: filterStatus || undefined
      });
      setTickets(list);
    } catch (err) {
      console.error('Failed to load inspection tickets', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetadata();
  }, []);

  useEffect(() => {
    fetchTickets();
  }, [searchQuery, filterType, filterSafety, filterStatus]);

  const handleOpenDialog = (mode: 'create' | 'edit', rec?: InspectionTicket) => {
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
      const generatedCode = `INS${yyyy}${mm}${dd}${hh}${min}${ss}`;

      setSelectedRecord({
        ma_phieu: generatedCode,
        ngay_kt: `${yyyy}-${mm}-${dd}`,
        gio_kt: `${hh}:${min}:${ss}`,
        loai_kt: '',
        nguoi_kt: '',
        an_toan: '',
        trang_thai: 'Mới tiếp nhận',
        de_xuat: '',
        tai_nguyen: '',
        trang_thai_ngieng: '',
        trang_thai_sau_benh: '',
        tinh_trang_bo_phan: '',
        ghi_chu: ''
      });
    }
    setIsDialogOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    if (!selectedRecord.tai_nguyen) {
      setFormError('Vui lòng chọn tài nguyên / cây xanh.');
      return;
    }
    if (!selectedRecord.loai_kt) {
      setFormError('Vui lòng chọn loại kiểm tra.');
      return;
    }

    try {
      await inspectionService.createInspectionTicket(selectedRecord);
      setFormSuccess(formMode === 'create' ? 'Tạo phiếu kiểm tra thành công!' : 'Cập nhật phiếu kiểm tra thành công!');
      setTimeout(() => {
        setIsDialogOpen(false);
        fetchTickets();
      }, 1000);
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Không thể lưu phiếu kiểm tra.');
    }
  };

  const handleDelete = async (name: string) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa phiếu kiểm tra ${name}?`)) {
      try {
        await inspectionService.deleteInspectionTicket(name);
        fetchTickets();
      } catch (err) {
        alert('Không thể xóa phiếu kiểm tra này.');
      }
    }
  };

  const formatDateTime = (dateStr: string, timeStr?: string) => {
    if (!dateStr) return '—';
    try {
      const parts = dateStr.split('-');
      const formattedDate = `${parts[2]}/${parts[1]}/${parts[0]}`;
      return timeStr ? `${timeStr} ${formattedDate}` : formattedDate;
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="flex flex-col gap-6 bg-slate-50 min-h-full">
      {/* Header Panel */}
      <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-800 m-0">Kiểm tra cây xanh</h2>
          <p className="text-sm text-slate-500 m-0">Lập phiếu kiểm tra tình hình sinh trưởng, sâu bệnh và nghiêng đổ của cây xanh</p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            appearance="outline" 
            icon={<ArrowClockwiseRegular />} 
            onClick={fetchTickets}
          >
            Làm mới
          </Button>
          <Button 
            appearance="primary" 
            icon={<AddRegular />}
            onClick={() => handleOpenDialog('create')}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            Tạo phiếu kiểm tra
          </Button>
        </div>
      </div>

      {/* Advanced Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
        <Input
          contentBefore={<SearchRegular />}
          placeholder="Tìm kiếm mã/cây/người kiểm tra..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full"
        />

        <Select 
          value={filterType} 
          onChange={(e) => setFilterType(e.target.value)}
          className="w-full"
        >
          <option value="">Loại kiểm tra (Tất cả)</option>
          {types.map(t => (
            <option key={t.name} value={t.name}>{t.ten_loai}</option>
          ))}
        </Select>

        <Select 
          value={filterSafety} 
          onChange={(e) => setFilterSafety(e.target.value)}
          className="w-full"
        >
          <option value="">Mức an toàn (Tất cả)</option>
          {safetyLevels.map(s => (
            <option key={s.name} value={s.name}>{s.ten_muc_do}</option>
          ))}
        </Select>

        <Select 
          value={filterStatus} 
          onChange={(e) => setFilterStatus(e.target.value)}
          className="w-full"
        >
          <option value="">Trạng thái (Tất cả)</option>
          <option value="Mới tiếp nhận">Mới tiếp nhận</option>
          <option value="Đang xử lý">Đang xử lý</option>
          <option value="Đã xử lý">Đã xử lý</option>
        </Select>
      </div>

      {/* Tickets Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center p-12">
            <Spinner label="Đang tải danh sách phiếu..." />
          </div>
        ) : (
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow>
                <TableHeaderCell className="font-bold text-slate-700">Mã phiếu</TableHeaderCell>
                <TableHeaderCell className="font-bold text-slate-700">Ngày KT</TableHeaderCell>
                <TableHeaderCell className="font-bold text-slate-700">Loại KT</TableHeaderCell>
                <TableHeaderCell className="font-bold text-slate-700">Người KT</TableHeaderCell>
                <TableHeaderCell className="font-bold text-slate-700">Cây xanh</TableHeaderCell>
                <TableHeaderCell className="font-bold text-slate-700">An toàn</TableHeaderCell>
                <TableHeaderCell className="font-bold text-slate-700">Trạng thái</TableHeaderCell>
                <TableHeaderCell className="font-bold text-slate-700">Đề xuất</TableHeaderCell>
                <TableHeaderCell className="font-bold text-slate-700 w-24">Thao tác</TableHeaderCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tickets.map((t) => (
                <TableRow key={t.name} className="hover:bg-slate-50/40">
                  <TableCell className="font-mono text-xs font-semibold text-slate-700">{t.ma_phieu}</TableCell>
                  <TableCell className="text-slate-500 text-xs">{formatDateTime(t.ngay_kt, t.gio_kt)}</TableCell>
                  <TableCell className="text-slate-600">{t.loai_kt}</TableCell>
                  <TableCell className="text-slate-600 font-semibold">{t.nguoi_kt || '—'}</TableCell>
                  <TableCell className="font-medium text-slate-800">{t.tai_nguyen}</TableCell>
                  <TableCell>
                    {t.an_toan ? (
                      <span className={`text-xs px-2 py-0.5 rounded font-semibold ${t.an_toan === 'An toàn' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : t.an_toan === 'Cần theo dõi' ? 'bg-amber-50 text-amber-700 border border-amber-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
                        {t.an_toan}
                      </span>
                    ) : '—'}
                  </TableCell>
                  <TableCell>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${t.trang_thai === 'Đã xử lý' ? 'bg-teal-50 text-teal-700' : t.trang_thai === 'Đang xử lý' ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-600'}`}>
                      {t.trang_thai}
                    </span>
                  </TableCell>
                  <TableCell className="text-slate-500 text-sm">{t.de_xuat || '—'}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button 
                        size="small" 
                        appearance="subtle" 
                        icon={<EditRegular className="text-blue-600" />}
                        onClick={() => handleOpenDialog('edit', t)}
                      />
                      <Button 
                        size="small" 
                        appearance="subtle" 
                        icon={<DeleteRegular className="text-rose-600" />}
                        onClick={() => handleDelete(t.name)}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {tickets.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-10 text-slate-400">
                    Không tìm thấy phiếu kiểm tra nào.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Create / Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={(_, data) => setIsDialogOpen(data.open)}>
        <DialogSurface className="max-w-xl w-full">
          <DialogBody>
            <DialogTitle>{formMode === 'create' ? 'Tạo phiếu kiểm tra mới' : 'Sửa phiếu kiểm tra'}</DialogTitle>
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

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <Label htmlFor="ma_phieu_form" className="font-semibold text-gray-700">Mã phiếu *</Label>
                    <Input
                      id="ma_phieu_form"
                      required
                      disabled={formMode === 'edit'}
                      value={selectedRecord.ma_phieu || ''}
                      onChange={(e) => setSelectedRecord({ ...selectedRecord, ma_phieu: e.target.value })}
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <Label htmlFor="tai_nguyen_form" className="font-semibold text-gray-700">Chọn cây xanh *</Label>
                    <Select
                      id="tai_nguyen_form"
                      required
                      value={selectedRecord.tai_nguyen || ''}
                      onChange={(e) => setSelectedRecord({ ...selectedRecord, tai_nguyen: e.target.value })}
                    >
                      <option value="">-- Chọn cây xanh --</option>
                      {trees.map(tree => (
                        <option key={tree.name} value={tree.ma_tai_san}>
                          {tree.ma_tai_san} - {tree.ten_tai_san}
                        </option>
                      ))}
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="flex flex-col gap-1">
                    <Label htmlFor="ngay_form" className="font-semibold text-gray-700">Ngày kiểm tra</Label>
                    <Input
                      id="ngay_form"
                      type="date"
                      value={selectedRecord.ngay_kt || ''}
                      onChange={(e) => setSelectedRecord({ ...selectedRecord, ngay_kt: e.target.value })}
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <Label htmlFor="gio_form" className="font-semibold text-gray-700">Giờ kiểm tra</Label>
                    <Input
                      id="gio_form"
                      type="time"
                      step="1"
                      value={selectedRecord.gio_kt || ''}
                      onChange={(e) => setSelectedRecord({ ...selectedRecord, gio_kt: e.target.value })}
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <Label htmlFor="loai_kt_form" className="font-semibold text-gray-700">Loại kiểm tra *</Label>
                    <Select
                      id="loai_kt_form"
                      required
                      value={selectedRecord.loai_kt || ''}
                      onChange={(e) => setSelectedRecord({ ...selectedRecord, loai_kt: e.target.value })}
                    >
                      <option value="">-- Chọn loại KT --</option>
                      {types.map(t => (
                        <option key={t.name} value={t.name}>{t.ten_loai}</option>
                      ))}
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <Label htmlFor="nguoi_kt_form" className="font-semibold text-gray-700">Người kiểm tra</Label>
                    <Input
                      id="nguoi_kt_form"
                      placeholder="Nhập họ tên người kiểm tra..."
                      value={selectedRecord.nguoi_kt || ''}
                      onChange={(e) => setSelectedRecord({ ...selectedRecord, nguoi_kt: e.target.value })}
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <Label htmlFor="an_toan_form" className="font-semibold text-gray-700">Mức an toàn</Label>
                    <Select
                      id="an_toan_form"
                      value={selectedRecord.an_toan || ''}
                      onChange={(e) => setSelectedRecord({ ...selectedRecord, an_toan: e.target.value })}
                    >
                      <option value="">-- Chưa đánh giá --</option>
                      {safetyLevels.map(s => (
                        <option key={s.name} value={s.name}>{s.ten_muc_do}</option>
                      ))}
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="flex flex-col gap-1">
                    <Label htmlFor="ngieng_form" className="font-semibold text-gray-700">Trạng thái nghiêng</Label>
                    <Select
                      id="ngieng_form"
                      value={selectedRecord.trang_thai_ngieng || ''}
                      onChange={(e) => setSelectedRecord({ ...selectedRecord, trang_thai_ngieng: e.target.value })}
                    >
                      <option value="">-- Chưa chọn --</option>
                      {leaningStatuses.map(l => (
                        <option key={l.name} value={l.name}>{l.ten_trang_thai}</option>
                      ))}
                    </Select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <Label htmlFor="sau_benh_form" className="font-semibold text-gray-700">Trạng thái sâu bệnh</Label>
                    <Select
                      id="sau_benh_form"
                      value={selectedRecord.trang_thai_sau_benh || ''}
                      onChange={(e) => setSelectedRecord({ ...selectedRecord, trang_thai_sau_benh: e.target.value })}
                    >
                      <option value="">-- Chưa chọn --</option>
                      {diseaseStatuses.map(d => (
                        <option key={d.name} value={d.name}>{d.ten_trang_thai}</option>
                      ))}
                    </Select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <Label htmlFor="bo_phan_form" className="font-semibold text-gray-700">Bộ phận cây</Label>
                    <Select
                      id="bo_phan_form"
                      value={selectedRecord.tinh_trang_bo_phan || ''}
                      onChange={(e) => setSelectedRecord({ ...selectedRecord, tinh_trang_bo_phan: e.target.value })}
                    >
                      <option value="">-- Chưa chọn --</option>
                      {partStatuses.map(p => (
                        <option key={p.name} value={p.name}>{p.ten_tinh_trang}</option>
                      ))}
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <Label htmlFor="de_xuat_form" className="font-semibold text-gray-700">Đề xuất xử lý</Label>
                    <Input
                      id="de_xuat_form"
                      placeholder="Cắt tỉa cành, cưa hạ..."
                      value={selectedRecord.de_xuat || ''}
                      onChange={(e) => setSelectedRecord({ ...selectedRecord, de_xuat: e.target.value })}
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <Label htmlFor="trang_thai_form" className="font-semibold text-gray-700">Trạng thái phiếu</Label>
                    <Select
                      id="trang_thai_form"
                      value={selectedRecord.trang_thai || 'Mới tiếp nhận'}
                      onChange={(e) => setSelectedRecord({ ...selectedRecord, trang_thai: e.target.value })}
                    >
                      <option value="Mới tiếp nhận">Mới tiếp nhận</option>
                      <option value="Đang xử lý">Đang xử lý</option>
                      <option value="Đã xử lý">Đã xử lý</option>
                    </Select>
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <Label htmlFor="ghi_chu_form" className="font-semibold text-gray-700">Ghi chú chi tiết</Label>
                  <Textarea
                    id="ghi_chu_form"
                    placeholder="Nhập ghi chú thêm..."
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
                    Lưu phiếu
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
