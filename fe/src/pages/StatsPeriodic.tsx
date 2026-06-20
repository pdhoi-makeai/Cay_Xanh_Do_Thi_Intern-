import React, { useState } from 'react';
import { 
  Button,
  Select,
  Card,
  CardHeader,
  CardFooter
} from '@fluentui/react-components';
import { 
  DocumentPdfRegular,
  DocumentRegular
} from '@fluentui/react-icons';

export const StatsPeriodic: React.FC = () => {
  const [reportType, setReportType] = useState('monthly');
  const [reportPeriod, setReportPeriod] = useState('2026-06');

  const exportReport = (format: 'pdf' | 'excel') => {
    alert(`Xuất báo cáo định kỳ dạng ${format.toUpperCase()} thành công!`);
  };

  return (
    <div className="flex flex-col gap-6 bg-slate-50 min-h-full">
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm">
        <h2 className="text-xl font-bold text-slate-800 m-0">Báo cáo định kỳ</h2>
        <p className="text-sm text-slate-500 m-0">Xuất báo cáo tổng hợp tình trạng cây xanh, sự cố và thi công theo tuần/tháng/quý</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6">
          <CardHeader 
            header={<h3 className="text-sm font-bold text-slate-700 m-0">Cấu hình báo cáo</h3>}
          />
          <div className="flex flex-col gap-4 mt-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-500">Loại báo cáo</label>
              <Select value={reportType} onChange={(e) => setReportType(e.target.value)}>
                <option value="weekly">Báo cáo Tuần</option>
                <option value="monthly">Báo cáo Tháng</option>
                <option value="quarterly">Báo cáo Quý</option>
                <option value="yearly">Báo cáo Năm</option>
              </Select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-500">Kỳ báo cáo</label>
              <Select value={reportPeriod} onChange={(e) => setReportPeriod(e.target.value)}>
                <option value="2026-05">Tháng 5/2026</option>
                <option value="2026-06">Tháng 6/2026</option>
                <option value="2026-Q2">Quý 2/2026</option>
              </Select>
            </div>
          </div>
          <CardFooter className="mt-6 pt-4 border-t border-slate-100 flex justify-end gap-3">
            <Button 
              appearance="outline" 
              icon={<DocumentPdfRegular />} 
              onClick={() => exportReport('pdf')}
              className="text-rose-700 hover:text-rose-800"
            >
              Tải PDF
            </Button>
            <Button 
              appearance="primary" 
              icon={<DocumentRegular />} 
              onClick={() => exportReport('excel')}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              Tải Excel
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};
