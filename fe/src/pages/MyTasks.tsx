import React, { useState, useEffect } from 'react';
import { treeService } from '../services/api';
import type { WorkOrderData } from '../services/api';
import { 
  Button, 
  Card,
  Select,
  useId,
  Spinner,
  Dialog,
  DialogSurface,
  DialogTitle,
  DialogContent,
  DialogBody,
  DialogActions,
  Textarea
} from '@fluentui/react-components';
import { 
  ArrowClockwiseRegular, 
  WrenchRegular,
  CheckmarkCircleRegular, 
  WarningRegular,
  CalendarRegular,
  LocationRegular,
  DocumentCheckmarkRegular,
  LeafOneRegular
} from '@fluentui/react-icons';

export const MyTasks: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState<WorkOrderData[]>([]);
  const [filterStatus, setFilterStatus] = useState('All');
  
  // Dialog state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<WorkOrderData | null>(null);
  const [resultStatus, setResultStatus] = useState('Chờ nghiệm thu');
  const [resultNotes, setResultNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const result = await treeService.getMyWorkOrders();
      setTasks(result);
    } catch (error) {
      console.error('Failed to fetch work orders', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleSubmitResult = async () => {
    if (!selectedTask) return;
    setSubmitting(true);
    try {
      await treeService.submitAcceptanceResult(selectedTask.name, resultStatus, resultNotes);
      setIsDialogOpen(false);
      setSelectedTask(null);
      setResultNotes('');
      fetchTasks();
    } catch (error) {
      console.error('Failed to submit results', error);
    } finally {
      setSubmitting(false);
    }
  };

  const statusFilterId = useId('status-filter');

  if (loading && tasks.length === 0) {
    return (
      <div className="flex items-center justify-center h-full w-full">
        <Spinner label="Đang tải danh sách công việc của bạn..." />
      </div>
    );
  }

  // Calculate quick metrics based on current list
  const totalTasks = tasks.length;
  const inProgressTasks = tasks.filter(t => t.trang_thai === 'Đang thực hiện').length;
  const completedTasks = tasks.filter(t => t.trang_thai === 'Đã nghiệm thu đạt').length;
  
  // Calculate overdue tasks
  const todayStr = new Date().toISOString().split('T')[0];
  const overdueTasks = tasks.filter(t => 
    t.han_chot && t.han_chot < todayStr && ['Chưa xử lý', 'Đang thực hiện'].includes(t.trang_thai)
  ).length;

  const filteredTasks = filterStatus === 'All' 
    ? tasks 
    : tasks.filter(t => t.trang_thai === filterStatus);

  return (
    <div className="flex flex-col gap-6 p-1 bg-slate-50 min-h-full">
      {/* Header section */}
      <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-800 m-0">Công việc của tôi</h2>
          <p className="text-sm text-slate-500 m-0">Phiếu công việc đang được giao cho Quản lý / Kỹ thuật viên</p>
        </div>
        <Button 
          appearance="outline" 
          icon={<ArrowClockwiseRegular />} 
          onClick={fetchTasks}
        >
          Làm mới
        </Button>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 border-l-4 border-l-blue-500 shadow-sm flex flex-row items-center gap-4 justify-between bg-white">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase">Tổng công việc</span>
            <h3 className="text-2xl font-bold text-slate-800 mt-1 mb-0">{totalTasks}</h3>
          </div>
          <div className="bg-blue-50 p-2.5 rounded-lg text-blue-600">
            <DocumentCheckmarkRegular className="text-2xl" />
          </div>
        </Card>

        <Card className="p-4 border-l-4 border-l-indigo-500 shadow-sm flex flex-row items-center gap-4 justify-between bg-white">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase">Đang thực hiện</span>
            <h3 className="text-2xl font-bold text-slate-800 mt-1 mb-0">{inProgressTasks}</h3>
          </div>
          <div className="bg-indigo-50 p-2.5 rounded-lg text-indigo-600">
            <WrenchRegular className="text-2xl" />
          </div>
        </Card>

        <Card className="p-4 border-l-4 border-l-emerald-500 shadow-sm flex flex-row items-center gap-4 justify-between bg-white">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase">Hoàn thành</span>
            <h3 className="text-2xl font-bold text-slate-800 mt-1 mb-0">{completedTasks}</h3>
          </div>
          <div className="bg-emerald-50 p-2.5 rounded-lg text-emerald-600">
            <CheckmarkCircleRegular className="text-2xl" />
          </div>
        </Card>

        <Card className="p-4 border-l-4 border-l-rose-500 shadow-sm flex flex-row items-center gap-4 justify-between bg-white">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase">Quá hạn</span>
            <h3 className="text-2xl font-bold text-slate-800 mt-1 mb-0">{overdueTasks}</h3>
          </div>
          <div className="bg-rose-50 p-2.5 rounded-lg text-rose-600">
            <WarningRegular className="text-2xl" />
          </div>
        </Card>
      </div>

      {/* Main card list */}
      <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm flex flex-col gap-4">
        {/* Filters bar */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <label htmlFor={statusFilterId} className="text-sm font-bold text-slate-700">Danh sách công việc</label>
            <Select 
              id={statusFilterId}
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              size="small"
            >
              <option value="All">Tất cả trạng thái</option>
              <option value="Chưa xử lý">Chưa xử lý</option>
              <option value="Đang thực hiện">Đang thực hiện</option>
              <option value="Chờ nghiệm thu">Chờ nghiệm thu</option>
              <option value="Đã nghiệm thu đạt">Đã nghiệm thu đạt</option>
              <option value="Đã nghiệm thu lỗi">Đã nghiệm thu lỗi</option>
            </Select>
          </div>
        </div>

        {/* Task Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-1">
          {filteredTasks.map((task) => {
            let statusBadge = 'bg-slate-100 text-slate-800';
            if (task.trang_thai === 'Đang thực hiện') statusBadge = 'bg-indigo-100 text-indigo-800';
            if (task.trang_thai === 'Chờ nghiệm thu') statusBadge = 'bg-purple-100 text-purple-800';
            if (task.trang_thai === 'Đã nghiệm thu đạt') statusBadge = 'bg-emerald-100 text-emerald-800';
            if (task.trang_thai === 'Đã nghiệm thu lỗi') statusBadge = 'bg-rose-100 text-rose-800';

            let priorityBadge = 'bg-blue-50 text-blue-700';
            if (task.muc_do_uu_tien === 'High') priorityBadge = 'bg-rose-50 text-rose-700';

            return (
              <Card key={task.name} className="p-5 border border-slate-200 hover:shadow-md transition-shadow relative bg-white flex flex-col justify-between gap-4">
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-semibold text-slate-400 font-mono">{task.name}</span>
                    <div className="flex gap-1.5">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${statusBadge}`}>{task.trang_thai}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${priorityBadge}`}>{task.muc_do_uu_tien}</span>
                    </div>
                  </div>
                  <h4 className="text-base font-bold text-slate-800 m-0 leading-snug">{task.ten_cong_viec}</h4>
                  
                  {/* Detailed specs */}
                  <div className="flex flex-col gap-1.5 text-xs text-slate-500 mt-2">
                    <div className="flex items-center gap-2">
                      <LeafOneRegular className="text-emerald-500" />
                      <span className="truncate">{task.device_name || 'Không xác định'} ({task.tree})</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <LocationRegular className="text-slate-400" />
                      <span>{task.device_gps || '—'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CalendarRegular className="text-slate-400" />
                      <span>{task.ngay_bat_dau || '—'} → {task.han_chot || '—'}</span>
                    </div>
                  </div>
                </div>

                {/* Submit action */}
                <div className="pt-2 border-t border-slate-100 flex justify-between items-center gap-2">
                  <span className="text-[11px] text-slate-400 truncate max-w-[130px]">{task.don_vi_thi_cong}</span>
                  {['Chưa xử lý', 'Đang thực hiện', 'Chờ nghiệm thu'].includes(task.trang_thai) && (
                    <Button 
                      appearance="primary" 
                      size="small"
                      onClick={() => {
                        setSelectedTask(task);
                        setResultStatus(task.trang_thai === 'Chờ nghiệm thu' ? 'Đã nghiệm thu đạt' : 'Chờ nghiệm thu');
                        setIsDialogOpen(true);
                      }}
                    >
                      Nộp kết quả
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
          
          {filteredTasks.length === 0 && (
            <div className="col-span-full py-12 text-center text-slate-400">
              Không tìm thấy công việc nào.
            </div>
          )}
        </div>
      </div>

      {/* Submission Dialog */}
      {isDialogOpen && selectedTask && (
        <Dialog open={isDialogOpen} onOpenChange={(_, data) => setIsDialogOpen(data.open)}>
          <DialogSurface>
            <DialogBody>
              <DialogTitle>Báo cáo kết quả công việc</DialogTitle>
              <DialogContent className="flex flex-col gap-4 pt-4">
                <p className="text-sm font-semibold text-slate-700 m-0">Công việc: {selectedTask.ten_cong_viec}</p>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-600">Trạng thái cập nhật</label>
                  <Select 
                    value={resultStatus} 
                    onChange={(e) => setResultStatus(e.target.value)}
                    className="w-full"
                  >
                    <option value="Chờ nghiệm thu">Chờ nghiệm thu</option>
                    <option value="Đã nghiệm thu đạt">Nghiệm thu Đạt</option>
                    <option value="Đã nghiệm thu lỗi">Nghiệm thu Lỗi</option>
                  </Select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-600">Ghi chú chi tiết kết quả</label>
                  <Textarea 
                    value={resultNotes} 
                    onChange={(e) => setResultNotes(e.target.value)}
                    placeholder="Mô tả kết quả thi công hoặc lý do nghiệm thu đạt/lỗi..."
                    rows={4}
                    className="w-full"
                  />
                </div>
              </DialogContent>
              <DialogActions className="pt-4">
                <Button appearance="secondary" onClick={() => setIsDialogOpen(false)} disabled={submitting}>Hủy</Button>
                <Button appearance="primary" onClick={handleSubmitResult} disabled={submitting}>
                  {submitting ? 'Đang gửi...' : 'Nộp kết quả'}
                </Button>
              </DialogActions>
            </DialogBody>
          </DialogSurface>
        </Dialog>
      )}
    </div>
  );
};
