import React, { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { Activity, Cpu, HardDrive, Network, TrendingUp } from 'lucide-react';
import Navbar from './Navbar';

const generateMetricsData = () => {
  const hours = 24;
  return Array.from({ length: hours }, (_, i) => ({
    time: `${i}:00`,
    cpu: Math.random() * 80 + 10,
    memory: Math.random() * 70 + 20,
    network: Math.random() * 100,
    requests: Math.floor(Math.random() * 1000) + 100
  }));
};

const Metrics = ({ application, onBack, onLogout }) => {
  const [metricsData, setMetricsData] = useState([]);

  useEffect(() => {
    setMetricsData(generateMetricsData());
  }, [application]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Navbar onLogout={onLogout} showAddButton={false} />

      <div className="max-w-7xl mx-auto p-8">
        <button
          onClick={onBack}
          className="mb-6 text-indigo-600 hover:text-indigo-700 font-semibold"
        >
          ← Back to Applications
        </button>

        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">{application.cloud_name}</h1>
              <p className="text-gray-600 mt-2">Instance: {application.instance_id}</p>
              <p className="text-gray-500">Region: {application.region}</p>
            </div>
            <div className="flex items-center space-x-2 text-green-600">
              <Activity size={24} />
              <span className="text-lg font-semibold">Active</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <Cpu className="text-blue-600" size={32} />
                <TrendingUp className="text-green-500" size={20} />
              </div>
              <p className="text-sm text-gray-600 mt-2">CPU Usage</p>
              <p className="text-2xl font-bold text-gray-800">45.2%</p>
            </div>

            <div className="bg-purple-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <HardDrive className="text-purple-600" size={32} />
                <TrendingUp className="text-green-500" size={20} />
              </div>
              <p className="text-sm text-gray-600 mt-2">Memory Usage</p>
              <p className="text-2xl font-bold text-gray-800">62.8%</p>
            </div>

            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <Network className="text-green-600" size={32} />
                <TrendingUp className="text-green-500" size={20} />
              </div>
              <p className="text-sm text-gray-600 mt-2">Network I/O</p>
              <p className="text-2xl font-bold text-gray-800">234 MB/s</p>
            </div>

            <div className="bg-orange-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <Activity className="text-orange-600" size={32} />
                <TrendingUp className="text-green-500" size={20} />
              </div>
              <p className="text-sm text-gray-600 mt-2">Requests/min</p>
              <p className="text-2xl font-bold text-gray-800">1,247</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">CPU & Memory Usage</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={metricsData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="cpu" stroke="#3b82f6" strokeWidth={2} name="CPU %" />
                <Line type="monotone" dataKey="memory" stroke="#8b5cf6" strokeWidth={2} name="Memory %" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Network Traffic</h2>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={metricsData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Area type="monotone" dataKey="network" stroke="#10b981" fill="#10b98133" name="Network MB/s" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-6 lg:col-span-2">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Request Rate</h2>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={metricsData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Area type="monotone" dataKey="requests" stroke="#f59e0b" fill="#f59e0b33" name="Requests" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Metrics;