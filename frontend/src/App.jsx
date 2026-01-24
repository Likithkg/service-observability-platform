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
  const [isValidatingToken, setIsValidatingToken] = useState(!!token); // Only validate if token exists

  // Validate token on app startup
  useEffect(() => {
    const validateToken = async () => {
      const storedToken = localStorage.getItem('token');
      if (storedToken) {
        try {
          // Try to fetch applications to validate token
          const data = await applicationsAPI.getAll();
          setToken(storedToken);
          setApplications(data);
          setCurrentPage('home');
        } catch (err) {
          // Token is invalid, clear it
          console.log('Token validation failed, redirecting to login');
          localStorage.removeItem('token');
          setToken(null);
          setCurrentPage('login');
        } finally {
          setIsValidatingToken(false);
        }
      } else {
        setIsValidatingToken(false);
        setCurrentPage('login');
      }
    };

    validateToken();
  }, []);

  useEffect(() => {
    if (token && !isValidatingToken && currentPage === 'login') {
      setCurrentPage('home');
      fetchApplications();
    }
  }, [token, isValidatingToken]);

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

  // Show loading screen while validating token
  if (isValidatingToken) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDarkTheme ? 'bg-gray-900' : 'bg-gradient-to-br from-blue-50 to-indigo-100'}`}>
        <div className={`rounded-lg shadow-lg p-8 text-center ${isDarkTheme ? 'bg-gray-800' : 'bg-white'}`}>
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className={isDarkTheme ? 'text-gray-300' : 'text-gray-600'}>Validating session...</p>
        </div>
      </div>
    );
  }

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