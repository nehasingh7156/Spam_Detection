import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { DetectionProvider } from './context/DetectionContext';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import ToastContainer from './components/Toast';

// Pages
import Dashboard from './pages/Dashboard';
import Detector from './pages/Detector';
import BulkAnalysis from './pages/BulkAnalysis';
import Analytics from './pages/Analytics';
import History from './pages/History';
import ModelInsights from './pages/ModelInsights';
import Settings from './pages/Settings';

export const App = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <DetectionProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-cyber-bg text-cyber-text flex">
          {/* Collapsible / Responsive Left Sidebar */}
          <Sidebar
            isCollapsed={isCollapsed}
            setIsCollapsed={setIsCollapsed}
            mobileOpen={mobileOpen}
            setMobileOpen={setMobileOpen}
          />

          {/* Main Layout Area */}
          <div
            className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${
              isCollapsed ? 'lg:pl-20' : 'lg:pl-64'
            }`}
          >
            {/* Top Navigation Bar */}
            <Topbar
              isCollapsed={isCollapsed}
              mobileOpen={mobileOpen}
              setMobileOpen={setMobileOpen}
            />

            {/* Dynamic Page Content */}
            <main className="flex-1 p-4 sm:p-6 lg:p-8 mt-16 min-h-[calc(100vh-4rem)]">
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/detector" element={<Detector />} />
                <Route path="/bulk" element={<BulkAnalysis />} />
                <Route path="/analytics" element={<Analytics />} />
                <Route path="/history" element={<History />} />
                <Route path="/insights" element={<ModelInsights />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>
          </div>

          {/* Toast Notification Queue */}
          <ToastContainer />
        </div>
      </BrowserRouter>
    </DetectionProvider>
  );
};

export default App;
