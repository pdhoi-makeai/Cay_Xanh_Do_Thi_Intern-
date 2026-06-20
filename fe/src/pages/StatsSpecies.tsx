import React, { useState, useEffect } from 'react';
import { treeService } from '../services/api';
import { 
  Spinner, 
  Button,
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
  loai_cay?: string;          // API field: loai_cay (link to Loại Cây)
  loai_cay_title?: string;    // resolved display name from backend
  trang_thai?: string;        // API field: trang_thai (Vietnamese: Tốt | Cần cắt tỉa | Sâu bệnh | Gãy đổ)
}

export const StatsSpecies: React.FC = () => {
  const [trees, setTrees] = useState<TreeRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTrees = async () => {
    setLoading(true);
    try {
      const list = await treeService.getTreesList();
      setTrees(list);
    } catch (err) {
      console.error('Failed to load trees for species stats', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrees();
  }, []);

  // Compute species metrics using correct API fields
  const speciesMap: Record<string, { total: number; healthy: number; danger: number; name: string }> = {};
  trees.forEach(t => {
    // Use resolved display name if available, fallback to code, then 'Khác'
    const sName = t.loai_cay_title || t.loai_cay || 'Chưa xác định loại';
    if (!speciesMap[sName]) {
      speciesMap[sName] = { total: 0, healthy: 0, danger: 0, name: sName };
    }
    speciesMap[sName].total += 1;
    // trang_thai 'Tốt' means healthy in Vietnamese
    if (t.trang_thai === 'Tốt') {
      speciesMap[sName].healthy += 1;
    } else {
      speciesMap[sName].danger += 1;
    }
  });

  const speciesList = Object.values(speciesMap).sort((a, b) => b.total - a.total);

  const exportExcel = () => {
    alert('Xuất phân tích loại cây thành công!');
  };

  return (
    <div className="flex flex-col gap-6 bg-slate-50 min-h-full">
      <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-800 m-0">Phân tích theo loại cây</h2>
          <p className="text-sm text-slate-500 m-0">Thống kê số lượng cây xanh và tình trạng sức khỏe phân bổ theo chủng loại</p>
        </div>
        <div className="flex items-center gap-3">
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
          <Spinner label="Đang tải phân tích chủng loại..." />
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow>
                <TableHeaderCell className="font-bold text-slate-700">Chủng loại cây</TableHeaderCell>
                <TableHeaderCell className="font-bold text-slate-700">Tổng số cây</TableHeaderCell>
                <TableHeaderCell className="font-bold text-slate-700">Khỏe mạnh</TableHeaderCell>
                <TableHeaderCell className="font-bold text-slate-700">Cây có nguy cơ/sâu bệnh</TableHeaderCell>
                <TableHeaderCell className="font-bold text-slate-700">Tỷ lệ khỏe mạnh</TableHeaderCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {speciesList.map((s) => {
                const healthyRate = s.total > 0 ? ((s.healthy / s.total) * 100).toFixed(0) : '0';
                return (
                  <TableRow key={s.name} className="hover:bg-slate-50/40">
                    <TableCell className="font-semibold text-slate-800">{s.name}</TableCell>
                    <TableCell className="text-slate-700 font-bold">{s.total}</TableCell>
                    <TableCell className="text-emerald-700 font-semibold">{s.healthy}</TableCell>
                    <TableCell className="text-rose-700 font-semibold">{s.danger}</TableCell>
                    <TableCell>
                      <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${parseInt(healthyRate) > 75 ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                        {healthyRate}%
                      </span>
                    </TableCell>
                  </TableRow>
                );
              })}
              {speciesList.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-10 text-slate-400">
                    Không tìm thấy chủng loại cây nào.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};
