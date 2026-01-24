import React, { useState } from 'react';
import { Cloud, Server, MapPin, Plus } from 'lucide-react';
import { applicationsAPI } from '../services/api';
import Navbar from './Navbar';

const AddApplication = ({ onSuccess, onBack, onLogout }) => {
  const [formData, setFormData] = useState({
    cloud_name: '',
    instance_id: '',
    region: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setError('');
    setLoading(true);

    try {
      await applicationsAPI.create(formData);
      setFormData({ cloud_name: '', instance_id: '', region: '' });
      onSuccess();
    } catch (err) {
      setError('Failed to add application. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Navbar onLogout={onLogout} showAddButton={false} />

      <div className="max-w-2xl mx-auto p-8">
        <button
          onClick={onBack}
          className="mb-6 text-indigo-600 hover:text-indigo-700 font-semibold"
        >
          ← Back to Applications
        </button>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-600 rounded-full mb-4">
              <Plus className="text-white" size={32} />
            </div>
            <h1 className="text-3xl font-bold text-gray-800">Add New Application</h1>
            <p className="text-gray-600 mt-2">Register a new cloud application to monitor</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Cloud size={16} className="inline mr-2" />
                Cloud Provider Name
              </label>
              <input
                type="text"
                value={formData.cloud_name}
                onChange={(e) => setFormData({ ...formData, cloud_name: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                placeholder="AWS, Azure, GCP, etc."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Server size={16} className="inline mr-2" />
                Instance ID
              </label>
              <input
                type="text"
                value={formData.instance_id}
                onChange={(e) => setFormData({ ...formData, instance_id: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                placeholder="i-1234567890abcdef0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <MapPin size={16} className="inline mr-2" />
                Region
              </label>
              <input
                type="text"
                value={formData.region}
                onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                placeholder="us-east-1, eu-west-1, etc."
              />
            </div>

            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition disabled:opacity-50"
            >
              {loading ? 'Adding Application...' : 'Add Application'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddApplication;