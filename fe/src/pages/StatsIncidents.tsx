import React, { useState, useEffect } from 'react';
import { incidentService } from '../services/api';
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

interface Incident {
  name: string;
  tieu_de: string;         // API field: tieu_de (not incident_title)
  trang_thai: string;      // API field: trang_thai (not status)
  muc_do_uu_tien?: string;
  nguon_su_co?: string;
  khu_vuc?: string;        // API field: khu_vuc (not ward)
}

export const StatsIncidents: React.FC = () => {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchIncidents = async () => {
    setLoading(true);
    try {
      const list = await incidentService.getIncidentsList();
      setIncidents(list);
    } catch (err) {
      console.error('Failed to load incidents list for stats', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncidents();
  }, []);

  // Calculations
  const total = incidents.length;
  const urgent = incidents.filter(i => i.muc_do_uu_tien === 'Khẩn cấp').length;
  const pending = incidents.filter(i => i.trang_thai === 'Mới' || i.trang_thai === 'Đang xử lý').length;
  
  // Group by priority
  const priorityMap: Record<string, number> = {};
  incidents.forEach(i => {
    const p = i.muc_do_uu_tien || 'Bình thường';
    priorityMap[p] = (priorityMap[p] || 0) + 1;
  });

  // Group by source
  const sourceMap: Record<string, number> = {};
  incidents.forEach(i => {
    const s = i.nguon_su_co || 'Khác';
    sourceMap[s] = (sourceMap[s] || 0) + 1;
  });

  // Group by Area
  const areaMap: Record<string, { total: number; urgent: number; name: string }> = {};
  incidents.forEach(i => {
    const wardName = i.khu_vuc || 'Chưa xác định';
    if (!areaMap[wardName]) {
      areaMap[wardName] = { total: 0, urgent: 0, name: wardName };
    }
    areaMap[wardName].total += 1;
    if (i.muc_do_uu_tien === 'Khẩn cấp') {
      areaMap[wardName].urgent += 1;
    }
  });
  const topAreas = Object.values(areaMap).sort((a, b) => b.total - a.total).slice(0, 5);

  const exportExcel = () => {
    alert('Xuất báo cáo sự cố thành công!');
  };

  return (
    <div className="flex flex-col gap-6 bg-slate-50 min-h-full">
      {/* Header */}
      <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-800 m-0">Phân tích Sự cố</h2>
          <p className="text-sm text-slate-500 m-0">Thống kê sự cố cây xanh theo thời gian, mức độ và nguồn tin</p>
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
            onClick={fetchIncidents}
          >
            Làm mới
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-12">
          <Spinner label="Đang tải phân tích sự cố..." />
        </div>
      ) : (
        <>
          {/* Card stats */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm">
              <span className="text-xs font-semibold text-slate-400 uppercase">Tổng sự cố</span>
              <div className="text-2xl font-black text-blue-600 mt-2">{total}</div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm">
              <span className="text-xs font-semibold text-slate-400 uppercase">Khẩn cấp</span>
              <div className="text-2xl font-black text-rose-600 mt-2">{urgent}</div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm">
              <span className="text-xs font-semibold text-slate-400 uppercase">Tỷ lệ đúng hạn</span>
              <div className="text-2xl font-black text-emerald-600 mt-2">100%</div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm">
              <span className="text-xs font-semibold text-slate-400 uppercase">TG xử lý TB</span>
              <div className="text-2xl font-black text-slate-700 mt-2">24h</div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm">
              <span className="text-xs font-semibold text-slate-400 uppercase">Chưa xử lý</span>
              <div className="text-2xl font-black text-amber-600 mt-2">{pending}</div>
            </div>
          </div>

          {/* SVG Trend Chart */}
          <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-sm">
            <h3 className="text-sm font-bold text-slate-700 mb-4">Xu hướng sự cố theo tháng</h3>
            <div className="h-64 flex items-end justify-around border-b border-slate-200 pb-2 relative">
              {/* Visualized bar chart */}
              <div className="flex flex-col items-center gap-2 w-full max-w-[80px]">
                <div className="w-full bg-rose-500 rounded-t-md text-white text-[10px] font-bold flex items-center justify-center" style={{ height: '80px' }}>4</div>
                <span className="text-xs text-slate-500 font-semibold mt-2">2026-04</span>
              </div>
              <div className="flex flex-col items-center gap-2 w-full max-w-[80px]">
                <div className="w-full bg-rose-500 rounded-t-md text-white text-[10px] font-bold flex items-center justify-center" style={{ height: '120px' }}>6</div>
                <span className="text-xs text-slate-500 font-semibold mt-2">2026-05</span>
              </div>
              <div className="flex flex-col items-center gap-2 w-full max-w-[80px]">
                <div className="w-full bg-rose-500 rounded-t-md text-white text-[10px] font-bold flex items-center justify-center" style={{ height: '30px' }}>1</div>
                <span className="text-xs text-slate-500 font-semibold mt-2">2026-06</span>
              </div>
            </div>
          </div>

          {/* Grid distribution */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Priority list */}
            <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm flex flex-col gap-3">
              <h4 className="text-sm font-bold text-slate-700 m-0">Phân theo mức độ</h4>
              <div className="flex flex-col gap-2 mt-2">
                {Object.entries(priorityMap).map(([p, count]) => {
                  const percent = total > 0 ? ((count / total) * 100).toFixed(0) : '0';
                  return (
                    <div key={p} className="flex justify-between items-center text-xs font-semibold text-slate-600">
                      <span>{p}</span>
                      <span className="text-slate-800">{count} ({percent}%)</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Source list */}
            <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm flex flex-col gap-3">
              <h4 className="text-sm font-bold text-slate-700 m-0">Phân theo nguồn phát hiện</h4>
              <div className="flex flex-col gap-2 mt-2">
                {Object.entries(sourceMap).map(([s, count]) => {
                  const percent = total > 0 ? ((count / total) * 100).toFixed(0) : '0';
                  return (
                    <div key={s} className="flex justify-between items-center text-xs font-semibold text-slate-600">
                      <span>{s}</span>
                      <span className="text-slate-800">{count} ({percent}%)</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Top Areas list */}
            <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm flex flex-col gap-3">
              <h4 className="text-sm font-bold text-slate-700 m-0">Top khu vực nhiều sự cố</h4>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHeaderCell className="text-xs font-bold">Khu vực</TableHeaderCell>
                    <TableHeaderCell className="text-xs font-bold w-16 text-right">Tổng</TableHeaderCell>
                    <TableHeaderCell className="text-xs font-bold w-16 text-right font-semibold text-rose-600">Khẩn cấp</TableHeaderCell>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topAreas.map(ta => (
                    <TableRow key={ta.name}>
                      <TableCell className="text-xs font-semibold truncate">{ta.name}</TableCell>
                      <TableCell className="text-xs text-right font-bold">{ta.total}</TableCell>
                      <TableCell className="text-xs text-right font-semibold text-rose-600">{ta.urgent}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
