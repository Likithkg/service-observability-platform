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
  const [isDarkTheme, setIsDarkTheme] = useState(localStorage.getItem('theme') === 'dark');

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

  const handleDeleteApp = async (appId) => {
    try {
      await applicationsAPI.delete(appId);
      await fetchApplications();
    } catch (err) {
      console.error('Error deleting application:', err);
      alert('Failed to delete application');
    }
  };

  const handleViewMetrics = (app) => {
    setSelectedApp(app);
    setCurrentPage('metrics');
  };

  const handleToggleTheme = () => {
    setIsDarkTheme(!isDarkTheme);
    localStorage.setItem('theme', !isDarkTheme ? 'dark' : 'light');
  };

  if (currentPage === 'login') {
    return (
      <Login
        onSuccess={handleLoginSuccess}
        onSwitchToRegister={() => setCurrentPage('register')}
        isDarkTheme={isDarkTheme}
      />
    );
  }

  if (currentPage === 'register') {
    return (
      <Register
        onSuccess={handleLoginSuccess}
        onSwitchToLogin={() => setCurrentPage('login')}
        isDarkTheme={isDarkTheme}
      />
    );
  }

  if (currentPage === 'addApp') {
    return (
      <AddApplication
        onSuccess={handleAddAppSuccess}
        onBack={() => setCurrentPage('home')}
        onLogout={handleLogout}
        isDarkTheme={isDarkTheme}
      />
    );
  }

  if (currentPage === 'metrics' && selectedApp) {
    return (
      <Metrics
        application={selectedApp}
        onBack={() => setCurrentPage('home')}
        onLogout={handleLogout}
        isDarkTheme={isDarkTheme}
      />
    );
  }

  return (
    <Dashboard
      applications={applications}
      onAddApp={() => setCurrentPage('addApp')}
      onViewMetrics={handleViewMetrics}
      onDeleteApp={handleDeleteApp}
      onLogout={handleLogout}
      isDarkTheme={isDarkTheme}
      onToggleTheme={handleToggleTheme}
    />
  );
}

export default App;