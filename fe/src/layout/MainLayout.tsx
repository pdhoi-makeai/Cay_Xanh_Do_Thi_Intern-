import React from 'react';
import { Outlet, useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { 
  Button, 
  Avatar
} from '@fluentui/react-components';
import { 
  MapRegular, 
  AlertRegular, 
  SignOutRegular,
  LeafOneRegular,
  GridRegular,
  BriefcaseRegular,
  SearchRegular,
  ListRegular,
  BugRegular,
  ShieldCheckmarkRegular,
  CalendarRegular,
  ClipboardRegular
} from '@fluentui/react-icons';

export const MainLayout: React.FC = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  if (!user) return null;

  const getPageTitle = () => {
    switch (location.pathname) {
      case '/dashboard':
        return 'Bản điều khiển';
      case '/my-tasks':
        return 'Công việc của tôi';
      case '/gis-map':
        return 'Bản đồ cây xanh';
      case '/tree-management':
        return 'Quản lý cây xanh';
      case '/tree-species':
        return 'Danh mục loại cây';
      case '/incident-list':
        return 'Quản lý sự cố cây xanh';
      case '/incident-priorities':
        return 'Mức độ sự cố';
      case '/incident-sources':
        return 'Nguồn sự cố';
      case '/incident-types':
        return 'Loại sự cố';
      case '/report':
        return 'Báo cáo sự cố';
      case '/inspection-tickets':
        return 'Kiểm tra cây xanh';
      case '/inspection-types':
        return 'Loại kiểm tra';
      case '/leaning-statuses':
        return 'Trạng thái nghiêng';
      case '/disease-statuses':
        return 'Trạng thái sâu bệnh';
      case '/safety-levels':
        return 'Mức an toàn';
      case '/part-statuses':
        return 'Tình trạng bộ phận cây';
      case '/tree-groups':
        return 'Nhóm cây';
      case '/care-plans':
        return 'Kế hoạch chăm sóc';
      case '/care-plan-types':
        return 'Loại kế hoạch';
      case '/care-plan-priorities':
        return 'Mức ưu tiên';
      case '/work-orders':
        return 'Phiếu công việc';
      case '/work-logs':
        return 'Nhật ký thi công';
      case '/action-types':
        return 'Loại hành động';
      case '/acceptance-tickets':
        return 'Biên bản nghiệm thu';
      case '/acceptance-outcomes':
        return 'Kết quả nghiệm thu';
      case '/stats/area':
        return 'Tình trạng Cây theo Khu vực';
      case '/stats/incidents':
        return 'Phân tích Sự cố';
      case '/stats/plans':
        return 'Tiến độ Kế hoạch';
      case '/stats/work-orders':
        return 'Thống kê Phiếu công việc';
      case '/stats/performance':
        return 'Hiệu suất đơn vị';
      case '/stats/species':
        return 'Phân tích theo loại cây';
      case '/stats/periodic':
        return 'Báo cáo định kỳ';
      default:
        return 'Quản lý cây xanh';
    }
  };

  return (
    <div className="flex h-screen w-screen bg-gray-50 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col justify-between border-r border-slate-800 shrink-0">
        <div className="overflow-y-auto">
          {/* Brand Logo */}
          <div className="p-6 flex items-center gap-3 border-b border-slate-800 sticky top-0 bg-slate-900 z-10">
            <LeafOneRegular className="text-emerald-400 text-2xl" />
            <div>
              <h2 className="text-sm font-bold text-white tracking-wide m-0">Quản lý cây xanh</h2>
              <span className="text-[10px] text-slate-400">đô thị thông minh</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 flex flex-col gap-2">
            <Link 
              to="/dashboard" 
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                location.pathname === '/dashboard' 
                  ? 'bg-teal-600 text-white' 
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <GridRegular className="text-lg" />
              Tổng quan
            </Link>

            <Link 
              to="/my-tasks" 
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                location.pathname === '/my-tasks' 
                  ? 'bg-teal-600 text-white' 
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <BriefcaseRegular className="text-lg" />
              Công việc của tôi
            </Link>

            <Link 
              to="/gis-map" 
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                location.pathname === '/gis-map' 
                  ? 'bg-teal-600 text-white' 
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <MapRegular className="text-lg" />
              Bản đồ cây xanh
            </Link>

            {/* Group: Tài sản cây xanh */}
            <div className="text-[11px] font-bold text-slate-500 tracking-wider uppercase px-4 mt-4 mb-2">
              Tài sản cây xanh
            </div>

            <Link 
              to="/tree-management" 
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                location.pathname === '/tree-management' 
                  ? 'bg-teal-600 text-white' 
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <LeafOneRegular className="text-lg text-emerald-400" />
              Quản lý cây xanh
            </Link>

            <Link 
              to="/tree-species" 
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                location.pathname === '/tree-species' 
                  ? 'bg-teal-600 text-white' 
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <LeafOneRegular className="text-lg text-teal-400" />
              Loại cây
            </Link>
            
            {/* Group: Sự cố & Phản ánh */}
            <div className="text-[11px] font-bold text-slate-500 tracking-wider uppercase px-4 mt-4 mb-2">
              Sự cố & Phản ánh
            </div>

            <Link 
              to="/incident-list" 
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                location.pathname === '/incident-list' 
                  ? 'bg-teal-600 text-white' 
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <AlertRegular className="text-lg text-blue-400" />
              Danh sách sự cố
            </Link>

            <Link 
              to="/report" 
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                location.pathname === '/report' 
                  ? 'bg-teal-600 text-white' 
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <AlertRegular className="text-lg text-rose-400" />
              Báo cáo sự cố
            </Link>

            <Link 
              to="/incident-priorities" 
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                location.pathname === '/incident-priorities' 
                  ? 'bg-teal-600 text-white' 
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <AlertRegular className="text-lg text-amber-400" />
              Mức độ sự cố
            </Link>

            <Link 
              to="/incident-sources" 
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                location.pathname === '/incident-sources' 
                  ? 'bg-teal-600 text-white' 
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <AlertRegular className="text-lg text-cyan-400" />
              Nguồn sự cố
            </Link>

            <Link 
              to="/incident-types" 
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                location.pathname === '/incident-types' 
                  ? 'bg-teal-600 text-white' 
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <AlertRegular className="text-lg text-violet-400" />
              Loại sự cố
            </Link>

            {/* Group: Kiểm tra cây */}
            <div className="text-[11px] font-bold text-slate-500 tracking-wider uppercase px-4 mt-4 mb-2">
              Kiểm tra cây
            </div>

            <Link 
              to="/inspection-tickets" 
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                location.pathname === '/inspection-tickets' 
                  ? 'bg-teal-600 text-white' 
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <SearchRegular className="text-lg text-emerald-400" />
              Phiếu kiểm tra
            </Link>

            <Link 
              to="/inspection-types" 
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                location.pathname === '/inspection-types' 
                  ? 'bg-teal-600 text-white' 
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <ListRegular className="text-lg text-teal-400" />
              Loại kiểm tra
            </Link>

            <Link 
              to="/leaning-statuses" 
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                location.pathname === '/leaning-statuses' 
                  ? 'bg-teal-600 text-white' 
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <GridRegular className="text-lg text-amber-400" />
              Trạng thái nghiêng
            </Link>

            <Link 
              to="/disease-statuses" 
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                location.pathname === '/disease-statuses' 
                  ? 'bg-teal-600 text-white' 
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <BugRegular className="text-lg text-rose-400" />
              Trạng thái sâu bệnh
            </Link>

            <Link 
              to="/safety-levels" 
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                location.pathname === '/safety-levels' 
                  ? 'bg-teal-600 text-white' 
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <ShieldCheckmarkRegular className="text-lg text-sky-400" />
              Mức an toàn
            </Link>

            <Link 
              to="/part-statuses" 
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                location.pathname === '/part-statuses' 
                  ? 'bg-teal-600 text-white' 
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <LeafOneRegular className="text-lg text-indigo-400" />
              Tình trạng bộ phận cây
            </Link>

            <Link 
              to="/tree-groups" 
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                location.pathname === '/tree-groups' 
                  ? 'bg-teal-600 text-white' 
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <LeafOneRegular className="text-lg text-violet-400" />
              Nhóm cây
            </Link>

            {/* Group: Kế hoạch chăm sóc */}
            <div className="text-[11px] font-bold text-slate-500 tracking-wider uppercase px-4 mt-4 mb-2">
              Kế hoạch chăm sóc
            </div>

            <Link 
              to="/care-plans" 
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                location.pathname === '/care-plans' 
                  ? 'bg-teal-600 text-white' 
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <CalendarRegular className="text-lg text-emerald-400" />
              Danh sách kế hoạch
            </Link>

            <Link 
              to="/care-plan-types" 
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                location.pathname === '/care-plan-types' 
                  ? 'bg-teal-600 text-white' 
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <ClipboardRegular className="text-lg text-teal-400" />
              Loại kế hoạch
            </Link>

            <Link 
              to="/care-plan-priorities" 
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                location.pathname === '/care-plan-priorities' 
                  ? 'bg-teal-600 text-white' 
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <AlertRegular className="text-lg text-amber-400" />
              Mức ưu tiên
            </Link>

            {/* Group: Thi công */}
            <div className="text-[11px] font-bold text-slate-500 tracking-wider uppercase px-4 mt-4 mb-2">
              Thi công
            </div>

            <Link 
              to="/work-orders" 
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                location.pathname === '/work-orders' 
                  ? 'bg-teal-600 text-white' 
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <ClipboardRegular className="text-lg text-emerald-400" />
              Phiếu công việc
            </Link>

            <Link 
              to="/work-logs" 
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                location.pathname === '/work-logs' 
                  ? 'bg-teal-600 text-white' 
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <ListRegular className="text-lg text-blue-400" />
              Nhật ký thi công
            </Link>

            <Link 
              to="/action-types" 
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                location.pathname === '/action-types' 
                  ? 'bg-teal-600 text-white' 
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <GridRegular className="text-lg text-purple-400" />
              Loại hành động
            </Link>

            {/* Group: Nghiệm thu */}
            <div className="text-[11px] font-bold text-slate-500 tracking-wider uppercase px-4 mt-4 mb-2">
              Nghiệm thu
            </div>

            <Link 
              to="/acceptance-tickets" 
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                location.pathname === '/acceptance-tickets' 
                  ? 'bg-teal-600 text-white' 
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <ShieldCheckmarkRegular className="text-lg text-emerald-400" />
              Biên bản nghiệm thu
            </Link>

            <Link 
              to="/acceptance-outcomes" 
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                location.pathname === '/acceptance-outcomes' 
                  ? 'bg-teal-600 text-white' 
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <ListRegular className="text-lg text-teal-400" />
              Kết quả nghiệm thu
            </Link>

            {/* Group: Thống kê & Báo cáo */}
            <div className="text-[11px] font-bold text-slate-500 tracking-wider uppercase px-4 mt-4 mb-2">
              Thống kê & Báo cáo
            </div>

            <Link 
              to="/stats/area" 
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                location.pathname === '/stats/area' 
                  ? 'bg-teal-600 text-white' 
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <GridRegular className="text-lg text-blue-400" />
              Theo khu vực
            </Link>

            <Link 
              to="/stats/incidents" 
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                location.pathname === '/stats/incidents' 
                  ? 'bg-teal-600 text-white' 
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <AlertRegular className="text-lg text-rose-400" />
              Sự cố
            </Link>

            <Link 
              to="/stats/plans" 
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                location.pathname === '/stats/plans' 
                  ? 'bg-teal-600 text-white' 
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <CalendarRegular className="text-lg text-amber-400" />
              Kế hoạch
            </Link>

            <Link 
              to="/stats/work-orders" 
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                location.pathname === '/stats/work-orders' 
                  ? 'bg-teal-600 text-white' 
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <ClipboardRegular className="text-lg text-cyan-400" />
              Phiếu công việc
            </Link>

            <Link 
              to="/stats/performance" 
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                location.pathname === '/stats/performance' 
                  ? 'bg-teal-600 text-white' 
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <ListRegular className="text-lg text-violet-400" />
              Hiệu suất đơn vị
            </Link>

            <Link 
              to="/stats/species" 
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                location.pathname === '/stats/species' 
                  ? 'bg-teal-600 text-white' 
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <LeafOneRegular className="text-lg text-emerald-400" />
              Phân tích theo loại cây
            </Link>

            <Link 
              to="/stats/periodic" 
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                location.pathname === '/stats/periodic' 
                  ? 'bg-teal-600 text-white' 
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <ClipboardRegular className="text-lg text-slate-400" />
              Báo cáo định kỳ
            </Link>
          </nav>
        </div>

        {/* User Info & Logout */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/40 sticky bottom-0 z-10">
          <div className="flex items-center gap-3 mb-4">
            <Avatar 
              name={user.first_name || user.email} 
              badge={{ status: 'available' }} 
              size={36} 
            />
            <div className="overflow-hidden">
              <p className="text-sm font-semibold text-white truncate m-0">{user.first_name}</p>
              <p className="text-xs text-slate-400 truncate m-0">{user.roles[0] || 'Citizen'}</p>
            </div>
          </div>
          <Button 
            appearance="subtle" 
            icon={<SignOutRegular />}
            onClick={handleLogout}
            className="w-full text-slate-300 hover:text-white hover:bg-slate-800 justify-start"
          >
            Đăng xuất
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white border-b border-gray-200 px-6 flex items-center justify-between shrink-0">
          <h1 className="text-xl font-bold text-slate-800 m-0">
            {getPageTitle()}
          </h1>
          <span className="text-xs text-gray-500 font-mono">Huong Tra, VN</span>
        </header>

        {/* Content Pane */}
        <div className="flex-1 overflow-auto p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
