import React, { useState, useEffect } from 'react';
import { treeService } from '../services/api';
import { 
  Spinner, 
  Button,
  Select,
  Table, 
  TableHeader, 
  TableBody, 
  TableRow, 
  TableCell, 
  TableHeaderCell 
} from '@fluentui/react-components';
import { 
  ArrowClockwiseRegular,
  DocumentRegular
} from '@fluentui/react-icons';

interface TreeRecord {
  name: string;
  ma_tai_san: string;
  ten_tai_san: string;
  loai_cay?: string;
  khu_vuc?: string;     // API field: khu_vuc (not ward)
  trang_thai?: string;  // API field: trang_thai (Vietnamese: Tốt | Cần cắt tỉa | Sâu bệnh | Gãy đổ)
  toa_do_gps?: string;
  khu_vuc_title?: string;
}

export const StatsArea: React.FC = () => {
  const [trees, setTrees] = useState<TreeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [areaType, setAreaType] = useState('Đoạn đường');

  const fetchTrees = async () => {
    setLoading(true);
    try {
      const list = await treeService.getTreesList();
      setTrees(list);
    } catch (err) {
      console.error('Failed to fetch trees list for stats', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrees();
  }, []);

  // Compute stats
  const totalTrees = trees.length;
  
  // Group by khu_vuc (API field name)
  const wardsMap: Record<string, { total: number; healthy: number; danger: number; name: string }> = {};
  trees.forEach(t => {
    const wardName = t.khu_vuc_title || t.khu_vuc || 'Chưa xác định';
    if (!wardsMap[wardName]) {
      wardsMap[wardName] = { total: 0, healthy: 0, danger: 0, name: wardName };
    }
    wardsMap[wardName].total += 1;
    // trang_thai is in Vietnamese: 'Tốt' = Healthy, others = dangerous
    if (t.trang_thai === 'Tốt') {
      wardsMap[wardName].healthy += 1;
    } else {
      wardsMap[wardName].danger += 1; // Cần cắt tỉa, Sâu bệnh, Gãy đổ
    }
  });

  const wardsList = Object.values(wardsMap).sort((a, b) => b.danger - a.danger);
  const totalWards = wardsList.length;
  
  const totalDanger = trees.filter(t => t.trang_thai !== 'Tốt').length;
  const riskIndex = totalTrees > 0 ? ((totalDanger / totalTrees) * 100).toFixed(1) : '0';

  const exportExcel = () => {
    alert('Xuất báo cáo Excel thành công!');
  };

  return (
    <div className="flex flex-col gap-6 bg-slate-50 min-h-full">
      {/* Header Panel */}
      <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-800 m-0">Tình trạng Cây theo Khu vực</h2>
          <p className="text-sm text-slate-500 m-0">Phân bố và mức độ rủi ro cây xanh theo từng khu vực</p>
        </div>
        <div className="flex items-center gap-3">
          <Select 
            value={areaType} 
            onChange={(e) => setAreaType(e.target.value)}
          >
            <option value="Tất cả">Tất cả</option>
            <option value="Đoạn đường">Đoạn đường</option>
            <option value="Công viên">Công viên</option>
            <option value="Dải phân cách">Dải phân cách</option>
            <option value="Khu dân cư">Khu dân cư</option>
            <option value="Khu công cộng khác">Khu công cộng khác</option>
          </Select>
          <Button 
            appearance="outline" 
            icon={<DocumentRegular />} 
            onClick={exportExcel}
            className="text-emerald-700 hover:text-emerald-800"
          >
            Xuất Excel
          </Button>
          <Button 
            appearance="outline" 
            icon={<ArrowClockwiseRegular />} 
            onClick={fetchTrees}
          >
            Làm mới
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-12">
          <Spinner label="Đang tải dữ liệu thống kê..." />
        </div>
      ) : (
        <>
          {/* Metrics Panel */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Tổng khu vực</span>
              <span className="text-3xl font-extrabold text-blue-600 mt-2">{totalWards}</span>
            </div>
            <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Tổng cây</span>
              <span className="text-3xl font-extrabold text-slate-800 mt-2">{totalTrees}</span>
            </div>
            <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Chỉ số rủi ro</span>
              <span className="text-3xl font-extrabold text-rose-600 mt-2">{riskIndex}%</span>
            </div>
          </div>

          {/* Bar Chart Section */}
          <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-sm flex flex-col gap-4">
            <h3 className="text-sm font-bold text-slate-700 m-0">Top 10 khu vực có cây nguy hiểm</h3>
            
            <div className="flex flex-col gap-4 mt-2">
              {wardsList.slice(0, 10).map(w => {
                const dangerPercent = w.total > 0 ? (w.danger / w.total) * 100 : 0;
                const healthyPercent = w.total > 0 ? (w.healthy / w.total) * 100 : 0;
                return (
                  <div key={w.name} className="flex flex-col md:flex-row md:items-center gap-2">
                    <span className="text-xs font-semibold text-slate-600 w-48 truncate">{w.name}</span>
                    <div className="flex-1 h-6 bg-slate-100 rounded-lg overflow-hidden flex">
                      {w.danger > 0 && (
                        <div 
                          className="bg-rose-500 h-full flex items-center justify-center text-[10px] text-white font-bold" 
                          style={{ width: `${dangerPercent}%` }}
                        >
                          {w.danger} Nguy hiểm
                        </div>
                      )}
                      {w.healthy > 0 && (
                        <div 
                          className="bg-emerald-500 h-full flex items-center justify-center text-[10px] text-white font-bold" 
                          style={{ width: `${healthyPercent}%` }}
                        >
                          {w.healthy} Khỏe mạnh
                        </div>
                      )}
                    </div>
                    <span className="text-xs font-bold text-slate-500 w-16 text-right">Tổng: {w.total}</span>
                  </div>
                );
              })}
              {wardsList.length === 0 && (
                <div className="text-center py-6 text-slate-400 text-sm">Không có dữ liệu hiển thị.</div>
              )}
            </div>
          </div>

          {/* Table Section */}
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-700 m-0">Danh sách chi tiết khu vực ({totalWards})</h3>
            </div>
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow>
                  <TableHeaderCell className="font-bold text-slate-700">Tên khu vực</TableHeaderCell>
                  <TableHeaderCell className="font-bold text-slate-700">Tổng số cây</TableHeaderCell>
                  <TableHeaderCell className="font-bold text-slate-700">Cây khỏe mạnh</TableHeaderCell>
                  <TableHeaderCell className="font-bold text-slate-700">Cây có nguy cơ/sự cố</TableHeaderCell>
                  <TableHeaderCell className="font-bold text-slate-700">Tỷ lệ rủi ro</TableHeaderCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {wardsList.map((w) => {
                  const rRate = w.total > 0 ? ((w.danger / w.total) * 100).toFixed(1) : '0';
                  return (
                    <TableRow key={w.name} className="hover:bg-slate-50/40">
                      <TableCell className="font-semibold text-slate-800">{w.name}</TableCell>
                      <TableCell className="text-slate-700 font-bold">{w.total}</TableCell>
                      <TableCell className="text-emerald-700 font-semibold">{w.healthy}</TableCell>
                      <TableCell className="text-rose-700 font-semibold">{w.danger}</TableCell>
                      <TableCell>
                        <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${w.danger > 0 ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'}`}>
                          {rRate}%
                        </span>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </>
      )}
    </div>
  );
};
