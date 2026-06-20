import React, { useState, useEffect } from 'react';
import { treeService } from '../services/api';
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
  Switch
} from '@fluentui/react-components';
import { 
  AddRegular, 
  EyeRegular, 
  EditRegular, 
  DeleteRegular, 
  ArrowClockwiseRegular
} from '@fluentui/react-icons';

interface TreeSpeciesRecord {
  name: string;
  ma_loai_cay: string;
  ten_loai_cay: string;
  nhom_cay: string;
  ten_khoa_hoc?: string;
  chieu_cao_tb?: number;
  duong_kinh_tan_tb?: number;
  dac_diem_sinh_truong?: string;
  dac_diem_re?: string;
  ghi_chu_rui_ro?: string;
  trang_thai_hoat_dong: number;
  model_3d?: string;
  scale_3d?: number;
}

export const TreeSpecies: React.FC = () => {
  const [species, setSpecies] = useState<TreeSpeciesRecord[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filter state
  const [filterGroup, setFilterGroup] = useState('');
  
  // Dialog state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit' | 'view'>('create');
  const [selectedSpecies, setSelectedSpecies] = useState<Partial<TreeSpeciesRecord>>({});
  
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  const fetchSpecies = async () => {
    setLoading(true);
    try {
      const list = await treeService.getTreeSpecies(filterGroup || undefined);
      setSpecies(list);
    } catch (error) {
      console.error('Failed to load tree species', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSpecies();
  }, [filterGroup]);

  const handleOpenDialog = (mode: 'create' | 'edit' | 'view', spec?: TreeSpeciesRecord) => {
    setFormMode(mode);
    setFormError('');
    setFormSuccess('');
    if (spec) {
      setSelectedSpecies(spec);
    } else {
      // Auto-generate species code like SP + yyyymmddhhmmss
      const now = new Date();
      const timestamp = now.getFullYear().toString() +
        (now.getMonth() + 1).toString().padStart(2, '0') +
        now.getDate().toString().padStart(2, '0') +
        now.getHours().toString().padStart(2, '0') +
        now.getMinutes().toString().padStart(2, '0') +
        now.getSeconds().toString().padStart(2, '0');
        
      setSelectedSpecies({
        ma_loai_cay: `SP${timestamp}`,
        ten_loai_cay: '',
        nhom_cay: 'Cây bóng mát',
        ten_khoa_hoc: '',
        chieu_cao_tb: 0,
        duong_kinh_tan_tb: 0,
        dac_diem_sinh_truong: '',
        dac_diem_re: '',
        ghi_chu_rui_ro: '',
        trang_thai_hoat_dong: 1,
        model_3d: '',
        scale_3d: 1.0
      });
    }
    setIsDialogOpen(true);
  };

  const handleSaveSpecies = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');
    try {
      await treeService.createTreeSpecies(selectedSpecies);
      setFormSuccess(formMode === 'create' ? 'Thêm mới loại cây thành công!' : 'Cập nhật loại cây thành công!');
      setTimeout(() => {
        setIsDialogOpen(false);
        fetchSpecies();
      }, 1000);
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Có lỗi xảy ra khi lưu loại cây.');
    }
  };

  const handleDeleteSpecies = async (ma_loai_cay: string) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa loại cây ${ma_loai_cay}?`)) {
      try {
        await treeService.deleteTreeSpecies(ma_loai_cay);
        fetchSpecies();
      } catch (err) {
        alert('Không thể xóa loại cây này do có cây xanh đang liên kết.');
      }
    }
  };

  return (
    <div className="flex flex-col gap-6 bg-slate-50 min-h-full">
      {/* Header Panel */}
      <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-800 m-0">Danh mục loại cây</h2>
          <p className="text-sm text-slate-500 m-0">Quản lý các chủng loại cây xanh trong đô thị</p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            appearance="outline" 
            icon={<ArrowClockwiseRegular />} 
            onClick={fetchSpecies}
          >
            Làm mới
          </Button>
          <Button 
            appearance="primary" 
            icon={<AddRegular />}
            onClick={() => handleOpenDialog('create')}
            className="bg-teal-600 hover:bg-teal-700 text-white"
          >
            Thêm loại cây
          </Button>
        </div>
      </div>

      {/* Group Filter bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row gap-4 items-center">
        <div className="flex items-center gap-3 w-full max-w-md">
          <Label htmlFor="group-select" className="font-semibold text-slate-700 shrink-0">Nhóm cây:</Label>
          <Select 
            id="group-select"
            value={filterGroup} 
            onChange={(e) => setFilterGroup(e.target.value)}
            className="w-full"
          >
            <option value="">Tất cả</option>
            <option value="Cây bảo tồn">Cây bảo tồn</option>
            <option value="Cây bóng mát">Cây bóng mát</option>
            <option value="Cây cảnh quan">Cây cảnh quan</option>
            <option value="Cây hoa">Cây hoa</option>
            <option value="Khác">Khác</option>
          </Select>
        </div>
      </div>

      {/* Species List Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center p-12">
            <Spinner label="Đang tải danh mục loại cây..." />
          </div>
        ) : (
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow>
                <TableHeaderCell className="font-bold text-slate-700">Mã loài</TableHeaderCell>
                <TableHeaderCell className="font-bold text-slate-700">Tên loại cây</TableHeaderCell>
                <TableHeaderCell className="font-bold text-slate-700">Nhóm cây</TableHeaderCell>
                <TableHeaderCell className="font-bold text-slate-700">Tên khoa học</TableHeaderCell>
                <TableHeaderCell className="font-bold text-slate-700 w-32">Hoạt động</TableHeaderCell>
                <TableHeaderCell className="font-bold text-slate-700 w-32">Hành động</TableHeaderCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {species.map((spec) => (
                <TableRow key={spec.ma_loai_cay} className="hover:bg-slate-50/40">
                  <TableCell className="font-mono text-xs">{spec.ma_loai_cay}</TableCell>
                  <TableCell className="font-semibold text-slate-800">{spec.ten_loai_cay}</TableCell>
                  <TableCell>
                    <span className="bg-emerald-50 text-emerald-700 text-xs px-2.5 py-0.5 rounded-full font-medium">
                      {spec.nhom_cay}
                    </span>
                  </TableCell>
                  <TableCell className="italic text-slate-600">{spec.ten_khoa_hoc || '—'}</TableCell>
                  <TableCell>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${spec.trang_thai_hoat_dong ? 'bg-teal-50 text-teal-700' : 'bg-slate-100 text-slate-400'}`}>
                      {spec.trang_thai_hoat_dong ? 'Đang hoạt động' : 'Tạm dừng'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1.5">
                      <Button 
                        size="small" 
                        appearance="subtle" 
                        icon={<EyeRegular className="text-teal-600" />}
                        onClick={() => handleOpenDialog('view', spec)}
                      />
                      <Button 
                        size="small" 
                        appearance="subtle" 
                        icon={<EditRegular className="text-blue-600" />}
                        onClick={() => handleOpenDialog('edit', spec)}
                      />
                      <Button 
                        size="small" 
                        appearance="subtle" 
                        icon={<DeleteRegular className="text-rose-600" />}
                        onClick={() => handleDeleteSpecies(spec.ma_loai_cay)}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {species.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10 text-slate-400">
                    Không có loại cây nào trong nhóm này.
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
              {formMode === 'create' && 'Thêm loại cây mới'}
              {formMode === 'edit' && `Sửa thông tin loại cây ${selectedSpecies.ma_loai_cay}`}
              {formMode === 'view' && `Chi tiết loại cây ${selectedSpecies.ma_loai_cay}`}
            </DialogTitle>
            <DialogContent className="py-4">
              <form onSubmit={handleSaveSpecies} className="flex flex-col gap-4">
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
                    <Label htmlFor="ma_loai_cay" className="font-semibold text-gray-700">Mã loài *</Label>
                    <Input
                      id="ma_loai_cay"
                      required
                      value={selectedSpecies.ma_loai_cay || ''}
                      onChange={(e) => setSelectedSpecies({ ...selectedSpecies, ma_loai_cay: e.target.value })}
                      disabled={formMode !== 'create'}
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <Label htmlFor="ten_loai_cay" className="font-semibold text-gray-700">Tên loại cây *</Label>
                    <Input
                      id="ten_loai_cay"
                      required
                      placeholder="e.g. Lim xẹt"
                      value={selectedSpecies.ten_loai_cay || ''}
                      onChange={(e) => setSelectedSpecies({ ...selectedSpecies, ten_loai_cay: e.target.value })}
                      disabled={formMode === 'view'}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <Label htmlFor="nhom_cay" className="font-semibold text-gray-700">Nhóm cây *</Label>
                    <Select
                      id="nhom_cay"
                      required
                      value={selectedSpecies.nhom_cay || 'Cây bóng mát'}
                      onChange={(e) => setSelectedSpecies({ ...selectedSpecies, nhom_cay: e.target.value })}
                      disabled={formMode === 'view'}
                    >
                      <option value="Cây bảo tồn">Cây bảo tồn</option>
                      <option value="Cây bóng mát">Cây bóng mát</option>
                      <option value="Cây cảnh quan">Cây cảnh quan</option>
                      <option value="Cây hoa">Cây hoa</option>
                      <option value="Khác">Khác</option>
                    </Select>
                  </div>

                  <div className="flex flex-col gap-1">
                    <Label htmlFor="ten_khoa_hoc" className="font-semibold text-gray-700">Tên khoa học</Label>
                    <Input
                      id="ten_khoa_hoc"
                      placeholder="e.g. Peltophorum pterocarpum"
                      value={selectedSpecies.ten_khoa_hoc || ''}
                      onChange={(e) => setSelectedSpecies({ ...selectedSpecies, ten_khoa_hoc: e.target.value })}
                      disabled={formMode === 'view'}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <Label htmlFor="chieu_cao_tb" className="font-semibold text-gray-700">Chiều cao TB (m)</Label>
                    <Input
                      id="chieu_cao_tb"
                      type="number"
                      value={selectedSpecies.chieu_cao_tb?.toString() || '0'}
                      onChange={(e) => setSelectedSpecies({ ...selectedSpecies, chieu_cao_tb: parseFloat(e.target.value) })}
                      disabled={formMode === 'view'}
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <Label htmlFor="duong_kinh_tan_tb" className="font-semibold text-gray-700">Đường kính tán TB (m)</Label>
                    <Input
                      id="duong_kinh_tan_tb"
                      type="number"
                      value={selectedSpecies.duong_kinh_tan_tb?.toString() || '0'}
                      onChange={(e) => setSelectedSpecies({ ...selectedSpecies, duong_kinh_tan_tb: parseFloat(e.target.value) })}
                      disabled={formMode === 'view'}
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <Label htmlFor="dac_diem_sinh_truong" className="font-semibold text-gray-700">Đặc điểm sinh trưởng</Label>
                  <Input
                    id="dac_diem_sinh_truong"
                    value={selectedSpecies.dac_diem_sinh_truong || ''}
                    onChange={(e) => setSelectedSpecies({ ...selectedSpecies, dac_diem_sinh_truong: e.target.value })}
                    disabled={formMode === 'view'}
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <Label htmlFor="dac_diem_re" className="font-semibold text-gray-700">Đặc điểm rễ</Label>
                  <Input
                    id="dac_diem_re"
                    value={selectedSpecies.dac_diem_re || ''}
                    onChange={(e) => setSelectedSpecies({ ...selectedSpecies, dac_diem_re: e.target.value })}
                    disabled={formMode === 'view'}
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <Label htmlFor="ghi_chu_rui_ro" className="font-semibold text-gray-700">Ghi chú rủi ro</Label>
                  <Input
                    id="ghi_chu_rui_ro"
                    value={selectedSpecies.ghi_chu_rui_ro || ''}
                    onChange={(e) => setSelectedSpecies({ ...selectedSpecies, ghi_chu_rui_ro: e.target.value })}
                    disabled={formMode === 'view'}
                  />
                </div>

                <div className="border-t border-slate-100 pt-3 mt-1">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 text-left">Cấu hình 3D</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1">
                      <Label htmlFor="model_3d" className="font-semibold text-gray-700 text-left">File 3D (.glb, .gltf)</Label>
                      <div className="flex gap-2">
                        <Input
                          id="model_3d"
                          placeholder="e.g. /tree_lim_xet.glb"
                          value={selectedSpecies.model_3d || ''}
                          onChange={(e) => setSelectedSpecies({ ...selectedSpecies, model_3d: e.target.value })}
                          disabled={formMode === 'view'}
                          className="flex-1"
                        />
                        {formMode !== 'view' && (
                          <div className="relative">
                            <input
                              type="file"
                              accept=".glb,.gltf"
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  try {
                                    setFormError('');
                                    setFormSuccess('Đang tải lên file 3D...');
                                    const res = await treeService.uploadFile(file);
                                    if (res && res.file_url) {
                                      setSelectedSpecies(prev => ({ ...prev, model_3d: res.file_url }));
                                      setFormSuccess('Tải lên file 3D thành công!');
                                    } else {
                                      setFormError('Lỗi: Không nhận được đường dẫn file.');
                                    }
                                  } catch (err: any) {
                                    console.error(err);
                                    setFormError(err.response?.data?.message || 'Lỗi khi tải file 3D.');
                                    setFormSuccess('');
                                  }
                                }
                              }}
                              className="absolute inset-0 opacity-0 w-full cursor-pointer z-10"
                            />
                            <Button size="small" appearance="outline">Tải lên</Button>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col gap-1">
                      <Label htmlFor="scale_3d" className="font-semibold text-gray-700 text-left">Tỷ lệ phóng đại 3D</Label>
                      <Input
                        id="scale_3d"
                        type="number"
                        step="0.1"
                        min="0.1"
                        max="10.0"
                        value={selectedSpecies.scale_3d?.toString() || '1.0'}
                        onChange={(e) => setSelectedSpecies({ ...selectedSpecies, scale_3d: parseFloat(e.target.value) || 1.0 })}
                        disabled={formMode === 'view'}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-2">
                  <Switch
                    id="trang_thai_hoat_dong"
                    label="Đang hoạt động"
                    checked={!!selectedSpecies.trang_thai_hoat_dong}
                    onChange={(_, data) => setSelectedSpecies({ ...selectedSpecies, trang_thai_hoat_dong: data.checked ? 1 : 0 })}
                    disabled={formMode === 'view'}
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
                      className="bg-teal-600 hover:bg-teal-700 text-white"
                    >
                      Lưu lại
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
