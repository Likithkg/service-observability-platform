import React, { useState } from 'react';
import { Mail, MessageCircle, AlertCircle } from 'lucide-react';
import { API_BASE } from '../utils/constants';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');
    try {
      const res = await fetch(`${API_BASE}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      console.log('Forgot password response:', data);
      if (res.ok && data.token) {
        window.location.href = `/reset-password?token=${data.token}`;
        return;
      } else {
        setError(data.detail || 'Something went wrong.');
      }
    } catch (err) {
      setError('Network error.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen gradient-bg flex items-center justify-center p-4">
      <div className="card max-w-md w-full p-8 space-y-8">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-full">
            <Mail className="text-white" size={40} />
          </div>
          <div className="space-y-2">
            <h1 className="text-4xl font-bold text-slate-900 animate-fade-in">Reset Password</h1>
            <p className="text-slate-600 text-lg">We'll send you a link to reset your password</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-slate-700">
              <Mail size={16} className="inline mr-2" />
              Email Address
            </label>
            <input
              type="email"
              className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition text-slate-900 placeholder-slate-400"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
          </div>

          <button
            type="submit"
            className="btn-primary w-full"
            disabled={loading}
          >
            {loading ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Sending...</span>
              </div>
            ) : (
              'Send Reset Link'
            )}
          </button>
        </form>

        {message && (
          <div className="flex items-center space-x-2 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl animate-scale-in">
            <MessageCircle size={16} />
            <span>{message}</span>
          </div>
        )}
        
        {error && (
          <div className="flex items-center space-x-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl animate-scale-in">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;
