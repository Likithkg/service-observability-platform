import React, { useState } from 'react';
import { Cloud, Server, MapPin, Activity, Plus, Trash2, Moon, Sun, Key, Sparkles } from 'lucide-react';
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
    <div className={`min-h-screen ${isDarkTheme ? 'dark bg-slate-900' : 'gradient-bg'}`}>
      <Navbar onAddApp={onAddApp} onLogout={onLogout} isDarkTheme={isDarkTheme} />

      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold mb-2 text-slate-900 dark:text-white">
              Your Applications
            </h1>
            <p className="text-slate-600 dark:text-slate-400">
              Monitor and manage your cloud infrastructure
            </p>
          </div>
          <button
            onClick={onToggleTheme}
            className={`p-3 rounded-xl transition-all duration-200 ${
              isDarkTheme 
                ? 'bg-slate-800 text-yellow-400 hover:bg-slate-700 hover:ring-2 hover:ring-yellow-400/20' 
                : 'bg-white text-slate-600 hover:bg-slate-50 shadow-lg hover:shadow-xl'
            }`}
            title={isDarkTheme ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {isDarkTheme ? <Sun size={24} /> : <Moon size={24} />}
          </button>
        </div>

        {applications.length === 0 ? (
          <div className="card p-12 text-center animate-fade-in">
            <Cloud className="mx-auto mb-6 text-indigo-400 dark:text-indigo-500" size={72} />
            <h2 className="text-2xl font-bold mb-2 text-slate-900 dark:text-white">
              No Applications Yet
            </h2>
            <p className="text-slate-600 dark:text-slate-400 mb-8">
              Get started by adding your first cloud application
            </p>
            <button
              onClick={onAddApp}
              className="btn-primary inline-flex items-center space-x-2"
            >
              <Plus size={20} />
              <span>Add Your First Application</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {applications.map((app, index) => (
              <div
                key={app.id}
                className={`card p-6 transition-all duration-200 hover:scale-105 ${
                  isDarkTheme ? 'dark' : ''
                } animate-slide-up`}
                style={{ animationDelay: `${index * 0.1}s` }}
                onClick={() => onViewMetrics(app)}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-3 rounded-xl bg-gradient-to-br from-indigo-100 to-indigo-200 dark:from-indigo-900 dark:to-indigo-800">
                      <Server className="text-indigo-600 dark:text-indigo-400" size={24} />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                        {app.name}
                      </h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        {app.region}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse shadow-sm shadow-green-500/50"></div>
                    <button
                      onClick={(e) => handleDelete(e, app.id)}
                      className="text-red-500 dark:text-red-400 hover:text-red-700 p-1.5 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                      title="Delete application"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-sm text-slate-600 dark:text-slate-400">
                    <Server size={14} className="mr-2" />
                    <span className="font-mono font-medium">{app.instance_id}</span>
                  </div>
                  <div className="flex items-center text-sm text-slate-600 dark:text-slate-400">
                    <MapPin size={14} className="mr-2" />
                    <span>{app.region}</span>
                  </div>
                  {app.aws_access_key_id && (
                    <div className="flex items-center text-sm text-green-600 dark:text-green-400">
                      <Key size={14} className="mr-2" />
                      <span>AWS Credentials Configured</span>
                    </div>
                  )}
                </div>

                <div className={`pt-4 space-y-2 border-t ${isDarkTheme ? 'border-slate-700' : 'border-slate-200'}`}>
                  <button className="w-full btn-secondary text-sm">
                    <div className="flex items-center justify-center space-x-2">
                      <Activity size={16} />
                      <span>View Metrics</span>
                    </div>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedAppForCreds(app);
                    }}
                    className="w-full flex items-center justify-center space-x-2 text-sm py-2 px-3 rounded-lg transition-colors bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/30"
                  >
                    <Key size={14} />
                    <span>Manage AWS Credentials</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {applications.length > 0 && (
          <div className="text-center mt-8 animate-fade-in">
            <div className="inline-flex items-center space-x-2 text-slate-600 dark:text-slate-400">
              <Sparkles size={20} />
              <span>We have {applications.length} application{applications.length > 1 ? 's' : ''} monitoring your infrastructure</span>
            </div>
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
