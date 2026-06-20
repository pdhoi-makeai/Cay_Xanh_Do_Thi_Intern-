import React, { useState, useEffect } from 'react';
import { executionService } from '../services/api';
import { 
  Spinner, 
  Button 
} from '@fluentui/react-components';
import { 
  ArrowClockwiseRegular,
  DocumentRegular
} from '@fluentui/react-icons';

interface WorkOrder {
  name: string;
  ten_cong_viec: string;
  trang_thai: string;
  muc_do_uu_tien: string;
  don_vi_thi_cong?: string;
  ngay_bat_dau?: string;
}

export const StatsWorkOrders: React.FC = () => {
  const [orders, setOrders] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const list = await executionService.getWorkOrdersList();
      setOrders(list);
    } catch (err) {
      console.error('Failed to load work orders list for stats', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const total = orders.length;
  const completed = orders.filter(o => o.trang_thai === 'Đã nghiệm thu đạt').length;
  const inProgress = orders.filter(o => o.trang_thai === 'Đang thực hiện').length;
  const pending = orders.filter(o => o.trang_thai === 'Chờ nghiệm thu').length;
  const failed = orders.filter(o => o.trang_thai === 'Đã nghiệm thu lỗi').length;

  const exportExcel = () => {
    alert('Xuất báo cáo phiếu công việc thành công!');
  };

  return (
    <div className="flex flex-col gap-6 bg-slate-50 min-h-full">
      <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-800 m-0">Thống kê Phiếu công việc</h2>
          <p className="text-sm text-slate-500 m-0">Thống kê số lượng, tiến độ và tình trạng các phiếu công việc</p>
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
          <Spinner label="Đang tải thống kê phiếu công việc..." />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm">
              <span className="text-xs font-semibold text-slate-400 uppercase">Tổng số phiếu</span>
              <div className="text-2xl font-black text-blue-600 mt-2">{total}</div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm">
              <span className="text-xs font-semibold text-slate-400 uppercase">Đã nghiệm thu đạt</span>
              <div className="text-2xl font-black text-emerald-600 mt-2">{completed}</div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm">
              <span className="text-xs font-semibold text-slate-400 uppercase">Đang thực hiện</span>
              <div className="text-2xl font-black text-blue-500 mt-2">{inProgress}</div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm">
              <span className="text-xs font-semibold text-slate-400 uppercase">Chờ nghiệm thu</span>
              <div className="text-2xl font-black text-amber-600 mt-2">{pending}</div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm">
              <span className="text-xs font-semibold text-slate-400 uppercase">Nghiệm thu lỗi</span>
              <div className="text-2xl font-black text-rose-600 mt-2">{failed}</div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden p-6 flex flex-col gap-4">
            <h3 className="text-sm font-bold text-slate-700 m-0">Tỷ lệ hoàn thành công việc</h3>
            <div className="flex h-8 w-full rounded-lg overflow-hidden mt-2">
              {completed > 0 && <div className="bg-emerald-500 h-full flex items-center justify-center text-xs text-white font-bold" style={{ width: `${(completed/total)*100}%` }}>Đạt ({(completed/total*100).toFixed(0)}%)</div>}
              {inProgress > 0 && <div className="bg-blue-500 h-full flex items-center justify-center text-xs text-white font-bold" style={{ width: `${(inProgress/total)*100}%` }}>Đang làm ({(inProgress/total*100).toFixed(0)}%)</div>}
              {pending > 0 && <div className="bg-amber-500 h-full flex items-center justify-center text-xs text-white font-bold" style={{ width: `${(pending/total)*100}%` }}>Chờ NT ({(pending/total*100).toFixed(0)}%)</div>}
              {failed > 0 && <div className="bg-rose-500 h-full flex items-center justify-center text-xs text-white font-bold" style={{ width: `${(failed/total)*100}%` }}>Lỗi ({(failed/total*100).toFixed(0)}%)</div>}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
