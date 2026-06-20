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

interface TypeRecord {
  name: string;
  ten_loai: string;
  mo_ta?: string;
  trang_thai: string;
}

export const InspectionTypes: React.FC = () => {
  const [types, setTypes] = useState<TypeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Dialog state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [selectedRecord, setSelectedRecord] = useState<Partial<TypeRecord>>({});
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  const fetchTypes = async () => {
    setLoading(true);
    try {
      const list = await inspectionService.getInspectionTypesList(searchQuery || undefined);
      setTypes(list);
    } catch (err) {
      console.error('Failed to load inspection types', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTypes();
  }, [searchQuery]);

  const handleOpenDialog = (mode: 'create' | 'edit', rec?: TypeRecord) => {
    setFormMode(mode);
    setFormError('');
    setFormSuccess('');
    if (rec) {
      setSelectedRecord(rec);
    } else {
      setSelectedRecord({
        ten_loai: '',
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
      await inspectionService.createInspectionType(selectedRecord);
      setFormSuccess(formMode === 'create' ? 'Thêm mới loại kiểm tra thành công!' : 'Cập nhật loại kiểm tra thành công!');
      setTimeout(() => {
        setIsDialogOpen(false);
        fetchTypes();
      }, 1000);
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Không thể lưu loại kiểm tra.');
    }
  };

  const handleDelete = async (name: string) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa loại kiểm tra ${name}?`)) {
      try {
        await inspectionService.deleteInspectionType(name);
        fetchTypes();
      } catch (err) {
        alert('Không thể xóa loại kiểm tra này.');
      }
    }
  };

  return (
    <div className="flex flex-col gap-6 bg-slate-50 min-h-full">
      {/* Header Panel */}
      <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-800 m-0">Loại kiểm tra</h2>
          <p className="text-sm text-slate-500 m-0">Thiết lập các loại hình kiểm tra (định kỳ, đột xuất, sau bão...)</p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            appearance="outline" 
            icon={<ArrowClockwiseRegular />} 
            onClick={fetchTypes}
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
          placeholder="Tìm theo tên loại kiểm tra..."
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
                <TableHeaderCell className="font-bold text-slate-700">Tên loại kiểm tra</TableHeaderCell>
                <TableHeaderCell className="font-bold text-slate-700">Mô tả</TableHeaderCell>
                <TableHeaderCell className="font-bold text-slate-700">Trạng thái</TableHeaderCell>
                <TableHeaderCell className="font-bold text-slate-700 w-24">Thao tác</TableHeaderCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {types.map((rec) => (
                <TableRow key={rec.name} className="hover:bg-slate-50/40">
                  <TableCell className="font-semibold text-slate-800">{rec.ten_loai}</TableCell>
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
              {types.length === 0 && (
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
            <DialogTitle>{formMode === 'create' ? 'Thêm loại kiểm tra mới' : 'Sửa thông tin loại kiểm tra'}</DialogTitle>
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
                  <Label htmlFor="ten_loai_form" className="font-semibold text-gray-700">Tên loại kiểm tra *</Label>
                  <Input
                    id="ten_loai_form"
                    required
                    disabled={formMode === 'edit'}
                    value={selectedRecord.ten_loai || ''}
                    onChange={(e) => setSelectedRecord({ ...selectedRecord, ten_loai: e.target.value })}
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
