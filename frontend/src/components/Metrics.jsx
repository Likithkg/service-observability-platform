import React, { useEffect, useState, useRef } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Activity, Cpu, HardDrive, Network, AlertCircle } from 'lucide-react';
import Navbar from './Navbar';
import { metricsAPI } from '../services/api';


const Metrics = ({ application, onBack, onLogout, isDarkTheme }) => {
  // S3 metrics: bucket_size_bytes, number_of_objects
  const isS3 = application.collector_type === 's3';
  const isLambda = application.collector_type === 'lambda';
  const [currentMetrics, setCurrentMetrics] = useState(
    isS3
      ? { bucket_size_bytes: 0, number_of_objects: 0 }
      : isLambda
        ? {
            invocations: 0,
            errors: 0,
            throttles: 0,
            duration_avg: 0,
            duration_max: 0,
            concurrent_executions: 0
          }
        : { cpu: 0, memory: 0, network: 0, disk: 0 }
  );
  // EC2 metrics
  const [cpuData, setCpuData] = useState([]);
  const [memoryData, setMemoryData] = useState([]);
  const [networkData, setNetworkData] = useState([]);
  const [diskData, setDiskData] = useState([]);
  // S3 metrics
  const [bucketSizeData, setBucketSizeData] = useState([]);
  const [objectCountData, setObjectCountData] = useState([]);
  // Lambda metrics
  const [invocationsData, setInvocationsData] = useState([]);
  const [errorsData, setErrorsData] = useState([]);
  const [throttlesData, setThrottlesData] = useState([]);
  const [durationAvgData, setDurationAvgData] = useState([]);
  const [durationMaxData, setDurationMaxData] = useState([]);
  const [concurrentExecutionsData, setConcurrentExecutionsData] = useState([]);
  const [error, setError] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const eventSourceRef = useRef(null);


  useEffect(() => {
    fetchInitialMetrics();
    connectToStream();
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
    // eslint-disable-next-line
  }, [application.id, application.collector_type]);


  const fetchInitialMetrics = async () => {
    try {
      setIsLoading(true);
      const data = await metricsAPI.getLatest(application.id);
      if (data.formatted) {
        setCurrentMetrics(data.formatted);
        const timestamp = new Date().toLocaleTimeString();
        if (isS3) {
          setBucketSizeData([{ time: timestamp, value: data.formatted.bucket_size_bytes }]);
          setObjectCountData([{ time: timestamp, value: data.formatted.number_of_objects }]);
        } else if (isLambda) {
          setInvocationsData([{ time: timestamp, value: data.formatted.invocations }]);
          setErrorsData([{ time: timestamp, value: data.formatted.errors }]);
          setThrottlesData([{ time: timestamp, value: data.formatted.throttles }]);
          setDurationAvgData([{ time: timestamp, value: data.formatted.duration_avg }]);
          setDurationMaxData([{ time: timestamp, value: data.formatted.duration_max }]);
          setConcurrentExecutionsData([{ time: timestamp, value: data.formatted.concurrent_executions }]);
        } else {
          setCpuData([{ time: timestamp, value: data.formatted.cpu }]);
          setMemoryData([{ time: timestamp, value: data.formatted.memory }]);
          setNetworkData([{ time: timestamp, value: data.formatted.network }]);
          setDiskData([{ time: timestamp, value: data.formatted.disk }]);
        }
        setIsLoading(false);
      } else if (data.message) {
        setIsLoading(true);
      }
    } catch (err) {
      console.error('Error fetching initial metrics:', err);
      setIsLoading(true);
    }
  };


  const connectToStream = () => {
    const token = localStorage.getItem('token');
    const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000';

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
    
        // Calculate combined network for EC2
        if (!isS3 && !isLambda) {
          metrics.network = (metrics.network_in || 0) + (metrics.network_out || 0);
        }

        setCurrentMetrics(metrics);

        const timestamp = new Date().toLocaleTimeString();

        if (isS3) {
          setBucketSizeData(prev => {
            const newData = [...prev, { time: timestamp, value: metrics.bucket_size_bytes || 0 }];
            return newData.slice(-20);
          });
          setObjectCountData(prev => {
            const newData = [...prev, { time: timestamp, value: metrics.number_of_objects || 0 }];
            return newData.slice(-20);
          });
        } else if (isLambda) {
          setInvocationsData(prev => {
            const newData = [...prev, { time: timestamp, value: metrics.invocations || 0 }];
            return newData.slice(-20);
          });
          setErrorsData(prev => {
            const newData = [...prev, { time: timestamp, value: metrics.errors || 0 }];
            return newData.slice(-20);
          });
          setThrottlesData(prev => {
            const newData = [...prev, { time: timestamp, value: metrics.throttles || 0 }];
            return newData.slice(-20);
          });
          setDurationAvgData(prev => {
            const newData = [...prev, { time: timestamp, value: metrics.duration_avg || 0 }];
            return newData.slice(-20);
          });
          setDurationMaxData(prev => {
            const newData = [...prev, { time: timestamp, value: metrics.duration_max || 0 }];
            return newData.slice(-20);
          });
          setConcurrentExecutionsData(prev => {
            const newData = [...prev, { time: timestamp, value: metrics.concurrent_executions || 0 }];
            return newData.slice(-20);
          });
        } else {
          setCpuData(prev => {
            const newData = [...prev, { time: timestamp, value: metrics.cpu || 0 }];
            return newData.slice(-20);
          });
          setMemoryData(prev => {
            const newData = [...prev, { time: timestamp, value: metrics.memory || 0 }];
            return newData.slice(-20);
          });
          setNetworkData(prev => {
            const newData = [...prev, { time: timestamp, value: metrics.network || 0 }];
            return newData.slice(-20);
          });
          setDiskData(prev => {
            const newData = [...prev, { time: timestamp, value: metrics.disk || 0 }];
            return newData.slice(-20);
          });
        }
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
              {isS3 ? (
                <p className={isDarkTheme ? 'text-gray-500' : 'text-gray-500'}>Bucket: {application.bucket_name}</p>
              ) : isLambda ? (
                <p className={isDarkTheme ? 'text-gray-500' : 'text-gray-500'}>Function: {application.function_name}</p>
              ) : (
                <p className={isDarkTheme ? 'text-gray-500' : 'text-gray-500'}>Instance: {application.instance_id}</p>
              )}
              <p className={isDarkTheme ? 'text-gray-500' : 'text-gray-500'}>Region: {application.region}</p>
            </div>
            <div className={`flex items-center space-x-2 ${isConnected ? 'text-green-600' : 'text-gray-400'}`}>
              <Activity size={24} />
              <span className="text-lg font-semibold">
                {isConnected ? 'Live' : isLoading ? 'Loading...' : 'Disconnected'}
              </span>
            </div>
          </div>

          {/* Metrics Cards */}
          {isS3 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className={`rounded-lg p-4 ${isDarkTheme ? 'bg-blue-900' : 'bg-blue-50'}`}>
                <HardDrive className={`mb-2 ${isDarkTheme ? 'text-blue-400' : 'text-blue-600'}`} size={32} />
                <p className={`text-sm ${isDarkTheme ? 'text-gray-400' : 'text-gray-600'}`}>Bucket Size (Bytes)</p>
                <p className={`text-2xl font-bold ${isDarkTheme ? 'text-white' : 'text-gray-800'}`}>
                  {currentMetrics.bucket_size_bytes?.toLocaleString() || 0}
                </p>
              </div>
              <div className={`rounded-lg p-4 ${isDarkTheme ? 'bg-green-900' : 'bg-green-50'}`}>
                <Network className={`mb-2 ${isDarkTheme ? 'text-green-400' : 'text-green-600'}`} size={32} />
                <p className={`text-sm ${isDarkTheme ? 'text-gray-400' : 'text-gray-600'}`}>Number of Objects</p>
                <p className={`text-2xl font-bold ${isDarkTheme ? 'text-white' : 'text-gray-800'}`}>
                  {currentMetrics.number_of_objects?.toLocaleString() || 0}
                </p>
              </div>
            </div>
          ) : isLambda ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className={`rounded-lg p-4 ${isDarkTheme ? 'bg-blue-900' : 'bg-blue-50'}`}>
                <Cpu className={`mb-2 ${isDarkTheme ? 'text-blue-400' : 'text-blue-600'}`} size={32} />
                <p className={`text-sm ${isDarkTheme ? 'text-gray-400' : 'text-gray-600'}`}>Invocations</p>
                <p className={`text-2xl font-bold ${isDarkTheme ? 'text-white' : 'text-gray-800'}`}>
                  {currentMetrics.invocations?.toLocaleString() || 0}
                </p>
              </div>
              <div className={`rounded-lg p-4 ${isDarkTheme ? 'bg-red-900' : 'bg-red-50'}`}>
                <AlertCircle className={`mb-2 ${isDarkTheme ? 'text-red-400' : 'text-red-600'}`} size={32} />
                <p className={`text-sm ${isDarkTheme ? 'text-gray-400' : 'text-gray-600'}`}>Errors</p>
                <p className={`text-2xl font-bold ${isDarkTheme ? 'text-white' : 'text-gray-800'}`}>
                  {currentMetrics.errors?.toLocaleString() || 0}
                </p>
              </div>
              <div className={`rounded-lg p-4 ${isDarkTheme ? 'bg-yellow-900' : 'bg-yellow-50'}`}>
                <Cpu className={`mb-2 ${isDarkTheme ? 'text-yellow-400' : 'text-yellow-600'}`} size={32} />
                <p className={`text-sm ${isDarkTheme ? 'text-gray-400' : 'text-gray-600'}`}>Throttles</p>
                <p className={`text-2xl font-bold ${isDarkTheme ? 'text-white' : 'text-gray-800'}`}>
                  {currentMetrics.throttles?.toLocaleString() || 0}
                </p>
              </div>
              <div className={`rounded-lg p-4 ${isDarkTheme ? 'bg-purple-900' : 'bg-purple-50'}`}>
                <HardDrive className={`mb-2 ${isDarkTheme ? 'text-purple-400' : 'text-purple-600'}`} size={32} />
                <p className={`text-sm ${isDarkTheme ? 'text-gray-400' : 'text-gray-600'}`}>Avg Duration (ms)</p>
                <p className={`text-2xl font-bold ${isDarkTheme ? 'text-white' : 'text-gray-800'}`}>
                  {currentMetrics.duration_avg?.toFixed(1) || 0}
                </p>
              </div>
              <div className={`rounded-lg p-4 ${isDarkTheme ? 'bg-pink-900' : 'bg-pink-50'}`}>
                <HardDrive className={`mb-2 ${isDarkTheme ? 'text-pink-400' : 'text-pink-600'}`} size={32} />
                <p className={`text-sm ${isDarkTheme ? 'text-gray-400' : 'text-gray-600'}`}>Max Duration (ms)</p>
                <p className={`text-2xl font-bold ${isDarkTheme ? 'text-white' : 'text-gray-800'}`}>
                  {currentMetrics.duration_max?.toFixed(1) || 0}
                </p>
              </div>
              <div className={`rounded-lg p-4 ${isDarkTheme ? 'bg-green-900' : 'bg-green-50'}`}>
                <Network className={`mb-2 ${isDarkTheme ? 'text-green-400' : 'text-green-600'}`} size={32} />
                <p className={`text-sm ${isDarkTheme ? 'text-gray-400' : 'text-gray-600'}`}>Concurrent Executions</p>
                <p className={`text-2xl font-bold ${isDarkTheme ? 'text-white' : 'text-gray-800'}`}>
                  {currentMetrics.concurrent_executions?.toLocaleString() || 0}
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className={`rounded-lg p-4 ${isDarkTheme ? 'bg-blue-900' : 'bg-blue-50'}`}>
                <Cpu className={`mb-2 ${isDarkTheme ? 'text-blue-400' : 'text-blue-600'}`} size={32} />
                <p className={`text-sm ${isDarkTheme ? 'text-gray-400' : 'text-gray-600'}`}>CPU Usage</p>
                <p className={`text-2xl font-bold ${isDarkTheme ? 'text-white' : 'text-gray-800'}`}>
                  {currentMetrics.cpu?.toFixed(1) || 0}%
                </p>
              </div>
              <div className={`rounded-lg p-4 ${isDarkTheme ? 'bg-green-900' : 'bg-green-50'}`}>
                <HardDrive className={`mb-2 ${isDarkTheme ? 'text-green-400' : 'text-green-600'}`} size={32} />
                <p className={`text-sm ${isDarkTheme ? 'text-gray-400' : 'text-gray-600'}`}>Memory Usage</p>
                <p className={`text-2xl font-bold ${isDarkTheme ? 'text-white' : 'text-gray-800'}`}>
                  {currentMetrics.memory?.toFixed(1) || 0}%
                </p>
              </div>
              <div className={`rounded-lg p-4 ${isDarkTheme ? 'bg-purple-900' : 'bg-purple-50'}`}>
                <Network className={`mb-2 ${isDarkTheme ? 'text-purple-400' : 'text-purple-600'}`} size={32} />
                <p className={`text-sm ${isDarkTheme ? 'text-gray-400' : 'text-gray-600'}`}>Network (KB/s)</p>
                <p className={`text-2xl font-bold ${isDarkTheme ? 'text-white' : 'text-gray-800'}`}>
                  {currentMetrics.network?.toFixed(2) || 0}
                </p>
              </div>
              <div className={`rounded-lg p-4 ${isDarkTheme ? 'bg-orange-900' : 'bg-orange-50'}`}>
                <HardDrive className={`mb-2 ${isDarkTheme ? 'text-orange-400' : 'text-orange-600'}`} size={32} />
                <p className={`text-sm ${isDarkTheme ? 'text-gray-400' : 'text-gray-600'}`}>Disk Usage</p>
                <p className={`text-2xl font-bold ${isDarkTheme ? 'text-white' : 'text-gray-800'}`}>
                  {currentMetrics.disk?.toFixed(1) || 0}%
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Graphs Grid */}
        {isS3 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Bucket Size Graph */}
            <div className={`rounded-2xl shadow-xl p-6 ${isDarkTheme ? 'bg-gray-800' : 'bg-white'}`}>
              <h2 className={`text-xl font-bold mb-4 flex items-center ${isDarkTheme ? 'text-white' : 'text-gray-800'}`}>
                <HardDrive className="text-blue-600 mr-2" size={24} />
                Bucket Size Over Time
              </h2>
              {bucketSizeData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={bucketSizeData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={isDarkTheme ? '#444' : '#ccc'} />
                    <XAxis dataKey="time" stroke={isDarkTheme ? '#999' : '#666'} />
                    <YAxis stroke={isDarkTheme ? '#999' : '#666'} />
                    <Tooltip contentStyle={{backgroundColor: isDarkTheme ? '#333' : '#fff', border: `1px solid ${isDarkTheme ? '#555' : '#ccc'}`}} formatter={(value) => `${value.toLocaleString()} bytes`} />
                    <Legend />
                    <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} name="Bucket Size (bytes)" />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <p className={isDarkTheme ? 'text-gray-400' : 'text-gray-500'}>No data available</p>
              )}
            </div>
            {/* Number of Objects Graph */}
            <div className={`rounded-2xl shadow-xl p-6 ${isDarkTheme ? 'bg-gray-800' : 'bg-white'}`}>
              <h2 className={`text-xl font-bold mb-4 flex items-center ${isDarkTheme ? 'text-white' : 'text-gray-800'}`}>
                <Network className="text-green-600 mr-2" size={24} />
                Number of Objects Over Time
              </h2>
              {objectCountData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={objectCountData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={isDarkTheme ? '#444' : '#ccc'} />
                    <XAxis dataKey="time" stroke={isDarkTheme ? '#999' : '#666'} />
                    <YAxis stroke={isDarkTheme ? '#999' : '#666'} />
                    <Tooltip contentStyle={{backgroundColor: isDarkTheme ? '#333' : '#fff', border: `1px solid ${isDarkTheme ? '#555' : '#ccc'}`}} formatter={(value) => `${value.toLocaleString()} objects`} />
                    <Legend />
                    <Line type="monotone" dataKey="value" stroke="#10b981" strokeWidth={2} name="Number of Objects" />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <p className={isDarkTheme ? 'text-gray-400' : 'text-gray-500'}>No data available</p>
              )}
            </div>
          </div>
        ) : isLambda ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Invocations Graph */}
            <div className={`rounded-2xl shadow-xl p-6 ${isDarkTheme ? 'bg-gray-800' : 'bg-white'}`}>
              <h2 className={`text-xl font-bold mb-4 flex items-center ${isDarkTheme ? 'text-white' : 'text-gray-800'}`}>
                <Cpu className="text-blue-600 mr-2" size={24} />
                Invocations Over Time
              </h2>
              {invocationsData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={invocationsData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={isDarkTheme ? '#444' : '#ccc'} />
                    <XAxis dataKey="time" stroke={isDarkTheme ? '#999' : '#666'} />
                    <YAxis stroke={isDarkTheme ? '#999' : '#666'} />
                    <Tooltip contentStyle={{backgroundColor: isDarkTheme ? '#333' : '#fff', border: `1px solid ${isDarkTheme ? '#555' : '#ccc'}`}} formatter={(value) => `${value.toLocaleString()} invocations`} />
                    <Legend />
                    <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} name="Invocations" />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <p className={isDarkTheme ? 'text-gray-400' : 'text-gray-500'}>No data available</p>
              )}
            </div>
            {/* Errors Graph */}
            <div className={`rounded-2xl shadow-xl p-6 ${isDarkTheme ? 'bg-gray-800' : 'bg-white'}`}>
              <h2 className={`text-xl font-bold mb-4 flex items-center ${isDarkTheme ? 'text-white' : 'text-gray-800'}`}>
                <AlertCircle className="text-red-600 mr-2" size={24} />
                Errors Over Time
              </h2>
              {errorsData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={errorsData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={isDarkTheme ? '#444' : '#ccc'} />
                    <XAxis dataKey="time" stroke={isDarkTheme ? '#999' : '#666'} />
                    <YAxis stroke={isDarkTheme ? '#999' : '#666'} />
                    <Tooltip contentStyle={{backgroundColor: isDarkTheme ? '#333' : '#fff', border: `1px solid ${isDarkTheme ? '#555' : '#ccc'}`}} formatter={(value) => `${value.toLocaleString()} errors`} />
                    <Legend />
                    <Line type="monotone" dataKey="value" stroke="#ef4444" strokeWidth={2} name="Errors" />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <p className={isDarkTheme ? 'text-gray-400' : 'text-gray-500'}>No data available</p>
              )}
            </div>
            {/* Throttles Graph */}
            <div className={`rounded-2xl shadow-xl p-6 ${isDarkTheme ? 'bg-gray-800' : 'bg-white'}`}>
              <h2 className={`text-xl font-bold mb-4 flex items-center ${isDarkTheme ? 'text-white' : 'text-gray-800'}`}>
                <Cpu className="text-yellow-600 mr-2" size={24} />
                Throttles Over Time
              </h2>
              {throttlesData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={throttlesData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={isDarkTheme ? '#444' : '#ccc'} />
                    <XAxis dataKey="time" stroke={isDarkTheme ? '#999' : '#666'} />
                    <YAxis stroke={isDarkTheme ? '#999' : '#666'} />
                    <Tooltip contentStyle={{backgroundColor: isDarkTheme ? '#333' : '#fff', border: `1px solid ${isDarkTheme ? '#555' : '#ccc'}`}} formatter={(value) => `${value.toLocaleString()} throttles`} />
                    <Legend />
                    <Line type="monotone" dataKey="value" stroke="#eab308" strokeWidth={2} name="Throttles" />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <p className={isDarkTheme ? 'text-gray-400' : 'text-gray-500'}>No data available</p>
              )}
            </div>
            {/* Duration Avg Graph */}
            <div className={`rounded-2xl shadow-xl p-6 ${isDarkTheme ? 'bg-gray-800' : 'bg-white'}`}>
              <h2 className={`text-xl font-bold mb-4 flex items-center ${isDarkTheme ? 'text-white' : 'text-gray-800'}`}>
                <HardDrive className="text-purple-600 mr-2" size={24} />
                Avg Duration Over Time (ms)
              </h2>
              {durationAvgData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={durationAvgData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={isDarkTheme ? '#444' : '#ccc'} />
                    <XAxis dataKey="time" stroke={isDarkTheme ? '#999' : '#666'} />
                    <YAxis stroke={isDarkTheme ? '#999' : '#666'} />
                    <Tooltip contentStyle={{backgroundColor: isDarkTheme ? '#333' : '#fff', border: `1px solid ${isDarkTheme ? '#555' : '#ccc'}`}} formatter={(value) => `${value.toFixed(1)} ms`} />
                    <Legend />
                    <Line type="monotone" dataKey="value" stroke="#a21caf" strokeWidth={2} name="Avg Duration (ms)" />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <p className={isDarkTheme ? 'text-gray-400' : 'text-gray-500'}>No data available</p>
              )}
            </div>
            {/* Duration Max Graph */}
            <div className={`rounded-2xl shadow-xl p-6 ${isDarkTheme ? 'bg-gray-800' : 'bg-white'}`}>
              <h2 className={`text-xl font-bold mb-4 flex items-center ${isDarkTheme ? 'text-white' : 'text-gray-800'}`}>
                <HardDrive className="text-pink-600 mr-2" size={24} />
                Max Duration Over Time (ms)
              </h2>
              {durationMaxData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={durationMaxData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={isDarkTheme ? '#444' : '#ccc'} />
                    <XAxis dataKey="time" stroke={isDarkTheme ? '#999' : '#666'} />
                    <YAxis stroke={isDarkTheme ? '#999' : '#666'} />
                    <Tooltip contentStyle={{backgroundColor: isDarkTheme ? '#333' : '#fff', border: `1px solid ${isDarkTheme ? '#555' : '#ccc'}`}} formatter={(value) => `${value.toFixed(1)} ms`} />
                    <Legend />
                    <Line type="monotone" dataKey="value" stroke="#ec4899" strokeWidth={2} name="Max Duration (ms)" />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <p className={isDarkTheme ? 'text-gray-400' : 'text-gray-500'}>No data available</p>
              )}
            </div>
            {/* Concurrent Executions Graph */}
            <div className={`rounded-2xl shadow-xl p-6 ${isDarkTheme ? 'bg-gray-800' : 'bg-white'}`}>
              <h2 className={`text-xl font-bold mb-4 flex items-center ${isDarkTheme ? 'text-white' : 'text-gray-800'}`}>
                <Network className="text-green-600 mr-2" size={24} />
                Concurrent Executions Over Time
              </h2>
              {concurrentExecutionsData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={concurrentExecutionsData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={isDarkTheme ? '#444' : '#ccc'} />
                    <XAxis dataKey="time" stroke={isDarkTheme ? '#999' : '#666'} />
                    <YAxis stroke={isDarkTheme ? '#999' : '#666'} />
                    <Tooltip contentStyle={{backgroundColor: isDarkTheme ? '#333' : '#fff', border: `1px solid ${isDarkTheme ? '#555' : '#ccc'}`}} formatter={(value) => `${value.toLocaleString()} executions`} />
                    <Legend />
                    <Line type="monotone" dataKey="value" stroke="#10b981" strokeWidth={2} name="Concurrent Executions" />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <p className={isDarkTheme ? 'text-gray-400' : 'text-gray-500'}>No data available</p>
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* CPU Usage Graph */}
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
                    <YAxis stroke={isDarkTheme ? '#999' : '#666'} />
                    <Tooltip contentStyle={{backgroundColor: isDarkTheme ? '#333' : '#fff', border: `1px solid ${isDarkTheme ? '#555' : '#ccc'}`}} formatter={(value) => `${value.toFixed(1)}%`} />
                    <Legend />
                    <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} name="CPU %" />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <p className={isDarkTheme ? 'text-gray-400' : 'text-gray-500'}>No data available</p>
              )}
            </div>

            {/* Memory Usage Graph */}
            <div className={`rounded-2xl shadow-xl p-6 ${isDarkTheme ? 'bg-gray-800' : 'bg-white'}`}>
              <h2 className={`text-xl font-bold mb-4 flex items-center ${isDarkTheme ? 'text-white' : 'text-gray-800'}`}>
                <HardDrive className="text-green-600 mr-2" size={24} />
                Memory Usage Over Time
              </h2>
              {memoryData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={memoryData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={isDarkTheme ? '#444' : '#ccc'} />
                    <XAxis dataKey="time" stroke={isDarkTheme ? '#999' : '#666'} />
                    <YAxis stroke={isDarkTheme ? '#999' : '#666'} />
                    <Tooltip contentStyle={{backgroundColor: isDarkTheme ? '#333' : '#fff', border: `1px solid ${isDarkTheme ? '#555' : '#ccc'}`}} formatter={(value) => `${value.toFixed(1)}%`} />
                    <Legend />
                    <Line type="monotone" dataKey="value" stroke="#10b981" strokeWidth={2} name="Memory %" />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <p className={isDarkTheme ? 'text-gray-400' : 'text-gray-500'}>No data available</p>
              )}
            </div>

            {/* Network Usage Graph */}
            <div className={`rounded-2xl shadow-xl p-6 ${isDarkTheme ? 'bg-gray-800' : 'bg-white'}`}>
              <h2 className={`text-xl font-bold mb-4 flex items-center ${isDarkTheme ? 'text-white' : 'text-gray-800'}`}>
                <Network className="text-purple-600 mr-2" size={24} />
                Network Usage Over Time
              </h2>
              {networkData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={networkData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={isDarkTheme ? '#444' : '#ccc'} />
                    <XAxis dataKey="time" stroke={isDarkTheme ? '#999' : '#666'} />
                    <YAxis stroke={isDarkTheme ? '#999' : '#666'} />
                    <Tooltip contentStyle={{backgroundColor: isDarkTheme ? '#333' : '#fff', border: `1px solid ${isDarkTheme ? '#555' : '#ccc'}`}} formatter={(value) => `${value.toFixed(2)} KB/s`} />
                    <Legend />
                    <Line type="monotone" dataKey="value" stroke="#a21caf" strokeWidth={2} name="Network KB/s" />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <p className={isDarkTheme ? 'text-gray-400' : 'text-gray-500'}>No data available</p>
              )}
            </div>

            {/* Disk Usage Graph */}
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
                    <YAxis stroke={isDarkTheme ? '#999' : '#666'} />
                    <Tooltip contentStyle={{backgroundColor: isDarkTheme ? '#333' : '#fff', border: `1px solid ${isDarkTheme ? '#555' : '#ccc'}`}} formatter={(value) => `${value.toFixed(1)}%`} />
                    <Legend />
                    <Line type="monotone" dataKey="value" stroke="#f97316" strokeWidth={2} name="Disk %" />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <p className={isDarkTheme ? 'text-gray-400' : 'text-gray-500'}>No data available</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Metrics;