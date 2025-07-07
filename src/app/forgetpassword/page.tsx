'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation'; // ✅ For App Router

export default function ForgetPassword() {
  const router = useRouter();
  const [step, setStep] = useState(1); // 1 = email verification, 2 = password change
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Verify email function
  const handleEmailVerification = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Call API to verify email exists
      const response = await fetch('/api/verify-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setStep(2); // Move to password change step
        setSuccess('Email verified. Please enter your new password.');
      } else {
        setError(data.message || 'Email not found in the system.');
      }
    } catch (err) {
      setError('Connection error occurred.');
    } finally {
      setLoading(false);
    }
  };

  // Change password function
  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validate passwords match
    if (newPassword !== confirmNewPassword) {
      setError('New passwords do not match.');
      setLoading(false);
      return;
    }

    // Validate password length
    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters long.');
      setLoading(false);
      return;
    }

    try {
      // Call API to change password
      const response = await fetch('/api/forgetpassword', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          newPassword,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Password changed successfully.');
        setTimeout(() => {
          router.push('/'); // Redirect to login page
        }, 2000);
      } else {
        setError(data.message || 'Incorrect old password.');
      }
    } catch (err) {
      setError('Error occurred while changing the password.');
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
    <div className="min-h-screen flex items-center justify-center bg-white p-5">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md transform transition-all duration-300 hover:scale-105 hover:shadow-3xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent mb-2">
            Change Password
          </h1>
          <p className="text-gray-600 text-sm">
            {step === 1 
              ? 'Please verify the email you registered with' 
              : 'Please enter your new password'
            }
          </p>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center justify-center mb-8">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 ${
            step >= 1 
              ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white scale-110' 
              : 'bg-gray-200 text-gray-500'
          }`}>
            1
          </div>
          <div className="w-12 h-0.5 bg-gray-200 mx-2"></div>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 ${
            step >= 2 
              ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white scale-110' 
              : 'bg-gray-200 text-gray-500'
          }`}>
            2
          </div>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-3 rounded mb-4 animate-slide-down">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-50 border-l-4 border-green-500 text-green-700 p-3 rounded mb-4 animate-slide-down">
            {success}
          </div>
        )}

        {/* Step 1: Email Verification */}
        {step === 1 && (
          <form onSubmit={handleEmailVerification} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
                disabled={loading}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 disabled:bg-gray-50 disabled:cursor-not-allowed outline-none"
              />
            </div>

            <div className="flex space-x-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-3 px-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-semibold hover:from-blue-600 hover:to-purple-700 transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                    Verifying...
                  </div>
                ) : (
                  'Verify'
                )}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                disabled={loading}
                className="flex-1 py-3 px-4 border-2 border-gray-200 rounded-lg text-gray-600 font-semibold hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Step 2: Password Change */}
        {step === 2 && (
          <form onSubmit={handlePasswordChange} className="space-y-6">
            <div>
              <label htmlFor="newPassword" className="block text-sm font-semibold text-gray-700 mb-2">
                New Password
              </label>
              <input
                type="password"
                id="newPassword"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter your new password"
                required
                disabled={loading}
                minLength={6}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 disabled:bg-gray-50 disabled:cursor-not-allowed outline-none"
              />
            </div>

            <div>
              <label htmlFor="confirmNewPassword" className="block text-sm font-semibold text-gray-700 mb-2">
                Confirm New Password
              </label>
              <input
                type="password"
                id="confirmNewPassword"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                placeholder="Confirm your new password"
                required
                disabled={loading}
                minLength={6}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 disabled:bg-gray-50 disabled:cursor-not-allowed outline-none"
              />
            </div>

            <div className="flex space-x-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-3 px-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-semibold hover:from-blue-600 hover:to-purple-700 transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                    Changing...
                  </div>
                ) : (
                  'OK'
                )}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                disabled={loading}
                className="flex-1 py-3 px-4 border-2 border-gray-200 rounded-lg text-gray-600 font-semibold hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
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
