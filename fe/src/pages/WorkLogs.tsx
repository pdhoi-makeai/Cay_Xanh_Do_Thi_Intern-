import React, { useState, useEffect } from 'react';
import { executionService } from '../services/api';
import { useAuthStore } from '../store/useAuthStore';
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
  DeleteRegular, 
  ArrowClockwiseRegular,
  SearchRegular
} from '@fluentui/react-icons';

interface WorkLogRecord {
  name: string;
  ngay_ghi: string;
  work_order: string;
  ten_cong_viec?: string;
  nguoi_ghi: string;
  noi_dung: string;
  hinh_anh?: string;
  trang_thai_hoan_thanh: string;
}

export const WorkLogs: React.FC = () => {
  const { user } = useAuthStore();
  const [logs, setLogs] = useState<WorkLogRecord[]>([]);
  const [workOrders, setWorkOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Dialog state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<Partial<WorkLogRecord>>({});
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const list = await executionService.getWorkLogsList({ search: searchQuery || undefined });
      setLogs(list);
    } catch (err) {
      console.error('Failed to load work logs', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchWorkOrders = async () => {
    try {
      const list = await executionService.getWorkOrdersList();
      setWorkOrders(list);
    } catch (err) {
      console.error('Failed to load work orders', err);
    }
  };

  useEffect(() => {
    fetchLogs();
    fetchWorkOrders();
  }, [searchQuery]);

  const handleOpenDialog = () => {
    setFormError('');
    setFormSuccess('');
    setSelectedRecord({
      work_order: workOrders[0]?.name || '',
      nguoi_ghi: user?.first_name || user?.email || '',
      ngay_ghi: new Date().toISOString().split('T')[0],
      noi_dung: '',
      trang_thai_hoan_thanh: 'Đang thực hiện',
      hinh_anh: ''
    });
    setIsDialogOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');
    if (!selectedRecord.work_order) {
      setFormError('Vui lòng chọn phiếu công việc');
      return;
    }
    try {
      await executionService.createWorkLog(selectedRecord);
      setFormSuccess('Ghi nhật ký thi công thành công!');
      setTimeout(() => {
        setIsDialogOpen(false);
        fetchLogs();
      }, 1000);
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Không thể lưu nhật ký.');
    }
  };

  const handleDelete = async (name: string) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa nhật ký ${name}?`)) {
      try {
        await executionService.deleteWorkLog(name);
        fetchLogs();
      } catch (err) {
        alert('Không thể xóa nhật ký này.');
      }
    }
  };

  return (
    <div className="flex flex-col gap-6 bg-slate-50 min-h-full">
      {/* Header Panel */}
      <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-800 m-0">Nhật ký thi công</h2>
          <p className="text-sm text-slate-500 m-0">Ghi lại tiến trình thi công của các phiếu công việc hàng ngày</p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            appearance="outline" 
            icon={<ArrowClockwiseRegular />} 
            onClick={fetchLogs}
          >
            Làm mới
          </Button>
          <Button 
            appearance="primary" 
            icon={<AddRegular />}
            onClick={handleOpenDialog}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            Ghi nhật ký
          </Button>
        </div>
      </div>

      {/* Filter / Search */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm max-w-md w-full">
        <Input
          contentBefore={<SearchRegular />}
          placeholder="Tìm theo nội dung nhật ký..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center p-12">
            <Spinner label="Đang tải danh sách..." />
          </div>
        ) : (
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow>
                <TableHeaderCell className="font-bold text-slate-700">Mã phiếu</TableHeaderCell>
                <TableHeaderCell className="font-bold text-slate-700">Tên công việc</TableHeaderCell>
                <TableHeaderCell className="font-bold text-slate-700">Người ghi</TableHeaderCell>
                <TableHeaderCell className="font-bold text-slate-700">Nội dung</TableHeaderCell>
                <TableHeaderCell className="font-bold text-slate-700">Trạng thái hoàn thành</TableHeaderCell>
                <TableHeaderCell className="font-bold text-slate-700">Ngày ghi</TableHeaderCell>
                <TableHeaderCell className="font-bold text-slate-700 w-24">Thao tác</TableHeaderCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((rec) => (
                <TableRow key={rec.name} className="hover:bg-slate-50/40">
                  <TableCell className="font-semibold text-slate-800">{rec.work_order}</TableCell>
                  <TableCell className="text-slate-600 font-medium">{rec.ten_cong_viec || '—'}</TableCell>
                  <TableCell className="text-slate-500">{rec.nguoi_ghi}</TableCell>
                  <TableCell className="text-slate-500 max-w-xs truncate">{rec.noi_dung}</TableCell>
                  <TableCell>
                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                      {rec.trang_thai_hoan_thanh}
                    </span>
                  </TableCell>
                  <TableCell className="text-slate-500">{rec.ngay_ghi}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button 
                        size="small" 
                        appearance="subtle" 
                        icon={<DeleteRegular className="text-rose-600" />}
                        onClick={() => handleDelete(rec.name)}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {logs.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-10 text-slate-400">
                    Không tìm thấy dữ liệu nhật ký.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Create Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={(_, data) => setIsDialogOpen(data.open)}>
        <DialogSurface className="max-w-md w-full">
          <DialogBody>
            <DialogTitle>Ghi nhật ký thi công mới</DialogTitle>
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
                  <Label htmlFor="work_order_form" className="font-semibold text-gray-700">Phiếu công việc *</Label>
                  <Select
                    id="work_order_form"
                    required
                    value={selectedRecord.work_order || ''}
                    onChange={(e) => setSelectedRecord({ ...selectedRecord, work_order: e.target.value })}
                  >
                    <option value="">-- Chọn phiếu công việc --</option>
                    {workOrders.map(wo => (
                      <option key={wo.name} value={wo.name}>
                        {wo.name} - {wo.ten_cong_viec}
                      </option>
                    ))}
                  </Select>
                </div>

                <div className="flex flex-col gap-1">
                  <Label htmlFor="nguoi_ghi_form" className="font-semibold text-gray-700">Người ghi nhận *</Label>
                  <Input
                    id="nguoi_ghi_form"
                    required
                    value={selectedRecord.nguoi_ghi || ''}
                    onChange={(e) => setSelectedRecord({ ...selectedRecord, nguoi_ghi: e.target.value })}
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <Label htmlFor="ngay_ghi_form" className="font-semibold text-gray-700">Ngày ghi *</Label>
                  <Input
                    id="ngay_ghi_form"
                    type="date"
                    required
                    value={selectedRecord.ngay_ghi || ''}
                    onChange={(e) => setSelectedRecord({ ...selectedRecord, ngay_ghi: e.target.value })}
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <Label htmlFor="trang_thai_hoan_thanh_form" className="font-semibold text-gray-700">Trạng thái hoàn thành</Label>
                  <Select
                    id="trang_thai_hoan_thanh_form"
                    value={selectedRecord.trang_thai_hoan_thanh || 'Đang thực hiện'}
                    onChange={(e) => setSelectedRecord({ ...selectedRecord, trang_thai_hoan_thanh: e.target.value })}
                  >
                    <option value="Đang thực hiện">Đang thực hiện</option>
                    <option value="Hoàn thành một phần">Hoàn thành một phần</option>
                    <option value="Đã hoàn thành">Đã hoàn thành</option>
                    <option value="Gặp sự cố / Tạm dừng">Gặp sự cố / Tạm dừng</option>
                  </Select>
                </div>

                <div className="flex flex-col gap-1">
                  <Label htmlFor="noi_dung_form" className="font-semibold text-gray-700">Nội dung chi tiết *</Label>
                  <Textarea
                    id="noi_dung_form"
                    required
                    rows={3}
                    value={selectedRecord.noi_dung || ''}
                    onChange={(e) => setSelectedRecord({ ...selectedRecord, noi_dung: e.target.value })}
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <Label htmlFor="hinh_anh_form" className="font-semibold text-gray-700">Đường dẫn hình ảnh (nếu có)</Label>
                  <Input
                    id="hinh_anh_form"
                    value={selectedRecord.hinh_anh || ''}
                    onChange={(e) => setSelectedRecord({ ...selectedRecord, hinh_anh: e.target.value })}
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
                    Lưu lại
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
