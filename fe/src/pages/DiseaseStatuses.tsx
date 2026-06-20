import React, { useState, useEffect } from 'react';
import { inspectionService } from '../services/api';
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
  Select
} from '@fluentui/react-components';
import { 
  AddRegular, 
  EditRegular, 
  DeleteRegular, 
  ArrowClockwiseRegular,
  SearchRegular
} from '@fluentui/react-icons';

interface DiseaseRecord {
  name: string;
  ten_trang_thai: string;
  mo_ta?: string;
  trang_thai: string;
}

export const DiseaseStatuses: React.FC = () => {
  const [statuses, setStatuses] = useState<DiseaseRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Dialog state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [selectedRecord, setSelectedRecord] = useState<Partial<DiseaseRecord>>({});
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  const fetchStatuses = async () => {
    setLoading(true);
    try {
      const list = await inspectionService.getDiseaseStatusesList(searchQuery || undefined);
      setStatuses(list);
    } catch (err) {
      console.error('Failed to load disease statuses', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatuses();
  }, [searchQuery]);

  const handleOpenDialog = (mode: 'create' | 'edit', rec?: DiseaseRecord) => {
    setFormMode(mode);
    setFormError('');
    setFormSuccess('');
    if (rec) {
      setSelectedRecord(rec);
    } else {
      setSelectedRecord({
        ten_trang_thai: '',
        mo_ta: '',
        trang_thai: 'Đang dùng'
      });
    }
    setIsDialogOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');
    try {
      await inspectionService.createDiseaseStatus(selectedRecord);
      setFormSuccess(formMode === 'create' ? 'Thêm mới trạng thái sâu bệnh thành công!' : 'Cập nhật trạng thái sâu bệnh thành công!');
      setTimeout(() => {
        setIsDialogOpen(false);
        fetchStatuses();
      }, 1000);
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Không thể lưu trạng thái sâu bệnh.');
    }
  };

  const handleDelete = async (name: string) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa trạng thái sâu bệnh ${name}?`)) {
      try {
        await inspectionService.deleteDiseaseStatus(name);
        fetchStatuses();
      } catch (err) {
        alert('Không thể xóa trạng thái sâu bệnh này.');
      }
    }
  };

  return (
    <div className="flex flex-col gap-6 bg-slate-50 min-h-full">
      {/* Header Panel */}
      <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-800 m-0">Trạng thái sâu bệnh</h2>
          <p className="text-sm text-slate-500 m-0">Thiết lập các mức độ sâu bệnh của cây (Không sâu bệnh, có dấu hiệu sâu bệnh, nghiêm trọng...)</p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            appearance="outline" 
            icon={<ArrowClockwiseRegular />} 
            onClick={fetchStatuses}
          >
            Làm mới
          </Button>
          <Button 
            appearance="primary" 
            icon={<AddRegular />}
            onClick={() => handleOpenDialog('create')}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            Thêm mới
          </Button>
        </div>
      </div>

      {/* Filter / Search */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm max-w-md w-full">
        <Input
          contentBefore={<SearchRegular />}
          placeholder="Tìm theo tên trạng thái sâu bệnh..."
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
                <TableHeaderCell className="font-bold text-slate-700">Tên trạng thái</TableHeaderCell>
                <TableHeaderCell className="font-bold text-slate-700">Mô tả</TableHeaderCell>
                <TableHeaderCell className="font-bold text-slate-700">Trạng thái</TableHeaderCell>
                <TableHeaderCell className="font-bold text-slate-700 w-24">Thao tác</TableHeaderCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {statuses.map((rec) => (
                <TableRow key={rec.name} className="hover:bg-slate-50/40">
                  <TableCell className="font-semibold text-slate-800">{rec.ten_trang_thai}</TableCell>
                  <TableCell className="text-slate-500">{rec.mo_ta || '—'}</TableCell>
                  <TableCell>
                    <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${rec.trang_thai === 'Đang dùng' ? 'bg-teal-50 text-teal-700' : 'bg-slate-100 text-slate-400'}`}>
                      {rec.trang_thai}
                    </span>
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
              {statuses.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-10 text-slate-400">
                    Không tìm thấy dữ liệu.
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
            <DialogTitle>{formMode === 'create' ? 'Thêm trạng thái sâu bệnh' : 'Sửa trạng thái sâu bệnh'}</DialogTitle>
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
                  <Label htmlFor="ten_trang_thai_form" className="font-semibold text-gray-700">Tên trạng thái *</Label>
                  <Input
                    id="ten_trang_thai_form"
                    required
                    disabled={formMode === 'edit'}
                    value={selectedRecord.ten_trang_thai || ''}
                    onChange={(e) => setSelectedRecord({ ...selectedRecord, ten_trang_thai: e.target.value })}
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <Label htmlFor="mo_ta_form" className="font-semibold text-gray-700">Mô tả</Label>
                  <Input
                    id="mo_ta_form"
                    value={selectedRecord.mo_ta || ''}
                    onChange={(e) => setSelectedRecord({ ...selectedRecord, mo_ta: e.target.value })}
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <Label htmlFor="trang_thai_form" className="font-semibold text-gray-700">Trạng thái</Label>
                  <Select
                    id="trang_thai_form"
                    value={selectedRecord.trang_thai || 'Đang dùng'}
                    onChange={(e) => setSelectedRecord({ ...selectedRecord, trang_thai: e.target.value })}
                  >
                    <option value="Đang dùng">Đang dùng</option>
                    <option value="Tạm dừng">Tạm dừng</option>
                  </Select>
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
