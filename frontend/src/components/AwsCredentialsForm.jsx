import React, { useState } from 'react';
import { Key, Lock, AlertCircle } from 'lucide-react';
import { applicationsAPI } from '../services/api';

const AwsCredentialsForm = ({ applicationId, onSuccess, onClose }) => {
  const [formData, setFormData] = useState({
    aws_access_key_id: '',
    aws_secret_access_key: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSecretKey, setShowSecretKey] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.aws_access_key_id || !formData.aws_secret_access_key) {
      setError('Please fill in both AWS Access Key ID and Secret Access Key');
      return;
    }

    setError('');
    setSuccess('');
    setLoading(true);

    try {
      await applicationsAPI.updateAwsCredentials(applicationId, {
        aws_access_key_id: formData.aws_access_key_id,
        aws_secret_access_key: formData.aws_secret_access_key
      });
      
      setSuccess('AWS credentials saved securely and encrypted in the database');
      setFormData({
        aws_access_key_id: '',
        aws_secret_access_key: ''
      });
      
      // Close after 2 seconds
      setTimeout(() => {
        onSuccess && onSuccess();
        onClose();
      }, 2000);
    } catch (err) {
      setError(err.message || 'Failed to save AWS credentials');
      console.error('Error saving credentials:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4">
        <div className="flex items-center mb-6">
          <Lock className="text-indigo-600 mr-3" size={28} />
          <h2 className="text-2xl font-bold text-gray-800">AWS Credentials</h2>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 flex items-start">
          <AlertCircle className="text-blue-600 mr-3 mt-0.5 flex-shrink-0" size={20} />
          <p className="text-sm text-blue-800">
            Your credentials will be encrypted before being stored in the database. Only authorized requests will be able to decrypt them.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
              {success}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Key size={16} className="inline mr-2" />
              AWS Access Key ID
            </label>
            <input
              type="password"
              value={formData.aws_access_key_id}
              onChange={(e) => setFormData({ ...formData, aws_access_key_id: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
              placeholder="AKIA..."
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Lock size={16} className="inline mr-2" />
              AWS Secret Access Key
            </label>
            <div className="relative">
              <input
                type={showSecretKey ? 'text' : 'password'}
                value={formData.aws_secret_access_key}
                onChange={(e) => setFormData({ ...formData, aws_secret_access_key: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition pr-10"
                placeholder="Enter your secret access key"
                disabled={loading}
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

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving...' : 'Save Credentials'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AwsCredentialsForm;
