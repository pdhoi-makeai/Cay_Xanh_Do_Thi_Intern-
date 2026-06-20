import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { FluentProvider, webLightTheme } from '@fluentui/react-components';
import { useAuthStore } from './store/useAuthStore';
import { MainLayout } from './layout/MainLayout';
import { Login } from './pages/Login';
import { MapDashboard } from './pages/MapDashboard';
import { IncidentReport } from './pages/IncidentReport';
import { Dashboard } from './pages/Dashboard';
import { MyTasks } from './pages/MyTasks';
import { TreeManagement } from './pages/TreeManagement';
import { TreeSpecies } from './pages/TreeSpecies';
import { IncidentList } from './pages/IncidentList';
import { IncidentPriorities } from './pages/IncidentPriorities';
import { IncidentSources } from './pages/IncidentSources';
import { IncidentTypes } from './pages/IncidentTypes';
import { InspectionTickets } from './pages/InspectionTickets';
import { InspectionTypes } from './pages/InspectionTypes';
import { LeaningStatuses } from './pages/LeaningStatuses';
import { DiseaseStatuses } from './pages/DiseaseStatuses';
import { SafetyLevels } from './pages/SafetyLevels';
import { PartStatuses } from './pages/PartStatuses';
import { TreeGroups } from './pages/TreeGroups';
import { CarePlans } from './pages/CarePlans';
import { CarePlanTypes } from './pages/CarePlanTypes';
import { CarePlanPriorities } from './pages/CarePlanPriorities';
import { WorkOrders } from './pages/WorkOrders';
import { WorkLogs } from './pages/WorkLogs';
import { ActionTypes } from './pages/ActionTypes';
import { AcceptanceTickets } from './pages/AcceptanceTickets';
import { AcceptanceOutcomes } from './pages/AcceptanceOutcomes';
import { StatsArea } from './pages/StatsArea';
import { StatsIncidents } from './pages/StatsIncidents';
import { StatsPlans } from './pages/StatsPlans';
import { StatsWorkOrders } from './pages/StatsWorkOrders';
import { StatsPerformance } from './pages/StatsPerformance';
import { StatsSpecies } from './pages/StatsSpecies';
import { StatsPeriodic } from './pages/StatsPeriodic';

// ProtectedRoute component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuthStore();
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

const App: React.FC = () => {
  const { checkUser } = useAuthStore();

  useEffect(() => {
    // Session validity check on mount
    checkUser();
  }, [checkUser]);

  return (
    <FluentProvider theme={webLightTheme}>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route path="/" element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="my-tasks" element={<MyTasks />} />
            <Route path="gis-map" element={<MapDashboard />} />
            <Route path="tree-management" element={<TreeManagement />} />
            <Route path="tree-species" element={<TreeSpecies />} />
            <Route path="incident-list" element={<IncidentList />} />
            <Route path="incident-priorities" element={<IncidentPriorities />} />
            <Route path="incident-sources" element={<IncidentSources />} />
            <Route path="incident-types" element={<IncidentTypes />} />
            <Route path="report" element={<IncidentReport />} />
            <Route path="inspection-tickets" element={<InspectionTickets />} />
            <Route path="inspection-types" element={<InspectionTypes />} />
            <Route path="leaning-statuses" element={<LeaningStatuses />} />
            <Route path="disease-statuses" element={<DiseaseStatuses />} />
            <Route path="safety-levels" element={<SafetyLevels />} />
            <Route path="part-statuses" element={<PartStatuses />} />
            <Route path="tree-groups" element={<TreeGroups />} />
            <Route path="care-plans" element={<CarePlans />} />
            <Route path="care-plan-types" element={<CarePlanTypes />} />
            <Route path="care-plan-priorities" element={<CarePlanPriorities />} />
            <Route path="work-orders" element={<WorkOrders />} />
            <Route path="work-logs" element={<WorkLogs />} />
            <Route path="action-types" element={<ActionTypes />} />
            <Route path="acceptance-tickets" element={<AcceptanceTickets />} />
            <Route path="acceptance-outcomes" element={<AcceptanceOutcomes />} />
            <Route path="stats/area" element={<StatsArea />} />
            <Route path="stats/incidents" element={<StatsIncidents />} />
            <Route path="stats/plans" element={<StatsPlans />} />
            <Route path="stats/work-orders" element={<StatsWorkOrders />} />
            <Route path="stats/performance" element={<StatsPerformance />} />
            <Route path="stats/species" element={<StatsSpecies />} />
            <Route path="stats/periodic" element={<StatsPeriodic />} />
          </Route>
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </FluentProvider>
  );
};

export default App;
