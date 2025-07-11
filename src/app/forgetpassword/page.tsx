'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ForgetPassword() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleEmailVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/verify-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setStep(2);
        setSuccess('Email verified. Please enter your new password.');
      } else {
        setError(data.message || 'Email not found in the system.');
      }
    } catch {
      setError('A connection error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    if (newPassword !== confirmNewPassword) {
      setError('Passwords do not match.');
      setLoading(false);
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/forgetpassword', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, newPassword }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Password changed successfully. Redirecting...');
        setTimeout(() => {
          router.push('/');
        }, 2000);
      } else {
        setError(data.message || 'Failed to change the password.');
      }
    } catch {
      setError('An error occurred while changing the password.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (step === 2) {
      setStep(1);
      setNewPassword('');
      setConfirmNewPassword('');
      setError('');
      setSuccess('');
    } else {
      router.push('/');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md transition duration-300 hover:scale-[1.02]">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-purple-600">
            Change Password
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            {step === 1 ? 'Please verify your email address.' : 'Enter your new password below.'}
          </p>
        </div>

        <div className="flex justify-center mb-6">
          {[1, 2].map((s) => (
            <div key={s} className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition ${
                  step >= s
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white scale-110'
                    : 'bg-gray-200 text-gray-500'
                }`}
              >
                {s}
              </div>
              {s === 1 && <div className="w-10 h-0.5 bg-gray-300 mx-2"></div>}
            </div>
          ))}
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-3 rounded mb-4">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-50 border-l-4 border-green-500 text-green-700 p-3 rounded mb-4">
            {success}
          </div>
        )}

        {/* Step 1 */}
        {step === 1 && (
          <form onSubmit={handleEmailVerification} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-1">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                required
                disabled={loading}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-blue-400 focus:outline-none disabled:bg-gray-100"
                placeholder="you@example.com"
              />
            </div>

            <div className="flex space-x-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2 px-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-600 hover:to-purple-700 transition disabled:opacity-50"
              >
                {loading ? 'Verifying...' : 'Verify'}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                disabled={loading}
                className="w-full py-2 px-4 border border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-50 transition disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Step 2 */}
        {step === 2 && (
          <form onSubmit={handlePasswordChange} className="space-y-5">
            <div>
              <label htmlFor="newPassword" className="block text-sm font-semibold text-gray-700 mb-1">
                New Password
              </label>
              <input
                id="newPassword"
                type="password"
                value={newPassword}
                required
                minLength={6}
                disabled={loading}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-blue-400 focus:outline-none disabled:bg-gray-100"
              />
            </div>

            <div>
              <label htmlFor="confirmNewPassword" className="block text-sm font-semibold text-gray-700 mb-1">
                Confirm New Password
              </label>
              <input
                id="confirmNewPassword"
                type="password"
                value={confirmNewPassword}
                required
                minLength={6}
                disabled={loading}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-blue-400 focus:outline-none disabled:bg-gray-100"
              />
            </div>

            <div className="flex space-x-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2 px-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-600 hover:to-purple-700 transition disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Save'}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                disabled={loading}
                className="w-full py-2 px-4 border border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-50 transition disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
