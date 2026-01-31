import React, { useState } from 'react';
import { CLOUDS } from '../utils/clouds';
import { Cloud, Server, MapPin, Database, Tag, Key } from 'lucide-react';
import { applicationsAPI } from '../services/api';
import Navbar from './Navbar';

const AddApplication = ({ onSuccess, onBack, onLogout }) => {
  const [formData, setFormData] = useState({
    name: '',
    cloud: '',
    collector_type: '',
    region: '',
    instance_id: '',
    bucket_name: '',
    function_name: '',
    aws_access_key_id: '',
    aws_secret_access_key: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSecretKey, setShowSecretKey] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleSubmit = async () => {
    // Validate required fields
    if (!formData.name || !formData.cloud || !formData.collector_type || !formData.region) {
      setError('Please fill in all required fields');
      return;
    }
    // For EC2, instance_id is required; for S3, bucket_name is required; for Lambda, function_name is required
    if (formData.collector_type === 'ec2' && !formData.instance_id) {
      setError('Instance ID is required for EC2');
      return;
    }
    if (formData.collector_type === 's3' && !formData.bucket_name) {
      setError('Bucket name is required for S3');
      return;
    }
    if (formData.collector_type === 'lambda' && !formData.function_name) {
      setError('Function name is required for Lambda');
      return;
    }

    setError('');
    setLoading(true);

    try {
      await applicationsAPI.create(formData);
      setFormData({
        name: '',
        cloud: '',
        collector_type: '',
        region: '',
        instance_id: '',
        bucket_name: '',
        function_name: '',
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


            {/* Cloud Provider Dropdown */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Cloud size={16} className="inline mr-2" />
                Cloud Provider *
              </label>
              <select
                value={formData.cloud}
                onChange={e => {
                  const selectedCloud = e.target.value;
                  setFormData({
                    ...formData,
                    cloud: selectedCloud,
                    collector_type: '', // reset collector type when cloud changes
                    instance_id: '',
                    bucket_name: '',
                    function_name: ''
                  });
                }}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                required
              >
                <option value="">Select Cloud</option>
                {CLOUDS.map(cloud => (
                  <option key={cloud.name} value={cloud.name}>{cloud.name}</option>
                ))}
              </select>
            </div>

            {/* Collector Type Dropdown (dynamic based on cloud) */}
            {formData.cloud && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Database size={16} className="inline mr-2" />
                  Collector Type *
                </label>
                <select
                  value={formData.collector_type}
                  onChange={e => {
                    setFormData({
                      ...formData,
                      collector_type: e.target.value,
                      instance_id: '',
                      bucket_name: '',
                      function_name: ''
                    });
                  }}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                  required
                >
                  <option value="">Select Collector</option>
                  {CLOUDS.find(c => c.name === formData.cloud)?.collectors.map(collector => (
                    <option key={collector.type} value={collector.type}>{collector.display}</option>
                  ))}
                </select>
              </div>
            )}


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



            {/* Instance ID (only for EC2) */}
            {formData.collector_type === 'ec2' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Server size={16} className="inline mr-2" />
                  Instance ID *
                </label>
                <input
                  type="text"
                  value={formData.instance_id}
                  onChange={e => setFormData({ ...formData, instance_id: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                  placeholder="i-1234567890abcdef0"
                  required
                />
              </div>
            )}

            {/* Bucket Name (only for S3) */}
            {formData.collector_type === 's3' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Server size={16} className="inline mr-2" />
                  Bucket Name *
                </label>
                <input
                  type="text"
                  value={formData.bucket_name}
                  onChange={e => setFormData({ ...formData, bucket_name: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                  placeholder="my-bucket-name"
                  required
                />
              </div>
            )}

            {/* Function Name (only for Lambda) */}
            {formData.collector_type === 'lambda' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Server size={16} className="inline mr-2" />
                  Function Name *
                </label>
                <input
                  type="text"
                  value={formData.function_name}
                  onChange={e => setFormData({ ...formData, function_name: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                  placeholder="my-lambda-function"
                  required
                />
              </div>
            )}

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
