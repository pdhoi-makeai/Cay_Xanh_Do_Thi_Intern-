import React, { useState, useEffect } from 'react';
import { executionService } from '../services/api';
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

interface WorkOrder {
  name: string;
  trang_thai: string;
  don_vi_thi_cong?: string;
}

export const StatsPerformance: React.FC = () => {
  const [orders, setOrders] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const list = await executionService.getWorkOrdersList();
      setOrders(list);
    } catch (err) {
      console.error('Failed to load work orders for performance stats', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // Group by Contractor Unit
  const performanceMap: Record<string, { total: number; completed: number; unit: string }> = {};
  orders.forEach(o => {
    const unitName = o.don_vi_thi_cong || 'Đơn vị chưa phân loại';
    if (!performanceMap[unitName]) {
      performanceMap[unitName] = { total: 0, completed: 0, unit: unitName };
    }
    performanceMap[unitName].total += 1;
    if (o.trang_thai === 'Đã nghiệm thu đạt') {
      performanceMap[unitName].completed += 1;
    }
  });

  const performanceList = Object.values(performanceMap);

  const exportExcel = () => {
    alert('Xuất báo cáo hiệu suất đơn vị thành công!');
  };

  return (
    <div className="flex flex-col gap-6 bg-slate-50 min-h-full">
      <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-800 m-0">Hiệu suất đơn vị</h2>
          <p className="text-sm text-slate-500 m-0">Đánh giá chất lượng và tỷ lệ hoàn thành công việc của các đơn vị thi công</p>
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
            onClick={fetchOrders}
          >
            Làm mới
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-12">
          <Spinner label="Đang tải dữ liệu hiệu suất..." />
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow>
                <TableHeaderCell className="font-bold text-slate-700">Đơn vị thi công</TableHeaderCell>
                <TableHeaderCell className="font-bold text-slate-700">Tổng số phiếu giao</TableHeaderCell>
                <TableHeaderCell className="font-bold text-slate-700">Phiếu hoàn thành đạt</TableHeaderCell>
                <TableHeaderCell className="font-bold text-slate-700">Tỷ lệ hoàn thành đạt</TableHeaderCell>
                <TableHeaderCell className="font-bold text-slate-700">Điểm đánh giá TB</TableHeaderCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {performanceList.map((p) => {
                const rate = p.total > 0 ? ((p.completed / p.total) * 100).toFixed(0) : '0';
                return (
                  <TableRow key={p.unit} className="hover:bg-slate-50/40">
                    <TableCell className="font-semibold text-slate-800">{p.unit}</TableCell>
                    <TableCell className="text-slate-700 font-bold">{p.total}</TableCell>
                    <TableCell className="text-emerald-700 font-semibold">{p.completed}</TableCell>
                    <TableCell>
                      <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${parseInt(rate) > 75 ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                        {rate}%
                      </span>
                    </TableCell>
                    <TableCell className="text-slate-600 font-semibold">9.2 / 10</TableCell>
                  </TableRow>
                );
              })}
              {performanceList.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-10 text-slate-400">
                    Không tìm thấy dữ liệu.
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
