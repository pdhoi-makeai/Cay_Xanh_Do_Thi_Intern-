import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { incidentService } from '../services/api';
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
  MessageBarBody
} from '@fluentui/react-components';
import { 
  AddRegular, 
  EditRegular, 
  DeleteRegular, 
  SearchRegular,
  FilterRegular
} from '@fluentui/react-icons';

interface TreeIncident {
  name: string;
  tieu_de: string;
  tai_nguyen?: string;
  khu_vuc?: string;
  vi_tri_gps?: string;
  mo_ta_chi_tiet?: string;
  hinh_anh_minh_hoa?: string;
  muc_do_uu_tien: 'Khẩn cấp' | 'Cao' | 'Bình thường' | 'Thấp';
  nguoi_bao_cao?: string;
  sdt_lien_he?: string;
  trang_thai: 'Mới' | 'Đang xử lý' | 'Đã giải quyết' | 'Đã cưa hạ-di dời';
  loai_van_de: string;
  loai_su_co: string;
  creation: string;
}

export const IncidentList: React.FC = () => {
  const [incidents, setIncidents] = useState<TreeIncident[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // Edit dialog state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState<Partial<TreeIncident>>({});
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  const navigate = useNavigate();

  const fetchIncidents = async () => {
    setLoading(true);
    try {
      const list = await incidentService.getIncidentsList({
        loai_su_co: filterType || undefined,
        muc_do_uu_tien: filterPriority || undefined,
        trang_thai: filterStatus || undefined,
        search: searchQuery || undefined
      });
      setIncidents(list);
    } catch (err) {
      console.error('Failed to fetch incidents', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncidents();
  }, [searchQuery, filterType, filterPriority, filterStatus]);

  const handleOpenEdit = (incident: TreeIncident) => {
    setSelectedIncident(incident);
    setFormError('');
    setFormSuccess('');
    setIsDialogOpen(true);
  };

  const handleSaveIncident = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');
    try {
      await incidentService.updateIncident(selectedIncident.name!, selectedIncident);
      setFormSuccess('Cập nhật sự cố thành công!');
      setTimeout(() => {
        setIsDialogOpen(false);
        fetchIncidents();
      }, 1000);
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Không thể cập nhật sự cố.');
    }
  };

  const handleDeleteIncident = async (name: string) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa báo cáo sự cố ${name}?`)) {
      try {
        await incidentService.deleteIncident(name);
        fetchIncidents();
      } catch (err) {
        alert('Không thể xóa sự cố này.');
      }
    }
  };

  const formatDateTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      const seconds = date.getSeconds().toString().padStart(2, '0');
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear();
      return `${hours}:${minutes}:${seconds} ${day}/${month}/${year}`;
    } catch {
      return isoString;
    }
  };

  const getPriorityBadgeClass = (priority: string) => {
    switch (priority) {
      case 'Khẩn cấp':
        return 'bg-rose-50 text-rose-700 border border-rose-200';
      case 'Cao':
        return 'bg-orange-50 text-orange-700 border border-orange-200';
      case 'Bình thường':
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
          <h2 className="text-xl font-bold text-slate-800 m-0">Quản lý sự cố cây xanh</h2>
          <p className="text-sm text-slate-500 m-0">Theo dõi, kiểm tra và xử lý các sự cố cây xanh đô thị</p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            appearance="outline" 
            icon={<FilterRegular />}
            onClick={fetchIncidents}
          />
          <Button 
            appearance="primary" 
            icon={<AddRegular />}
            onClick={() => navigate('/report')}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            Báo sự cố
          </Button>
        </div>
      </div>

      {/* Advanced Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
        <Input
          contentBefore={<SearchRegular />}
          placeholder="Tìm kiếm mã/cây/người báo..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full"
        />

        <Select 
          value={filterType} 
          onChange={(e) => setFilterType(e.target.value)}
          className="w-full"
        >
          <option value="">Loại sự cố (Tất cả)</option>
          <option value="Cản trở giao thông">Cản trở giao thông</option>
          <option value="Sâu bệnh nặng">Sâu bệnh nặng</option>
          <option value="Cây nghiêng">Cây nghiêng</option>
          <option value="Fallen Branch">Fallen Branch</option>
          <option value="Disease">Disease</option>
          <option value="Root Damage">Root Damage</option>
        </Select>

        <Select 
          value={filterPriority} 
          onChange={(e) => setFilterPriority(e.target.value)}
          className="w-full"
        >
          <option value="">Mức độ (Tất cả)</option>
          <option value="Khẩn cấp">Khẩn cấp</option>
          <option value="Cao">Cao</option>
          <option value="Bình thường">Bình thường</option>
          <option value="Thấp">Thấp</option>
        </Select>

        <Select 
          value={filterStatus} 
          onChange={(e) => setFilterStatus(e.target.value)}
          className="w-full"
        >
          <option value="">Trạng thái (Tất cả)</option>
          <option value="Mới">Mới</option>
          <option value="Đang xử lý">Đang xử lý</option>
          <option value="Đã giải quyết">Đã giải quyết</option>
          <option value="Đã cưa hạ-di dời">Đã cưa hạ-di dời</option>
        </Select>
      </div>

      {/* Incident List Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center p-12">
            <Spinner label="Đang tải danh sách sự cố..." />
          </div>
        ) : (
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow>
                <TableHeaderCell className="font-bold text-slate-700">Mã SC</TableHeaderCell>
                <TableHeaderCell className="font-bold text-slate-700">Thời gian</TableHeaderCell>
                <TableHeaderCell className="font-bold text-slate-700">Loại SC</TableHeaderCell>
                <TableHeaderCell className="font-bold text-slate-700">Mức độ</TableHeaderCell>
                <TableHeaderCell className="font-bold text-slate-700 w-28">Trạng thái</TableHeaderCell>
                <TableHeaderCell className="font-bold text-slate-700">Người báo</TableHeaderCell>
                <TableHeaderCell className="font-bold text-slate-700 w-24">Thao tác</TableHeaderCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {incidents.map((inc) => (
                <TableRow key={inc.name} className="hover:bg-slate-50/40">
                  <TableCell className="font-mono text-xs font-semibold text-slate-700">{inc.name}</TableCell>
                  <TableCell className="text-slate-500 text-xs">{formatDateTime(inc.creation)}</TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-semibold text-slate-800">{inc.loai_su_co || inc.loai_van_de || 'Chưa rõ'}</span>
                      <span className="text-xs text-slate-400 truncate max-w-xs">{inc.tieu_de}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className={`text-xs px-2 py-0.5 rounded font-semibold ${getPriorityBadgeClass(inc.muc_do_uu_tien)}`}>
                      {inc.muc_do_uu_tien || 'Bình thường'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className={`text-xs font-medium ${inc.trang_thai ? 'text-slate-800' : 'text-slate-400'}`}>
                      {inc.trang_thai || '—'}
                    </span>
                  </TableCell>
                  <TableCell className="text-slate-600 text-sm">{inc.nguoi_bao_cao || '—'}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button 
                        size="small" 
                        appearance="subtle" 
                        icon={<EditRegular className="text-blue-600" />}
                        onClick={() => handleOpenEdit(inc)}
                      />
                      <Button 
                        size="small" 
                        appearance="subtle" 
                        icon={<DeleteRegular className="text-rose-600" />}
                        onClick={() => handleDeleteIncident(inc.name)}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {incidents.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-10 text-slate-400">
                    Không tìm thấy sự cố nào.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={(_, data) => setIsDialogOpen(data.open)}>
        <DialogSurface className="max-w-md w-full">
          <DialogBody>
            <DialogTitle>Cập nhật thông tin sự cố</DialogTitle>
            <DialogContent className="py-4">
              <form onSubmit={handleSaveIncident} className="flex flex-col gap-4">
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
                  <Label className="font-semibold text-gray-700">Mã sự cố</Label>
                  <Input value={selectedIncident.name || ''} disabled />
                </div>

                <div className="flex flex-col gap-1">
                  <Label className="font-semibold text-gray-700">Tiêu đề</Label>
                  <Input value={selectedIncident.tieu_de || ''} disabled />
                </div>

                <div className="flex flex-col gap-1">
                  <Label htmlFor="loai_su_co_form" className="font-semibold text-gray-700">Loại sự cố</Label>
                  <Select
                    id="loai_su_co_form"
                    value={selectedIncident.loai_su_co || ''}
                    onChange={(e) => setSelectedIncident({ ...selectedIncident, loai_su_co: e.target.value })}
                  >
                    <option value="Cản trở giao thông">Cản trở giao thông</option>
                    <option value="Sâu bệnh nặng">Sâu bệnh nặng</option>
                    <option value="Cây nghiêng">Cây nghiêng</option>
                    <option value="Fallen Branch">Fallen Branch</option>
                    <option value="Disease">Disease</option>
                    <option value="Root Damage">Root Damage</option>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <Label htmlFor="trang_thai_form" className="font-semibold text-gray-700">Trạng thái</Label>
                    <Select
                      id="trang_thai_form"
                      value={selectedIncident.trang_thai || 'Mới'}
                      onChange={(e) => setSelectedIncident({ ...selectedIncident, trang_thai: e.target.value as any })}
                    >
                      <option value="Mới">Mới</option>
                      <option value="Đang xử lý">Đang xử lý</option>
                      <option value="Đã giải quyết">Đã giải quyết</option>
                      <option value="Đã cưa hạ-di dời">Đã cưa hạ-di dời</option>
                    </Select>
                  </div>

                  <div className="flex flex-col gap-1">
                    <Label htmlFor="muc_do_form" className="font-semibold text-gray-700">Mức độ ưu tiên</Label>
                    <Select
                      id="muc_do_form"
                      value={selectedIncident.muc_do_uu_tien || 'Bình thường'}
                      onChange={(e) => setSelectedIncident({ ...selectedIncident, muc_do_uu_tien: e.target.value as any })}
                    >
                      <option value="Khẩn cấp">Khẩn cấp</option>
                      <option value="Cao">Cao</option>
                      <option value="Bình thường">Bình thường</option>
                      <option value="Thấp">Thấp</option>
                    </Select>
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <Label htmlFor="mo_ta_form" className="font-semibold text-gray-700">Mô tả chi tiết</Label>
                  <Input
                    id="mo_ta_form"
                    value={selectedIncident.mo_ta_chi_tiet || ''}
                    onChange={(e) => setSelectedIncident({ ...selectedIncident, mo_ta_chi_tiet: e.target.value })}
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
                    Cập nhật
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
