'use client';

import React, { useState, useEffect } from 'react';
import {
  LogOut,
  Bell,
  ChevronDown,
  Building,
  Menu,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface Notification {
  id: number;
  type: 'new_booking' | 'meeting_reminder' | 'upcoming_meeting';
  title: string;
  start_time: string;
  end_time: string;
  room_name: string;
  status: string;
  message: string;
  priority: 'high' | 'medium' | 'low';
  minutes_until?: number;
  hours_until?: number;
  created_at?: string;
}

interface HeaderProps {
  onMobileMenuToggle: () => void;
}

const Header: React.FC<HeaderProps> = ({ onMobileMenuToggle }) => {
  const { user, logout, token } = useAuth();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFetch, setLastFetch] = useState<Date | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = async () => {
  setLoading(true);
  setError(null);

  try {
    console.log('Fetching notifications...');
    const res = await fetch('/api/notifications'); 

    const data = await res.json();

    console.log('Notifications API response:', data);

    if (res.ok && data.success) {
      const newNotifications = data.data;
      console.log('Total notifications received:', newNotifications.length);
      setNotifications(newNotifications);
      setLastFetch(new Date());

      const importantCount = newNotifications.filter(
        (n: Notification) => n.priority === 'high' || n.priority === 'medium'
      ).length;
      setUnreadCount(importantCount);
    } else {
      console.error('API Error:', data.message);
      setError(data.message || 'Failed to fetch notifications');
    }
  } catch (err) {
    console.error('Fetch error:', err);
    setError('Unable to connect to server');
  } finally {
    setLoading(false);
  }
};

  // Auto refresh every 15 seconds (เร็วขึ้น)
  useEffect(() => {
  fetchNotifications(); // 🔥 ไม่เช็ค token แล้ว

  const interval = setInterval(() => {
    fetchNotifications();
  }, 15000);

  return () => clearInterval(interval);
}, []); // ลบ `token` ออกจาก dependency

  // Fetch when notification dropdown is opened
  useEffect(() => {
    if (showNotifications) {
      fetchNotifications();
    }
  }, [showNotifications]);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'meeting_reminder':
        return '🚨';
      case 'new_booking':
        return '📅';
      case 'upcoming_meeting':
        return '⏰';
      default:
        return '🔔';
    }
  };

  const getNotificationColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'border-red-500 bg-red-50';
      case 'medium':
        return 'border-yellow-500 bg-yellow-50';
      case 'low':
        return 'border-blue-500 bg-blue-50';
      default:
        return 'border-gray-500 bg-gray-50';
    }
  };

  const formatTimeRange = (start: string, end: string) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const options: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit' };
    return `${startDate.toLocaleTimeString([], options)} - ${endDate.toLocaleTimeString([], options)}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    } else {
      return date.toLocaleDateString('en-US', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
      });
    }
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="flex justify-between items-center px-4 lg:px-6 py-4">
        {/* Left side */}
        <div className="flex items-center space-x-4">
          <button
            onClick={onMobileMenuToggle}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Toggle menu"
          >
            <Menu className="w-5 h-5 text-gray-600" />
          </button>

          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl">
              <Building className="w-6 h-6 text-white" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-xl font-bold text-gray-900">SITC Meeting Room</h1>
              <p className="text-sm text-gray-500">Booking System</p>
            </div>
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center space-x-4">
          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 rounded-full hover:bg-gray-100 transition-colors"
              aria-label="Toggle notifications"
            >
              <Bell className="w-5 h-5 text-gray-600" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[1.25rem] h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center border-2 border-white font-medium">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-96 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50">
                <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900">Notifications</h3>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={fetchNotifications}
                      disabled={loading}
                      className="text-xs text-blue-600 hover:text-blue-800 disabled:opacity-50"
                    >
                      {loading ? 'Loading...' : 'Refresh'}
                    </button>
                    {lastFetch && (
                      <span className="text-xs text-gray-500">
                        {lastFetch.toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    )}
                  </div>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {loading && (
                    <div className="p-4 text-center text-gray-500">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto"></div>
                      <p className="mt-2">Loading...</p>
                    </div>
                  )}
                  {error && (
                    <div className="p-4 text-center text-red-500 bg-red-50 mx-2 rounded-lg">
                      <p className="text-sm">{error}</p>
                      <button
                        onClick={fetchNotifications}
                        className="mt-2 text-xs text-blue-600 hover:text-blue-800"
                      >
                        Retry
                      </button>
                    </div>
                  )}
                  {!loading && !error && notifications.length === 0 && (
                    <div className="p-8 text-center text-gray-500">
                      <Bell className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                      <p>No notifications</p>
                      <p className="text-sm text-gray-400 mt-1">
                        You will be notified when meetings are upcoming.
                      </p>
                    </div>
                  )}
                  {!loading &&
                    !error &&
                    notifications.map((notification) => (
                      <div
                        key={`${notification.type}-${notification.id}`}
                        className={`px-4 py-3 hover:bg-gray-50 cursor-pointer border-l-4 ${getNotificationColor(
                          notification.priority
                        )}`}
                      >
                        <div className="flex items-start space-x-3">
                          <span className="text-lg flex-shrink-0">
                            {getNotificationIcon(notification.type)}
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className="font-medium text-sm text-gray-900 truncate">
                                {notification.title}
                              </p>
                              <span
                                className={`text-xs px-2 py-1 rounded-full ${
                                  notification.priority === 'high'
                                    ? 'bg-red-100 text-red-700'
                                    : notification.priority === 'medium'
                                    ? 'bg-yellow-100 text-yellow-700'
                                    : 'bg-blue-100 text-blue-700'
                                }`}
                              >
                                {notification.priority === 'high'
                                  ? 'High'
                                  : notification.priority === 'medium'
                                  ? 'Medium'
                                  : 'Low'}
                              </span>
                            </div>
                            <p className="text-sm text-gray-700 mt-1">{notification.message}</p>
                            <p className="text-xs text-gray-500 mt-1">📍 {notification.room_name}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              📅 {formatDate(notification.start_time)} •{' '}
                              {formatTimeRange(notification.start_time, notification.end_time)}
                            </p>
                            {notification.minutes_until && (
                              <p className="text-xs text-red-600 mt-1 font-medium">
                                ⏰ {notification.minutes_until} minutes left
                              </p>
                            )}
                            {notification.hours_until && notification.hours_until <= 2 && (
                              <p className="text-xs text-orange-600 mt-1 font-medium">
                                ⏰ {notification.hours_until} hours left
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
                <div className="px-4 py-3 border-t border-gray-100 text-center">
                  <p className="text-xs text-gray-500">
                    Auto-refresh every 15 seconds • {notifications.length} total notifications
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Profile */}
          <div className="relative">
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="Toggle profile menu"
            >
              <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full text-white font-medium text-sm">
                {user?.firstName?.charAt(0)?.toUpperCase() ||
                  user?.email?.charAt(0)?.toUpperCase() ||
                  'U'}
              </div>
              <div className="hidden md:block text-left">
                <p className="text-sm font-medium text-gray-900">
                  {user?.firstName && user?.lastName
                    ? `${user.firstName} ${user.lastName}`
                    : user?.email?.split('@')[0] || 'User'}
                </p>
                <p className="text-xs text-gray-500">{user?.email}</p>
              </div>
              <ChevronDown className="w-4 h-4 text-gray-500" />
            </button>

            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50">
                <div className="px-4 py-3 border-b border-gray-100">
                  <p className="font-medium text-gray-900">
                    {user?.firstName && user?.lastName
                      ? `${user.firstName} ${user.lastName}`
                      : user?.email?.split('@')[0] || 'User'}
                  </p>
                  <p className="text-sm text-gray-500">{user?.email}</p>
                  {user?.department && (
                    <p className="text-xs text-gray-400 mt-1">{user.department}</p>
                  )}
                </div>

                <div className="border-t border-gray-100 pt-2">
                  <button
                    onClick={logout}
                    className="flex items-center space-x-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full text-left"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
