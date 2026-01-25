import React, { useState } from 'react';
import { Cloud, Server, MapPin, Database, Tag, Key } from 'lucide-react';
import { applicationsAPI } from '../services/api';
import Navbar from './Navbar';

const AddApplication = ({ onSuccess, onBack, onLogout }) => {
  const [formData, setFormData] = useState({
    name: '',
    collector_type: 'cloud',
    cloud: '',
    region: '',
    instance_id: '',
    aws_access_key_id: '',
    aws_secret_access_key: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSecretKey, setShowSecretKey] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleSubmit = async () => {
    // Validate required fields
    if (!formData.name || !formData.collector_type || !formData.cloud || !formData.region || !formData.instance_id) {
      setError('Please fill in all required fields');
      return;
    }

    setError('');
    setLoading(true);

    try {
      await applicationsAPI.create(formData);
      setFormData({ 
        name: '',
        collector_type: 'cloud',
        cloud: '', 
        region: '', 
        instance_id: '',
        aws_access_key_id: '',
        aws_secret_access_key: ''
      });
      onSuccess();
    } catch (err) {
      setError(err.message || 'Failed to add application. Please try again.');
      console.error('Error creating application:', err);
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
              <Database className="text-white" size={32} />
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
                <Tag size={16} className="inline mr-2" />
                Application Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                placeholder="My Application"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Database size={16} className="inline mr-2" />
                Collector Type *
              </label>
              <select
                value={formData.collector_type}
                onChange={(e) => setFormData({ ...formData, collector_type: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
              >
                <option value="cloud">Cloud</option>
                <option value="http">HTTP</option>
                <option value="agent">Agent</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Cloud size={16} className="inline mr-2" />
                Cloud Provider *
              </label>
              <input
                type="text"
                value={formData.cloud}
                onChange={(e) => setFormData({ ...formData, cloud: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                placeholder="AWS, Azure, GCP, etc."
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <MapPin size={16} className="inline mr-2" />
                Region *
              </label>
              <input
                type="text"
                value={formData.region}
                onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                placeholder="us-east-1, eu-west-1, etc."
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Server size={16} className="inline mr-2" />
                Instance ID *
              </label>
              <input
                type="text"
                value={formData.instance_id}
                onChange={(e) => setFormData({ ...formData, instance_id: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                placeholder="i-1234567890abcdef0"
                required
              />
            </div>

            {/* Advanced AWS Credentials Section */}
            <div className="border-t pt-6">
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="flex items-center text-indigo-600 hover:text-indigo-700 font-semibold"
              >
                <Key size={16} className="mr-2" />
                {showAdvanced ? 'Hide' : 'Add'} AWS Credentials (Optional)
              </button>

              {showAdvanced && (
                <div className="mt-4 p-4 bg-blue-50 rounded-lg space-y-4">
                  <p className="text-sm text-gray-600">
                    You can add AWS credentials now or update them later. Credentials will be encrypted and securely stored.
                  </p>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      AWS Access Key ID
                    </label>
                    <input
                      type="password"
                      value={formData.aws_access_key_id}
                      onChange={(e) => setFormData({ ...formData, aws_access_key_id: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                      placeholder="AKIA..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      AWS Secret Access Key
                    </label>
                    <div className="relative">
                      <input
                        type={showSecretKey ? 'text' : 'password'}
                        value={formData.aws_secret_access_key}
                        onChange={(e) => setFormData({ ...formData, aws_secret_access_key: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition pr-10"
                        placeholder="Enter your secret access key"
                      />
                      <button
                        type="button"
                        onClick={() => setShowSecretKey(!showSecretKey)}
                        className="absolute right-3 top-2 text-gray-600 hover:text-gray-800"
                      >
                        {showSecretKey ? '👁️' : '👁️‍🗨️'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
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
