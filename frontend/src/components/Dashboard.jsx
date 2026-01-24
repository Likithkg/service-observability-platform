import React from 'react';
import { Cloud, Server, MapPin, Activity, Plus } from 'lucide-react';
import Navbar from './Navbar';

const Dashboard = ({ applications, onAddApp, onViewMetrics, onLogout }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Navbar onAddApp={onAddApp} onLogout={onLogout} />

      <div className="max-w-7xl mx-auto p-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Your Applications</h1>
          <p className="text-gray-600">Monitor and manage your cloud infrastructure</p>
        </div>

        {applications.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
            <Cloud className="mx-auto text-gray-400 mb-4" size={64} />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">No Applications Yet</h2>
            <p className="text-gray-600 mb-6">Get started by adding your first cloud application</p>
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
                className="bg-white rounded-xl shadow-lg hover:shadow-2xl transition-shadow cursor-pointer p-6"
                onClick={() => onViewMetrics(app)}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="bg-indigo-100 p-3 rounded-lg">
                      <Server className="text-indigo-600" size={24} />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-800">{app.cloud_name}</h3>
                      <p className="text-sm text-gray-500">{app.region}</p>
                    </div>
                  </div>
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-sm text-gray-600">
                    <Server size={14} className="mr-2" />
                    <span className="font-mono">{app.instance_id}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <MapPin size={14} className="mr-2" />
                    <span>{app.region}</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <button className="w-full flex items-center justify-center space-x-2 text-indigo-600 hover:text-indigo-700 font-semibold">
                    <Activity size={16} />
                    <span>View Metrics</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;