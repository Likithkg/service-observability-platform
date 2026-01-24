import React, { useState, useEffect } from 'react';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
import AddApplication from './components/AddApplication';
import Metrics from './components/Metrics';
import { applicationsAPI } from './services/api';

function App() {
  const [currentPage, setCurrentPage] = useState('login');
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [applications, setApplications] = useState([]);
  const [selectedApp, setSelectedApp] = useState(null);

  useEffect(() => {
    if (token) {
      setCurrentPage('home');
      fetchApplications();
    }
  }, [token]);

  const fetchApplications = async () => {
    try {
      const data = await applicationsAPI.getAll();
      setApplications(data);
    } catch (err) {
      console.error('Error fetching applications:', err);
    }
  };

  const handleLoginSuccess = () => {
    setToken(localStorage.getItem('token'));
  };

  const handleLogout = () => {
    setToken(null);
    localStorage.removeItem('token');
    setCurrentPage('login');
    setApplications([]);
    setSelectedApp(null);
  };

  const handleAddAppSuccess = async () => {
    await fetchApplications();
    setCurrentPage('home');
  };

  const handleViewMetrics = (app) => {
    setSelectedApp(app);
    setCurrentPage('metrics');
  };

  if (currentPage === 'login') {
    return (
      <Login
        onSuccess={handleLoginSuccess}
        onSwitchToRegister={() => setCurrentPage('register')}
      />
    );
  }

  if (currentPage === 'register') {
    return (
      <Register
        onSuccess={handleLoginSuccess}
        onSwitchToLogin={() => setCurrentPage('login')}
      />
    );
  }

  if (currentPage === 'addApp') {
    return (
      <AddApplication
        onSuccess={handleAddAppSuccess}
        onBack={() => setCurrentPage('home')}
        onLogout={handleLogout}
      />
    );
  }

  if (currentPage === 'metrics' && selectedApp) {
    return (
      <Metrics
        application={selectedApp}
        onBack={() => setCurrentPage('home')}
        onLogout={handleLogout}
      />
    );
  }

  return (
    <Dashboard
      applications={applications}
      onAddApp={() => setCurrentPage('addApp')}
      onViewMetrics={handleViewMetrics}
      onLogout={handleLogout}
    />
  );
}

export default App;

// VITE_API_URL=http://localhost:8000