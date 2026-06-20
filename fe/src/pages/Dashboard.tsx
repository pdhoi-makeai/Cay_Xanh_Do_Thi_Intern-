import React, { useState, useEffect } from 'react';
import { treeService } from '../services/api';
import type { TreeDashboardData } from '../services/api';
import { 
  Button, 
  Card,
  Input,
  Select,
  useId,
  Spinner
} from '@fluentui/react-components';
import { 
  ArrowClockwiseRegular, 
  MapRegular, 
  LeafOneRegular, 
  AlertRegular, 
  HourglassRegular, 
  CheckmarkCircleRegular, 
  WarningRegular,
  FolderOpenRegular
} from '@fluentui/react-icons';

export const Dashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<TreeDashboardData | null>(null);
  
  // Filters state
  const [fromDate, setFromDate] = useState('2026-05-18');
  const [toDate, setToDate] = useState('2026-06-17');
  const [area, setArea] = useState('');
  const [contractor, setContractor] = useState('');

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const result = await treeService.getDashboardData({
        from_date: fromDate,
        to_date: toDate,
        area: area || undefined,
        contractor: contractor || undefined
      });
      setData(result);
    } catch (error) {
      console.error('Failed to load dashboard data', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleApplyFilters = () => {
    fetchDashboardData();
  };

  const areaSelectId = useId('area-select');
  const contractorSelectId = useId('contractor-select');

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center h-full w-full">
        <Spinner label="Đang tải dữ liệu bảng điều khiển..." />
      </div>
    );
  }

  // Fallbacks if data is empty
  const totalTrees = data?.total_trees ?? 0;
  const dangerTrees = data?.danger_trees ?? 0;
  const monitoringTrees = data?.monitoring_trees ?? 0;
  const newIncidents = data?.new_incidents ?? 0;
  const inProgressPlans = data?.in_progress_plans ?? 0;
  const overdueTasks = data?.overdue_tasks ?? 0;
  const pendingAcceptance = data?.pending_acceptance ?? 0;
  const completionRate = data?.completion_rate ?? 0;

  // Simple CSS Distribution Calculations
  const statusDist = data?.tree_status_distribution ?? {};
  const totalDistCount = Object.values(statusDist).reduce((a, b) => a + b, 0) || 1;

  const taskDist = data?.task_status_distribution ?? {};
  const totalTaskCount = Object.values(taskDist).reduce((a, b) => a + b, 0) || 1;

  return (
    <div className="flex flex-col gap-6 p-1 bg-slate-50 min-h-full">
      {/* Top action header */}
      <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-800 m-0">Bản điều khiển</h2>
          <p className="text-sm text-slate-500 m-0">Tổng quan vận hành hệ thống quản lý cây xanh đô thị thông minh</p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            appearance="outline" 
            icon={<ArrowClockwiseRegular />} 
            onClick={fetchDashboardData}
          >
            Làm mới
          </Button>
          <Button 
            appearance="primary" 
            icon={<MapRegular />}
          >
            Xem bản đồ
          </Button>
        </div>
      </div>

      {/* Advanced Filters */}
      <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm flex flex-col gap-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
          <span className="text-sm font-bold text-slate-700">Bộ lọc dashboard</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-600">Từ ngày</label>
            <Input 
              type="date" 
              value={fromDate} 
              onChange={(e) => setFromDate(e.target.value)} 
              className="w-full"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-600">Đến ngày</label>
            <Input 
              type="date" 
              value={toDate} 
              onChange={(e) => setToDate(e.target.value)} 
              className="w-full"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor={areaSelectId} className="text-xs font-semibold text-slate-600">Khu vực</label>
            <Select 
              id={areaSelectId} 
              value={area} 
              onChange={(e) => setArea(e.target.value)}
              className="w-full"
            >
              <option value="">Tất cả khu vực</option>
              <option value="Phường Hòa Khánh Bắc">Phường Hòa Khánh Bắc</option>
              <option value="Phường Hòa Khánh Nam">Phường Hòa Khánh Nam</option>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor={contractorSelectId} className="text-xs font-semibold text-slate-600">Đơn vị thi công</label>
            <Select 
              id={contractorSelectId} 
              value={contractor} 
              onChange={(e) => setContractor(e.target.value)}
              className="w-full"
            >
              <option value="">Tất cả đơn vị</option>
              <option value="Đội cây xanh Quận Liên Chiểu">Đội cây xanh Quận Liên Chiểu</option>
              <option value="Đội công trình đô thị">Đội công trình đô thị</option>
            </Select>
          </div>
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <Button appearance="secondary" onClick={() => {
            setFromDate('2026-05-18');
            setToDate('2026-06-17');
            setArea('');
            setContractor('');
          }}>Đặt lại</Button>
          <Button appearance="primary" onClick={handleApplyFilters}>Áp dụng</Button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Card 1 */}
        <Card className="p-4 border-l-4 border-l-emerald-500 shadow-sm flex flex-row items-center gap-4 justify-between bg-white">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase">Tổng số cây quản lý</span>
            <h3 className="text-2xl font-bold text-slate-800 mt-1 mb-0">{totalTrees}</h3>
          </div>
          <div className="bg-emerald-50 p-2.5 rounded-lg text-emerald-600">
            <LeafOneRegular className="text-2xl" />
          </div>
        </Card>

        {/* Card 2 */}
        <Card className="p-4 border-l-4 border-l-rose-500 shadow-sm flex flex-row items-center gap-4 justify-between bg-white">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase">Cây nguy hiểm</span>
            <h3 className="text-2xl font-bold text-slate-800 mt-1 mb-0">{dangerTrees}</h3>
          </div>
          <div className="bg-rose-50 p-2.5 rounded-lg text-rose-600">
            <WarningRegular className="text-2xl" />
          </div>
        </Card>

        {/* Card 3 */}
        <Card className="p-4 border-l-4 border-l-amber-500 shadow-sm flex flex-row items-center gap-4 justify-between bg-white">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase">Cây cần theo dõi</span>
            <h3 className="text-2xl font-bold text-slate-800 mt-1 mb-0">{monitoringTrees}</h3>
          </div>
          <div className="bg-amber-50 p-2.5 rounded-lg text-amber-600">
            <HourglassRegular className="text-2xl" />
          </div>
        </Card>

        {/* Card 4 */}
        <Card className="p-4 border-l-4 border-l-orange-500 shadow-sm flex flex-row items-center gap-4 justify-between bg-white">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase">Sự cố mới</span>
            <h3 className="text-2xl font-bold text-slate-800 mt-1 mb-0">{newIncidents}</h3>
          </div>
          <div className="bg-orange-50 p-2.5 rounded-lg text-orange-600">
            <AlertRegular className="text-2xl" />
          </div>
        </Card>

        {/* Card 5 */}
        <Card className="p-4 border-l-4 border-l-indigo-500 shadow-sm flex flex-row items-center gap-4 justify-between bg-white">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase">Kế hoạch đang TH</span>
            <h3 className="text-2xl font-bold text-slate-800 mt-1 mb-0">{inProgressPlans}</h3>
          </div>
          <div className="bg-indigo-50 p-2.5 rounded-lg text-indigo-600">
            <FolderOpenRegular className="text-2xl" />
          </div>
        </Card>

        {/* Card 6 */}
        <Card className="p-4 border-l-4 border-l-red-600 shadow-sm flex flex-row items-center gap-4 justify-between bg-white">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase">Phiếu quá hạn</span>
            <h3 className="text-2xl font-bold text-slate-800 mt-1 mb-0">{overdueTasks}</h3>
          </div>
          <div className="bg-red-50 p-2.5 rounded-lg text-red-600">
            <WarningRegular className="text-2xl" />
          </div>
        </Card>

        {/* Card 7 */}
        <Card className="p-4 border-l-4 border-l-blue-500 shadow-sm flex flex-row items-center gap-4 justify-between bg-white">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase">Chờ nghiệm thu</span>
            <h3 className="text-2xl font-bold text-slate-800 mt-1 mb-0">{pendingAcceptance}</h3>
          </div>
          <div className="bg-blue-50 p-2.5 rounded-lg text-blue-600">
            <CheckmarkCircleRegular className="text-2xl" />
          </div>
        </Card>

        {/* Card 8 */}
        <Card className="p-4 border-l-4 border-l-teal-500 shadow-sm flex flex-row items-center gap-4 justify-between bg-white">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase">Tỷ lệ HT kế hoạch</span>
            <h3 className="text-2xl font-bold text-slate-800 mt-1 mb-0">{completionRate}%</h3>
          </div>
          <div className="bg-teal-50 p-2.5 rounded-lg text-teal-600">
            <CheckmarkCircleRegular className="text-2xl" />
          </div>
        </Card>
      </div>

      {/* Analytics & Distribution Sections */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Tree Status distribution card */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm flex flex-col gap-4">
          <h4 className="text-sm font-bold text-slate-700 border-b border-slate-100 pb-2 m-0">Phân bổ trạng thái cây</h4>
          <div className="flex flex-col gap-3.5 pt-2">
            {Object.entries(statusDist).map(([status, count]) => {
              const pct = Math.round((count / totalDistCount) * 100);
              let barColor = 'bg-emerald-500';
              let displayStatus = status;
              if (status === 'Healthy') {
                displayStatus = 'Tốt';
                barColor = 'bg-emerald-500';
              } else if (status === 'Needs Pruning') {
                displayStatus = 'Cần cắt tỉa';
                barColor = 'bg-amber-500';
              } else if (status === 'Diseased') {
                displayStatus = 'Sâu bệnh';
                barColor = 'bg-orange-500';
              } else if (status === 'Fallen') {
                displayStatus = 'Gãy đổ';
                barColor = 'bg-red-500';
              }

              return (
                <div key={status} className="flex flex-col gap-1">
                  <div className="flex justify-between text-xs font-medium text-slate-600">
                    <span>{displayStatus}</span>
                    <span>{count} ({pct}%)</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div className={`${barColor} h-2 rounded-full`} style={{ width: `${pct}%` }}></div>
                  </div>
                </div>
              );
            })}
            {Object.keys(statusDist).length === 0 && (
              <p className="text-xs text-slate-400 text-center py-4 m-0">Không có dữ liệu cây xanh</p>
            )}
          </div>
        </div>

        {/* Task Status distribution card */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm flex flex-col gap-4">
          <h4 className="text-sm font-bold text-slate-700 border-b border-slate-100 pb-2 m-0">Công việc theo trạng thái</h4>
          <div className="flex flex-col gap-3.5 pt-2">
            {Object.entries(taskDist).map(([status, count]) => {
              const pct = Math.round((count / totalTaskCount) * 100);
              let barColor = 'bg-blue-500';
              if (status === 'Đã nghiệm thu đạt') barColor = 'bg-emerald-500';
              if (status === 'Đang thực hiện') barColor = 'bg-indigo-500';
              if (status === 'Chờ nghiệm thu') barColor = 'bg-purple-500';
              if (status === 'Đã nghiệm thu lỗi') barColor = 'bg-red-500';

              return (
                <div key={status} className="flex flex-col gap-1">
                  <div className="flex justify-between text-xs font-medium text-slate-600">
                    <span>{status}</span>
                    <span>{count} ({pct}%)</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div className={`${barColor} h-2 rounded-full`} style={{ width: `${pct}%` }}></div>
                  </div>
                </div>
              );
            })}
            {Object.keys(taskDist).length === 0 && (
              <p className="text-xs text-slate-400 text-center py-4 m-0">Không có dữ liệu công việc</p>
            )}
          </div>
        </div>

        {/* Incident trends card */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm flex flex-col gap-4">
          <h4 className="text-sm font-bold text-slate-700 border-b border-slate-100 pb-2 m-0">Xu hướng sự cố gần đây</h4>
          <div className="flex flex-col gap-3 pt-2">
            {data?.incident_trends && data.incident_trends.length > 0 ? (
              <div className="flex flex-col gap-2">
                {data.incident_trends.slice(0, 5).map((trend) => (
                  <div key={trend.date} className="flex justify-between items-center text-xs font-medium py-1.5 border-b border-slate-50 last:border-0">
                    <span className="text-slate-600">{trend.date}</span>
                    <span className="bg-orange-100 text-orange-800 font-bold px-2 py-0.5 rounded-full">{trend.count} sự cố</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 text-center py-4 m-0">Chưa ghi nhận sự cố mới nào</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
