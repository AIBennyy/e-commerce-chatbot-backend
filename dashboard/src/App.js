import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

// Layout components
import Header from './components/Header';
import Sidebar from './components/Sidebar';

// Monitoring components
import SystemStatus from './components/monitoring/SystemStatus';
import CookieHealth from './components/monitoring/CookieHealth';
import ErrorLog from './components/monitoring/ErrorLog';

// Configuration components
import PlatformSettings from './components/config/PlatformSettings';
import CookieSettings from './components/config/CookieSettings';

// Analytics components
import UsageStats from './components/analytics/UsageStats';
import PerformanceMetrics from './components/analytics/PerformanceMetrics';

function App() {
  return (
    <Router basename="/dashboard">
      <div className="dashboard-container">
        <Header />
        <div className="dashboard-content">
          <Sidebar />
          <main className="main-content">
            <Routes>
              {/* Monitoring routes */}
              <Route path="/" element={<SystemStatus />} />
              <Route path="/monitoring/cookies" element={<CookieHealth />} />
              <Route path="/monitoring/errors" element={<ErrorLog />} />
              
              {/* Configuration routes */}
              <Route path="/config/platforms" element={<PlatformSettings />} />
              <Route path="/config/cookies" element={<CookieSettings />} />
              
              {/* Analytics routes */}
              <Route path="/analytics/usage" element={<UsageStats />} />
              <Route path="/analytics/performance" element={<PerformanceMetrics />} />
            </Routes>
          </main>
        </div>
      </div>
    </Router>
  );
}

export default App;
