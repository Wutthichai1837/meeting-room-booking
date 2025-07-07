'use client';

import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Mail, Lock, User, Phone, Building, Loader2 } from 'lucide-react';

const AuthPages = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [isResendingEmail, setIsResendingEmail] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    phone: '',
    department: '',
  });

  // API Configuration
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

  // Load saved credentials on component mount
  useEffect(() => {
    const savedCredentials = localStorage.getItem('rememberedCredentials');
    if (savedCredentials) {
      try {
        const { username, password, remember } = JSON.parse(savedCredentials);
        if (remember) {
          setFormData(prev => ({
            ...prev,
            username: username || '',
            password: password || ''
          }));
          setRememberMe(true);
        }
      } catch (error) {
        console.error('Error loading saved credentials:', error);
      }
    }
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleRememberMeChange = (e) => {
    setRememberMe(e.target.checked);
    
    // If unchecked, remove saved credentials
    if (!e.target.checked) {
      localStorage.removeItem('rememberedCredentials');
    }
  };

  const handleForgetPassword = () => {
    // Navigate to forget password page
    window.location.href = '/forgetpassword';
  };

  const validateForm = () => {
    const newErrors = {};

    if (isLogin) {
      // Login validations
      if (!formData.username) {
        newErrors.username = 'Username is required';
      }
    } else {
      // Register validations
      if (!formData.username) {
        newErrors.username = 'Username is required';
      } else if (formData.username.length < 3) {
        newErrors.username = 'Username must be at least 3 characters';
      } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
        newErrors.username = 'Username can only contain letters, numbers, and underscores';
      }

      // Email validation for register
      if (!formData.email) {
        newErrors.email = 'Email is required';
      } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
        newErrors.email = 'Email format is invalid';
      }

      if (!formData.firstName) {
        newErrors.firstName = 'First name is required';
      }
      if (!formData.lastName) {
        newErrors.lastName = 'Last name is required';
      }
      if (!formData.phone) {
        newErrors.phone = 'Phone number is required';
      }
      if (!formData.department) {
        newErrors.department = 'Department is required';
      }
      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
    }

    // Password validation for both login and register
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const saveCredentials = () => {
    if (rememberMe) {
      const credentialsToSave = {
        username: formData.username,
        password: formData.password,
        remember: true
      };
      localStorage.setItem('rememberedCredentials', JSON.stringify(credentialsToSave));
    } else {
      localStorage.removeItem('rememberedCredentials');
    }
  };

  const handleLogin = async () => {
    try {
      console.log('Attempting login with:', {
        username: formData.username,
        password: '***hidden***',
        url: `${API_BASE_URL}/auth/login`
      });

      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: formData.username,
          password: formData.password,
        }),
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);

      const data = await response.json();
      console.log('Response data:', data);

      if (response.ok) {
        // Save credentials if remember me is checked
        saveCredentials();
        
        // Success - store token and redirect
        localStorage.setItem('token', data.data.token);
        localStorage.setItem('user', JSON.stringify(data.data.user));
        
        alert('Login successful!');
        console.log('Login successful:', data);
        
        // Redirect to dashboard or main page
        window.location.href = '/dashboard';
        
      } else {
        console.error('Login failed with status:', response.status);
        // Handle email verification required
        if (data.emailVerificationRequired) {
          setErrors({ 
            general: data.message,
            showResendEmail: true 
          });
        } else {
          // Handle other API errors
          const errorMessage = data.message || `เข้าสู่ระบบไม่สำเร็จ (${response.status}) กรุณาตรวจสอบ username และรหัสผ่าน`;
          setErrors({ 
            general: errorMessage
          });
        }
      }
    } catch (error) {
      console.error('Login error:', error);
      setErrors({ 
        general: 'เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาตรวจสอบว่า API server ทำงานอยู่หรือไม่' 
      });
    }
  };

  const handleRegister = async () => {
    try {
      // Client-side validation
      const requiredFields = ['username', 'email', 'password', 'firstName', 'lastName', 'department'];
      const missingFields = requiredFields.filter(field => !formData[field] || formData[field].trim() === '');
      
      if (missingFields.length > 0) {
        setErrors({ 
          general: `กรุณากรอกข้อมูลให้ครบถ้วน: ${missingFields.join(', ')}` 
        });
        return;
      }

      // Password confirmation check
      if (formData.password !== formData.confirmPassword) {
        setErrors({ 
          general: 'รหัสผ่านและยืนยันรหัสผ่านไม่ตรงกัน' 
        });
        return;
      }

      console.log('Sending registration data:', {
        username: formData.username,
        email: formData.email,
        password: '[HIDDEN]',
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
        department: formData.department,
      });

      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: formData.username.trim(),
          email: formData.email.trim(),
          password: formData.password,
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          phone: formData.phone.trim() || null,
          department: formData.department,
        }),
      });

      console.log('Registration response status:', response.status);
      
      const data = await response.json();
      console.log('Registration response data:', data);

      if (response.ok) {
        // Success
        alert('Registration successful');
        console.log('Registration successful:', data);
        
        // Switch to login mode
        setIsLogin(true);
        setFormData({
          username: '',
          email: '',
          password: '',
          confirmPassword: '',
          firstName: '',
          lastName: '',
          phone: '',
          department: ''
        });
        
      } else {
        // Handle API error
        setErrors({ 
          general: data.message || 'Registration failed. Please try again.' 
        });
      }
    } catch (error) {
      console.error('Registration error:', error);
      setErrors({ 
        general: 'Network error. Please check your connection and try again.' 
      });
    }
  };

  const handleSubmit = async () => {
    // Clear previous errors
    setErrors({});

    // Validate form
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      if (isLogin) {
        await handleLogin();
      } else {
        await handleRegister();
      }
    } finally {
      setIsLoading(false);
    }
  };

  const switchMode = () => {
    setIsLogin(!isLogin);
    setErrors({});
    setFormData({
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
      firstName: '',
      lastName: '',
      phone: '',
      department: ''
    });
    setRememberMe(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !isLoading) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl mb-4">
            <Building className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            SITC Meeting Room Booking
          </h1>
          <p className="text-gray-600">
            {isLogin ? 'Login for booking' : 'Register'}
          </p>
        </div>

        {/* Form Container */}
        <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100">
          <div className="space-y-6" onKeyDown={handleKeyDown}>
  
            {/* Username Field */}
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Username
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                    errors.username ? 'border-red-300 bg-red-50' : 'border-gray-200'
                  }`}
                  placeholder="username"
                  disabled={isLoading}
                />
              </div>
              {errors.username && <p className="text-red-500 text-xs mt-1">{errors.username}</p>}
            </div>

            {/* Register Fields */}
            {!isLogin && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="relative">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      First Name
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                          errors.firstName ? 'border-red-300 bg-red-50' : 'border-gray-200'
                        }`}
                        placeholder="first name"
                        disabled={isLoading}
                      />
                    </div>
                    {errors.firstName && <p className="text-red-500 text-xs mt-1">{errors.firstName}</p>}
                  </div>
                  
                  <div className="relative">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Last Name
                    </label>
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                        errors.lastName ? 'border-red-300 bg-red-50' : 'border-gray-200'
                      }`}
                      placeholder="last name"
                      disabled={isLoading}
                    />
                    {errors.lastName && <p className="text-red-500 text-xs mt-1">{errors.lastName}</p>}
                  </div>
                </div>

                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Telephone
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                        errors.phone ? 'border-red-300 bg-red-50' : 'border-gray-200'
                      }`}
                      placeholder="0xx-xxx-xxxx"
                      disabled={isLoading}
                    />
                  </div>
                  {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
                </div>

                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Department
                  </label>
                  <select
                    name="department"
                    value={formData.department}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white ${
                      errors.department ? 'border-red-300 bg-red-50' : 'border-gray-200'
                    }`}
                    disabled={isLoading}
                  >
                    <option value="">Select Department</option>
                    <option value="IT">IT</option>
                    <option value="HR&Admin">HR & Admin</option>
                    <option value="Sales&Marketing">Sales & Marketing</option>
                    <option value="DocInbound">Doc-Inbound</option>
                    <option value="DocOutbound">Doc-Outbound</option>
                    <option value="Accounting">Accounting</option>
                    <option value="CS">Customer Service</option>
                    <option value="ECD">ECD</option>
                    <option value="Operation">Operation</option>
                    <option value="Jiaxiang">Jiaxiang</option>
                  </select>
                  {errors.department && <p className="text-red-500 text-xs mt-1">{errors.department}</p>}
                </div>

                {/* Email Field (Register only) */}
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    E-Mail
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                        errors.email ? 'border-red-300 bg-red-50' : 'border-gray-200'
                      }`}
                      placeholder="youremail@sitcthai.com"
                      disabled={isLoading}
                    />
                  </div>
                  {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                </div>
              </>
            )}


            {/* Password Field */}
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className={`w-full pl-10 pr-12 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                    errors.password ? 'border-red-300 bg-red-50' : 'border-gray-200'
                  }`}
                  placeholder="••••••••"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
            </div>

            {/* Confirm Password Field (Register only) */}
            {!isLogin && (
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className={`w-full pl-10 pr-12 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                      errors.confirmPassword ? 'border-red-300 bg-red-50' : 'border-gray-200'
                    }`}
                    placeholder="••••••••"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    disabled={isLoading}
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>}
              </div>
            )}

            {/* Remember Me / Forgot Password (Login only) */}
            {isLogin && (
              <div className="flex items-center justify-between">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={handleRememberMeChange}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    disabled={isLoading}
                  />
                  <span className="ml-2 text-sm text-gray-600">Remember Me</span>
                </label>
                <button
                  type="button"
                  onClick={handleForgetPassword}
                  className="text-sm text-blue-600 hover:text-blue-800 transition-colors disabled:opacity-50"
                  disabled={isLoading}
                >
                  Forget Password?
                </button>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              onClick={handleSubmit}
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-4 rounded-xl font-medium hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transform hover:scale-[1.02] transition-all duration-200 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  {isLogin ? 'Logging in...' : 'Registering...'}
                </div>
              ) : (
                isLogin ? 'Login' : 'Register'
              )}
            </button>

            {/* Terms and Conditions (Register only) */}
            {!isLogin && (
              <p className="text-xs text-gray-500 text-center">
                By subscribing you agree to{' '}
                <button type="button" className="text-blue-600 hover:underline">
                  our Terms of Use
                </button>{' '}
                And{' '}
                <button type="button" className="text-blue-600 hover:underline">
                  Privacy Policy
                </button>
              </p>
            )}
          </div>

          {/* Switch Mode */}
          <div className="mt-8 pt-6 border-t border-gray-100 text-center">
            <p className="text-gray-600">
              {isLogin ? 'No account yet??' : 'Already have an account??'}{' '}
              <button
                type="button"
                onClick={switchMode}
                className="text-blue-600 font-medium hover:text-blue-800 transition-colors disabled:opacity-50"
                disabled={isLoading}
              >
                {isLogin ? 'Register' : 'Login'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPages;