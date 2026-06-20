import React, { useState, useEffect } from 'react';
import { acceptanceService, executionService } from '../services/api';
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

interface AcceptanceTicket {
  name: string;
  phieu_cv: string;
  ngay_nt: string;
  nguoi_nt: string;
  ket_qua: string;
  lam_lai: string;
  ghi_chu?: string;
}

export const AcceptanceTickets: React.FC = () => {
  const [tickets, setTickets] = useState<AcceptanceTicket[]>([]);
  const [workOrders, setWorkOrders] = useState<any[]>([]);
  const [outcomes, setOutcomes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [filterResult, setFilterResult] = useState('');

  // Dialog state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [selectedRecord, setSelectedRecord] = useState<Partial<AcceptanceTicket>>({});
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  const assignees = [
    'Administrator',
    'loi@greencity.local',
    'hau@greencity.local',
    'quanlydancu@huongtra.local'
  ];

  const fetchMetadata = async () => {
    try {
      const [woList, outcomeList] = await Promise.all([
        executionService.getWorkOrdersList(),
        acceptanceService.getResultsList()
      ]);
      setWorkOrders(woList);
      setOutcomes(outcomeList);
    } catch (err) {
      console.error('Failed to load acceptance metadata', err);
    }
  };

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const list = await acceptanceService.getAcceptanceTicketsList({
        search: searchQuery || undefined,
        ket_qua: filterResult || undefined
      });
      setTickets(list);
    } catch (err) {
      console.error('Failed to load acceptance tickets', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetadata();
  }, []);

  useEffect(() => {
    fetchTickets();
  }, [searchQuery, filterResult]);

  const handleOpenDialog = (mode: 'create' | 'edit', rec?: AcceptanceTicket) => {
    setFormMode(mode);
    setFormError('');
    setFormSuccess('');
    if (rec) {
      setSelectedRecord(rec);
    } else {
      setSelectedRecord({
        phieu_cv: '',
        ngay_nt: new Date().toISOString().split('T')[0],
        nguoi_nt: 'Administrator',
        ket_qua: 'Đạt',
        lam_lai: 'Không',
        ghi_chu: ''
      });
    }
    setIsDialogOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    if (!selectedRecord.phieu_cv) {
      setFormError('Vui lòng chọn phiếu công việc.');
      return;
    }

    try {
      await acceptanceService.createAcceptanceTicket(selectedRecord);
      setFormSuccess(formMode === 'create' ? 'Tạo biên bản nghiệm thu thành công!' : 'Cập nhật biên bản nghiệm thu thành công!');
      setTimeout(() => {
        setIsDialogOpen(false);
        fetchTickets();
      }, 1000);
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Không thể lưu biên bản nghiệm thu.');
    }
  };

  const handleDelete = async (name: string) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa biên bản ${name}?`)) {
      try {
        await acceptanceService.deleteAcceptanceTicket(name);
        fetchTickets();
      } catch (err) {
        alert('Không thể xóa biên bản nghiệm thu này.');
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

  const getResultBadgeClass = (res?: string) => {
    switch (res) {
      case 'Đạt':
        return 'bg-emerald-50 text-emerald-700 border border-emerald-100';
      case 'Đạt có điều kiện':
        return 'bg-blue-50 text-blue-700 border border-blue-100';
      case 'Không đạt':
        return 'bg-rose-50 text-rose-700 border border-rose-100';
      default:
        return 'bg-slate-100 text-slate-600';
    }
  };

  return (
    <div className="flex flex-col gap-6 bg-slate-50 min-h-full">
      {/* Header Panel */}
      <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-800 m-0">Biên bản nghiệm thu</h2>
          <p className="text-sm text-slate-500 m-0">Quản lý các biên bản nghiệm thu kết quả xử lý và bảo dưỡng cây xanh</p>
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
            Thêm biên bản
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
        <Input
          contentBefore={<SearchRegular />}
          placeholder="Tìm kiếm theo mã, phiếu CV, người nghiệm thu..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full"
        />

        <Select 
          value={filterResult} 
          onChange={(e) => setFilterResult(e.target.value)}
          className="w-full"
        >
          <option value="">Kết quả (Tất cả)</option>
          {outcomes.map(o => (
            <option key={o.name} value={o.name}>{o.ten_ket_qua}</option>
          ))}
        </Select>
      </div>

      {/* Tickets Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center p-12">
            <Spinner label="Đang tải danh sách biên bản..." />
          </div>
        ) : (
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow>
                <TableHeaderCell className="font-bold text-slate-700">Mã NT</TableHeaderCell>
                <TableHeaderCell className="font-bold text-slate-700">Phiếu CV</TableHeaderCell>
                <TableHeaderCell className="font-bold text-slate-700">Ngày NT</TableHeaderCell>
                <TableHeaderCell className="font-bold text-slate-700">Người NT</TableHeaderCell>
                <TableHeaderCell className="font-bold text-slate-700">Kết quả</TableHeaderCell>
                <TableHeaderCell className="font-bold text-slate-700">Làm lại</TableHeaderCell>
                <TableHeaderCell className="font-bold text-slate-700 w-24">Thao tác</TableHeaderCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tickets.map((rec) => (
                <TableRow key={rec.name} className="hover:bg-slate-50/40">
                  <TableCell className="font-mono text-xs font-semibold text-slate-700">{rec.name}</TableCell>
                  <TableCell className="font-semibold text-slate-800">{rec.phieu_cv}</TableCell>
                  <TableCell className="text-slate-500 text-xs">{formatDate(rec.ngay_nt)}</TableCell>
                  <TableCell className="text-slate-600 text-xs">{rec.nguoi_nt}</TableCell>
                  <TableCell>
                    <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${getResultBadgeClass(rec.ket_qua)}`}>
                      {rec.ket_qua}
                    </span>
                  </TableCell>
                  <TableCell>
                    {rec.lam_lai === 'Cần làm lại' ? (
                      <Button 
                        size="small" 
                        className="bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs px-2 py-0.5 rounded"
                        onClick={() => handleOpenDialog('edit', rec)}
                      >
                        Cần làm lại
                      </Button>
                    ) : (
                      <span className="text-slate-500 text-xs">{rec.lam_lai}</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button 
                        size="small" 
                        appearance="subtle" 
                        icon={<EditRegular className="text-blue-600" />}
                        onClick={() => handleOpenDialog('edit', rec)}
                      />
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
              {tickets.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-10 text-slate-400">
                    Không tìm thấy biên bản nghiệm thu nào.
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
            <DialogTitle>
              {formMode === 'create' ? 'Tạo biên bản nghiệm thu mới' : 'Sửa biên bản nghiệm thu'}
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
                  <Label htmlFor="phieu_cv_form" className="font-semibold text-gray-700">Phiếu công việc *</Label>
                  <Select
                    id="phieu_cv_form"
                    required
                    disabled={formMode === 'edit'}
                    value={selectedRecord.phieu_cv || ''}
                    onChange={(e) => setSelectedRecord({ ...selectedRecord, phieu_cv: e.target.value })}
                  >
                    <option value="">-- Chọn phiếu công việc --</option>
                    {workOrders.map(wo => (
                      <option key={wo.name} value={wo.name}>{wo.name} - {wo.ten_cong_viec}</option>
                    ))}
                  </Select>
                </div>

                <div className="flex flex-col gap-1">
                  <Label htmlFor="nguoi_nt_form" className="font-semibold text-gray-700">Người nghiệm thu *</Label>
                  <Select
                    id="nguoi_nt_form"
                    required
                    value={selectedRecord.nguoi_nt || 'Administrator'}
                    onChange={(e) => setSelectedRecord({ ...selectedRecord, nguoi_nt: e.target.value })}
                  >
                    {assignees.map(a => (
                      <option key={a} value={a}>{a}</option>
                    ))}
                  </Select>
                </div>

                <div className="flex flex-col gap-1">
                  <Label htmlFor="ngay_nt_form" className="font-semibold text-gray-700">Ngày nghiệm thu *</Label>
                  <Input
                    id="ngay_nt_form"
                    type="date"
                    required
                    value={selectedRecord.ngay_nt || ''}
                    onChange={(e) => setSelectedRecord({ ...selectedRecord, ngay_nt: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <Label htmlFor="ket_qua_form" className="font-semibold text-gray-700">Kết quả *</Label>
                    <Select
                      id="ket_qua_form"
                      required
                      value={selectedRecord.ket_qua || 'Đạt'}
                      onChange={(e) => {
                        const val = e.target.value;
                        setSelectedRecord({ 
                          ...selectedRecord, 
                          ket_qua: val,
                          lam_lai: val === 'Không đạt' ? 'Cần làm lại' : 'Không'
                        });
                      }}
                    >
                      {outcomes.map(o => (
                        <option key={o.name} value={o.name}>{o.ten_ket_qua}</option>
                      ))}
                    </Select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <Label htmlFor="lam_lai_form" className="font-semibold text-gray-700">Làm lại</Label>
                    <Select
                      id="lam_lai_form"
                      value={selectedRecord.lam_lai || 'Không'}
                      onChange={(e) => setSelectedRecord({ ...selectedRecord, lam_lai: e.target.value })}
                    >
                      <option value="Không">Không</option>
                      <option value="Cần làm lại">Cần làm lại</option>
                    </Select>
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <Label htmlFor="ghi_chu_form" className="font-semibold text-gray-700">Ghi chú chi tiết</Label>
                  <Textarea
                    id="ghi_chu_form"
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
