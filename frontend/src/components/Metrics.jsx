import React, { useEffect, useState, useRef } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Activity, Cpu, HardDrive, Network, AlertCircle } from 'lucide-react';
import Navbar from './Navbar';
import { metricsAPI } from '../services/api';

const Metrics = ({ application, onBack, onLogout, isDarkTheme }) => {
  const [currentMetrics, setCurrentMetrics] = useState({
    cpu: 0,
    memory: 0,
    network: 0,
    disk: 0
  });
  const [cpuData, setCpuData] = useState([]);
  const [memoryData, setMemoryData] = useState([]);
  const [networkData, setNetworkData] = useState([]);
  const [diskData, setDiskData] = useState([]);
  const [error, setError] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const eventSourceRef = useRef(null);

  useEffect(() => {
    // Fetch initial metrics immediately
    fetchInitialMetrics();
    
    // Connect to real-time stream
    connectToStream();
    
    return () => {
      // Cleanup on unmount
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, [application.id]);

  const fetchInitialMetrics = async () => {
    try {
      setIsLoading(true);
      const data = await metricsAPI.getLatest(application.id);
      
      if (data.formatted) {
        setCurrentMetrics(data.formatted);
        
        // Initialize with first data point
        const timestamp = new Date().toLocaleTimeString();
        setCpuData([{ time: timestamp, value: data.formatted.cpu }]);
        setMemoryData([{ time: timestamp, value: data.formatted.memory }]);
        setNetworkData([{ time: timestamp, value: data.formatted.network }]);
        setDiskData([{ time: timestamp, value: data.formatted.disk }]);
        
        setIsLoading(false);
      } else if (data.message) {
        // No metrics available yet, but that's ok - show loading and wait for stream
        console.log('Waiting for first metrics from poller...');
        setIsLoading(true);
      }
    } catch (err) {
      console.error('Error fetching initial metrics:', err);
      // Don't fail completely - still try to connect to stream
      setIsLoading(true);
    }
  };

  const connectToStream = () => {
    const token = localStorage.getItem('token');
    const API_BASE = import.meta.env.VITE_API_BASE;

  const eventSource = new EventSource(
    `${API_BASE}/metrics/${application.id}/realtime?token=${token}`
  );


    eventSource.onopen = () => {
      console.log('Connected to metrics stream');
      setIsConnected(true);
      setError('');
    };

    eventSource.onmessage = (event) => {
      try {
        const metrics = JSON.parse(event.data);
        
        // Update current metrics
        setCurrentMetrics({
          cpu: metrics.cpu || 0,
          memory: metrics.memory || 0,
          network: (metrics.network_in || 0) + (metrics.network_out || 0),
          disk: metrics.disk || 0
        });

        // Add to historical data (keep last 20 points)
        const timestamp = new Date().toLocaleTimeString();
        
        setCpuData(prev => {
          const newData = [...prev, { time: timestamp, value: metrics.cpu || 0 }];
          return newData.slice(-20);
        });

        setMemoryData(prev => {
          const newData = [...prev, { time: timestamp, value: metrics.memory || 0 }];
          return newData.slice(-20);
        });

        setNetworkData(prev => {
          const newData = [...prev, { time: timestamp, value: (metrics.network_in || 0) + (metrics.network_out || 0) }];
          return newData.slice(-20);
        });

        setDiskData(prev => {
          const newData = [...prev, { time: timestamp, value: metrics.disk || 0 }];
          return newData.slice(-20);
        });

      } catch (err) {
        console.error('Error parsing metrics:', err);
      }
    };

    eventSource.onerror = (err) => {
      console.error('EventSource error:', err);
      setIsConnected(false);
      setError('Connection to metrics stream lost. Reconnecting...');
      eventSource.close();
      
      // Attempt to reconnect after 5 seconds
      setTimeout(connectToStream, 5000);
    };

    eventSourceRef.current = eventSource;
  };

  return (
    <div className={`min-h-screen ${isDarkTheme ? 'bg-gray-900' : 'bg-gradient-to-br from-blue-50 to-indigo-100'}`}>
      <Navbar onLogout={onLogout} showAddButton={false} isDarkTheme={isDarkTheme} />

      <div className="max-w-7xl mx-auto p-8">
        <button
          onClick={onBack}
          className={`mb-6 font-semibold ${isDarkTheme ? 'text-indigo-400 hover:text-indigo-300' : 'text-indigo-600 hover:text-indigo-700'}`}
        >
          ← Back to Applications
        </button>

        {error && (
          <div className={`border text-red-700 px-4 py-3 rounded-lg mb-4 flex items-center ${isDarkTheme ? 'bg-red-900 border-red-700' : 'bg-red-50 border-red-200'}`}>
            <AlertCircle size={20} className="mr-2" />
            {error}
          </div>
        )}

        {isLoading && !isConnected && (
          <div className={`border text-blue-700 px-4 py-3 rounded-lg mb-4 flex items-center ${isDarkTheme ? 'bg-blue-900 border-blue-700' : 'bg-blue-50 border-blue-200'}`}>
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-700 mr-2"></div>
            Loading metrics... This may take a moment while the system collects initial data.
          </div>
        )}

        <div className={`rounded-2xl shadow-xl p-8 mb-6 ${isDarkTheme ? 'bg-gray-800' : 'bg-white'}`}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className={`text-3xl font-bold ${isDarkTheme ? 'text-white' : 'text-gray-800'}`}>{application.name}</h1>
              <p className={`mt-2 ${isDarkTheme ? 'text-gray-400' : 'text-gray-600'}`}>Cloud: {application.cloud}</p>
              <p className={isDarkTheme ? 'text-gray-500' : 'text-gray-500'}>Instance: {application.instance_id}</p>
              <p className={isDarkTheme ? 'text-gray-500' : 'text-gray-500'}>Region: {application.region}</p>
            </div>
            <div className={`flex items-center space-x-2 ${isConnected ? 'text-green-600' : 'text-gray-400'}`}>
              <Activity size={24} />
              <span className="text-lg font-semibold">
                {isConnected ? 'Live' : isLoading ? 'Loading...' : 'Disconnected'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className={`rounded-lg p-4 ${isDarkTheme ? 'bg-blue-900' : 'bg-blue-50'}`}>
              <Cpu className={`mb-2 ${isDarkTheme ? 'text-blue-400' : 'text-blue-600'}`} size={32} />
              <p className={`text-sm ${isDarkTheme ? 'text-gray-400' : 'text-gray-600'}`}>CPU Usage</p>
              <p className={`text-2xl font-bold ${isDarkTheme ? 'text-white' : 'text-gray-800'}`}>
                {currentMetrics.cpu.toFixed(1)}%
              </p>
            </div>

            <div className={`rounded-lg p-4 ${isDarkTheme ? 'bg-purple-900' : 'bg-purple-50'}`}>
              <HardDrive className={`mb-2 ${isDarkTheme ? 'text-purple-400' : 'text-purple-600'}`} size={32} />
              <p className={`text-sm ${isDarkTheme ? 'text-gray-400' : 'text-gray-600'}`}>Memory Usage</p>
              <p className={`text-2xl font-bold ${isDarkTheme ? 'text-white' : 'text-gray-800'}`}>
                {currentMetrics.memory.toFixed(1)}%
              </p>
            </div>

            <div className={`rounded-lg p-4 ${isDarkTheme ? 'bg-green-900' : 'bg-green-50'}`}>
              <Network className={`mb-2 ${isDarkTheme ? 'text-green-400' : 'text-green-600'}`} size={32} />
              <p className={`text-sm ${isDarkTheme ? 'text-gray-400' : 'text-gray-600'}`}>Network I/O</p>
              <p className={`text-2xl font-bold ${isDarkTheme ? 'text-white' : 'text-gray-800'}`}>
                {currentMetrics.network.toFixed(1)} MB/s
              </p>
            </div>

            <div className={`rounded-lg p-4 ${isDarkTheme ? 'bg-orange-900' : 'bg-orange-50'}`}>
              <HardDrive className={`mb-2 ${isDarkTheme ? 'text-orange-400' : 'text-orange-600'}`} size={32} />
              <p className={`text-sm ${isDarkTheme ? 'text-gray-400' : 'text-gray-600'}`}>Disk Usage</p>
              <p className={`text-2xl font-bold ${isDarkTheme ? 'text-white' : 'text-gray-800'}`}>
                {currentMetrics.disk.toFixed(1)}%
              </p>
            </div>
          </div>
        </div>

        {/* Graphs Grid - 2 columns on desktop, 1 on mobile */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* CPU Graph */}
          <div className={`rounded-2xl shadow-xl p-6 ${isDarkTheme ? 'bg-gray-800' : 'bg-white'}`}>
            <h2 className={`text-xl font-bold mb-4 flex items-center ${isDarkTheme ? 'text-white' : 'text-gray-800'}`}>
              <Cpu className="text-blue-600 mr-2" size={24} />
              CPU Usage Over Time
            </h2>
            {cpuData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={cpuData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={isDarkTheme ? '#444' : '#ccc'} />
                  <XAxis dataKey="time" stroke={isDarkTheme ? '#999' : '#666'} />
                  <YAxis domain={[0, 100]} stroke={isDarkTheme ? '#999' : '#666'} />
                  <Tooltip contentStyle={{backgroundColor: isDarkTheme ? '#333' : '#fff', border: `1px solid ${isDarkTheme ? '#555' : '#ccc'}`}} formatter={(value) => `${value.toFixed(1)}%`} />
                  <Legend />
                  <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} name="CPU %" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className={isDarkTheme ? 'text-gray-400' : 'text-gray-500'}>No data available</p>
            )}
          </div>

          {/* Memory Graph */}
          <div className={`rounded-2xl shadow-xl p-6 ${isDarkTheme ? 'bg-gray-800' : 'bg-white'}`}>
            <h2 className={`text-xl font-bold mb-4 flex items-center ${isDarkTheme ? 'text-white' : 'text-gray-800'}`}>
              <HardDrive className="text-purple-600 mr-2" size={24} />
              Memory Usage Over Time
            </h2>
            {memoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={memoryData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={isDarkTheme ? '#444' : '#ccc'} />
                  <XAxis dataKey="time" stroke={isDarkTheme ? '#999' : '#666'} />
                  <YAxis domain={[0, 100]} stroke={isDarkTheme ? '#999' : '#666'} />
                  <Tooltip contentStyle={{backgroundColor: isDarkTheme ? '#333' : '#fff', border: `1px solid ${isDarkTheme ? '#555' : '#ccc'}`}} formatter={(value) => `${value.toFixed(1)}%`} />
                  <Legend />
                  <Line type="monotone" dataKey="value" stroke="#8b5cf6" strokeWidth={2} name="Memory %" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className={isDarkTheme ? 'text-gray-400' : 'text-gray-500'}>No data available</p>
            )}
          </div>

          {/* Network Graph */}
          <div className={`rounded-2xl shadow-xl p-6 ${isDarkTheme ? 'bg-gray-800' : 'bg-white'}`}>
            <h2 className={`text-xl font-bold mb-4 flex items-center ${isDarkTheme ? 'text-white' : 'text-gray-800'}`}>
              <Network className="text-green-600 mr-2" size={24} />
              Network I/O Over Time
            </h2>
            {networkData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={networkData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={isDarkTheme ? '#444' : '#ccc'} />
                  <XAxis dataKey="time" stroke={isDarkTheme ? '#999' : '#666'} />
                  <YAxis stroke={isDarkTheme ? '#999' : '#666'} />
                  <Tooltip contentStyle={{backgroundColor: isDarkTheme ? '#333' : '#fff', border: `1px solid ${isDarkTheme ? '#555' : '#ccc'}`}} formatter={(value) => `${value.toFixed(2)} MB/s`} />
                  <Legend />
                  <Line type="monotone" dataKey="value" stroke="#10b981" strokeWidth={2} name="Network MB/s" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className={isDarkTheme ? 'text-gray-400' : 'text-gray-500'}>No data available</p>
            )}
          </div>

          {/* Disk Graph */}
          <div className={`rounded-2xl shadow-xl p-6 ${isDarkTheme ? 'bg-gray-800' : 'bg-white'}`}>
            <h2 className={`text-xl font-bold mb-4 flex items-center ${isDarkTheme ? 'text-white' : 'text-gray-800'}`}>
              <HardDrive className="text-orange-600 mr-2" size={24} />
              Disk Usage Over Time
            </h2>
            {diskData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={diskData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={isDarkTheme ? '#444' : '#ccc'} />
                  <XAxis dataKey="time" stroke={isDarkTheme ? '#999' : '#666'} />
                  <YAxis domain={[0, 100]} stroke={isDarkTheme ? '#999' : '#666'} />
                  <Tooltip contentStyle={{backgroundColor: isDarkTheme ? '#333' : '#fff', border: `1px solid ${isDarkTheme ? '#555' : '#ccc'}`}} formatter={(value) => `${value.toFixed(1)}%`} />
                  <Legend />
                  <Line type="monotone" dataKey="value" stroke="#f59e0b" strokeWidth={2} name="Disk %" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className={isDarkTheme ? 'text-gray-400' : 'text-gray-500'}>No data available</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Metrics;
