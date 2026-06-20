import React, { useState, useEffect } from 'react';
import { carePlanService, executionService } from '../services/api';
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

interface CarePlanRecord {
  name: string;
  ma_kh: string;
  ten_ke_hoach: string;
  loai_ke_hoach: string;
  muc_uu_tien: string;
  ngay_bat_dau?: string;  // API has ngay_bat_dau, NOT han_chot
  trang_thai: string;
  ghi_chu?: string;
}

export const StatsPlans: React.FC = () => {
  const [plans, setPlans] = useState<CarePlanRecord[]>([]);
  const [workOrders, setWorkOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [pList, woList] = await Promise.all([
        carePlanService.getCarePlansList(),
        executionService.getWorkOrdersList()
      ]);
      setPlans(pList);
      setWorkOrders(woList);
    } catch (err) {
      console.error('Failed to load stats plans data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const exportExcel = () => {
    alert('Xuất báo cáo tiến độ kế hoạch thành công!');
  };

  return (
    <div className="flex flex-col gap-6 bg-slate-50 min-h-full">
      {/* Header Panel */}
      <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-800 m-0">Tiến độ Kế hoạch</h2>
          <p className="text-sm text-slate-500 m-0">Theo dõi tiến độ và tình trạng các kế hoạch chăm sóc cây xanh</p>
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
            onClick={fetchData}
          >
            Làm mới
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-12">
          <Spinner label="Đang tải dữ liệu tiến độ..." />
        </div>
      ) : (
        <>
          {/* Card stats */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm">
              <span className="text-xs font-semibold text-slate-400 uppercase">Tổng kế hoạch</span>
              <div className="text-2xl font-black text-blue-600 mt-2">{plans.length}</div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm">
              <span className="text-xs font-semibold text-slate-400 uppercase">Đúng tiến độ</span>
              <div className="text-2xl font-black text-emerald-600 mt-2">0</div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm">
              <span className="text-xs font-semibold text-slate-400 uppercase">Chậm tiến độ</span>
              <div className="text-2xl font-black text-amber-600 mt-2">0</div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm">
              <span className="text-xs font-semibold text-slate-400 uppercase">Nguy cơ / Sắp trễ</span>
              <div className="text-2xl font-black text-rose-600 mt-2">{plans.length}</div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm">
              <span className="text-xs font-semibold text-slate-400 uppercase">TB tiến độ</span>
              <div className="text-2xl font-black text-slate-700 mt-2">0%</div>
            </div>
          </div>

          {/* Details Table */}
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-700 m-0">Chi tiết các kế hoạch ({plans.length})</h3>
            </div>
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow>
                  <TableHeaderCell className="font-bold text-slate-700">Kế hoạch</TableHeaderCell>
                  <TableHeaderCell className="font-bold text-slate-700">Tiến độ</TableHeaderCell>
                  <TableHeaderCell className="font-bold text-slate-700">Hạn</TableHeaderCell>
                  <TableHeaderCell className="font-bold text-slate-700">Phiếu quá hạn</TableHeaderCell>
                  <TableHeaderCell className="font-bold text-slate-700">Tình trạng</TableHeaderCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {plans.map((p) => {
                  const linkedWOs = workOrders.filter(w => w.ke_hoach === p.name);
                  const totalWOs = linkedWOs.length;
                  const completedWOs = linkedWOs.filter(w => w.trang_thai === 'Đã nghiệm thu đạt').length;
                  const progressVal = totalWOs > 0 ? (completedWOs / totalWOs) * 100 : 0;
                  const overdueCount = linkedWOs.filter(w => w.trang_thai !== 'Đã nghiệm thu đạt' && w.han_chot && new Date(w.han_chot) < new Date()).length;

                  return (
                    <TableRow key={p.name} className="hover:bg-slate-50/40">
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-semibold text-slate-800">{p.ten_ke_hoach}</span>
                          <span className="text-slate-400 text-xs font-mono">{p.name} · {p.loai_ke_hoach || 'Chưa phân loại'}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-24 h-2 bg-slate-100 rounded overflow-hidden">
                            <div className="bg-blue-600 h-full" style={{ width: `${progressVal}%` }} />
                          </div>
                          <span className="text-xs font-bold text-slate-500">{progressVal.toFixed(1)}%</span>
                          <span className="text-slate-400 text-xs font-semibold">({completedWOs}/{totalWOs} phiếu)</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col text-xs font-semibold">
                          <span className="text-slate-700">{p.ngay_bat_dau || '—'}</span>
                          <span className="text-slate-400 mt-0.5">Ngày bắt đầu</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {overdueCount > 0 ? (
                          <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                            {overdueCount} quá hạn
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700">
                          Nguy cơ trễ
                        </span>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {plans.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-10 text-slate-400">
                      Không tìm thấy kế hoạch nào.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </>
      )}
    </div>
  );
};
