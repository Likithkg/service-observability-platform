import React, { useState } from 'react';
import { Cloud, Server, MapPin, Activity, Plus, Trash2, Moon, Sun, Key } from 'lucide-react';
import Navbar from './Navbar';
import AwsCredentialsForm from './AwsCredentialsForm';

const Dashboard = ({ applications, onAddApp, onViewMetrics, onDeleteApp, onLogout, isDarkTheme, onToggleTheme }) => {
  const [selectedAppForCreds, setSelectedAppForCreds] = useState(null);

  const handleDelete = (e, appId) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this application?')) {
      onDeleteApp(appId);
    }
  };

  return (
    <div className={`min-h-screen ${isDarkTheme ? 'bg-gray-900' : 'bg-gradient-to-br from-blue-50 to-indigo-100'}`}>
      <Navbar onAddApp={onAddApp} onLogout={onLogout} isDarkTheme={isDarkTheme} />

      <div className="max-w-7xl mx-auto p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className={`text-4xl font-bold mb-2 ${isDarkTheme ? 'text-white' : 'text-gray-800'}`}>Your Applications</h1>
            <p className={isDarkTheme ? 'text-gray-400' : 'text-gray-600'}>Monitor and manage your cloud infrastructure</p>
          </div>
          <button
            onClick={onToggleTheme}
            className={`p-3 rounded-lg transition ${isDarkTheme ? 'bg-gray-800 text-yellow-400 hover:bg-gray-700' : 'bg-white text-gray-800 hover:bg-gray-100 shadow-lg'}`}
            title={isDarkTheme ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {isDarkTheme ? <Sun size={28} /> : <Moon size={28} />}
          </button>
        </div>

        {applications.length === 0 ? (
          <div className={`rounded-2xl shadow-xl p-12 text-center ${isDarkTheme ? 'bg-gray-800' : 'bg-white'}`}>
            <Cloud className={`mx-auto mb-4 ${isDarkTheme ? 'text-gray-600' : 'text-gray-400'}`} size={64} />
            <h2 className={`text-2xl font-bold mb-2 ${isDarkTheme ? 'text-white' : 'text-gray-800'}`}>No Applications Yet</h2>
            <p className={`mb-6 ${isDarkTheme ? 'text-gray-400' : 'text-gray-600'}`}>Get started by adding your first cloud application</p>
            <button
              onClick={onAddApp}
              className="inline-flex items-center space-x-2 bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition"
            >
              <Plus size={20} />
              <span>Add Your First Application</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {applications.map((app) => (
              <div
                key={app.id}
                className={`rounded-xl shadow-lg hover:shadow-2xl transition-shadow cursor-pointer p-6 ${isDarkTheme ? 'bg-gray-800' : 'bg-white'}`}
                onClick={() => onViewMetrics(app)}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className={`p-3 rounded-lg ${isDarkTheme ? 'bg-indigo-900' : 'bg-indigo-100'}`}>
                      <Server className={isDarkTheme ? 'text-indigo-400' : 'text-indigo-600'} size={24} />
                    </div>
                    <div>
                      <h3 className={`text-lg font-bold ${isDarkTheme ? 'text-white' : 'text-gray-800'}`}>{app.name}</h3>
                      <p className={`text-sm ${isDarkTheme ? 'text-gray-400' : 'text-gray-500'}`}>{app.region}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                    <button
                      onClick={(e) => handleDelete(e, app.id)}
                      className="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 rounded transition"
                      title="Delete application"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  <div className={`flex items-center text-sm ${isDarkTheme ? 'text-gray-400' : 'text-gray-600'}`}>
                    <Server size={14} className="mr-2" />
                    <span className="font-mono">{app.instance_id}</span>
                  </div>
                  <div className={`flex items-center text-sm ${isDarkTheme ? 'text-gray-400' : 'text-gray-600'}`}>
                    <MapPin size={14} className="mr-2" />
                    <span>{app.region}</span>
                  </div>
                  {app.aws_access_key_id && (
                    <div className={`flex items-center text-sm ${isDarkTheme ? 'text-green-400' : 'text-green-600'}`}>
                      <Key size={14} className="mr-2" />
                      <span>AWS Credentials Configured</span>
                    </div>
                  )}
                </div>

                <div className={`pt-4 space-y-2 border-t ${isDarkTheme ? 'border-gray-700' : 'border-gray-200'}`}>
                  <button className={`w-full flex items-center justify-center space-x-2 font-semibold ${isDarkTheme ? 'text-indigo-400 hover:text-indigo-300' : 'text-indigo-600 hover:text-indigo-700'}`}>
                    <Activity size={16} />
                    <span>View Metrics</span>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedAppForCreds(app);
                    }}
                    className={`w-full flex items-center justify-center space-x-2 font-semibold text-sm py-2 rounded transition ${isDarkTheme ? 'text-amber-400 hover:text-amber-300' : 'text-amber-600 hover:text-amber-700'}`}
                  >
                    <Key size={14} />
                    <span>Manage AWS Credentials</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedAppForCreds && (
        <AwsCredentialsForm
          applicationId={selectedAppForCreds.id}
          onSuccess={() => {
            // Optionally refresh applications list
          }}
          onClose={() => setSelectedAppForCreds(null)}
        />
      )}
    </div>
  );
};

export default Dashboard;