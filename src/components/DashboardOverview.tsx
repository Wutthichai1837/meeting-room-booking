'use client';

import React, { useEffect, useState } from 'react';
import {
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  CalendarDays,
  DoorOpen,
  Clock4,
} from 'lucide-react';

interface Stat {
  title: string;
  value: string;
  icon: React.ElementType;
  color: 'blue' | 'green' | 'purple' | 'orange';
}

interface Booking {
  id: number;
  title: string;
  roomName: string;
  date: string;
  startTime: string;
  endTime: string;
}

interface RoomStatus {
  id: number;
  name: string;
  status: 'available' | 'occupied';
}

const DashboardOverview = () => {
  const [welcomeMessage, setWelcomeMessage] = useState('');
  const [stats, setStats] = useState<Stat[]>([]);
  const [recentBookings, setRecentBookings] = useState<Booking[]>([]);
  const [roomsStatus, setRoomsStatus] = useState<RoomStatus[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const token = localStorage.getItem('token');
        const authHeaders = token
          ? {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            }
          : {};

        const [overviewRes, activeRes, myTodayRes, recentRes, roomStatusRes] = await Promise.all([
          fetch('/api/dashboard/overview', { headers: authHeaders }),
          fetch('/api/dashboard/active-bookings'),
          fetch('/api/dashboard/my-bookings-today', { headers: authHeaders }),
          fetch('/api/dashboard/recent-bookings'),
          fetch('/api/dashboard/room-status'),
        ]);

        const overviewData = await overviewRes.json();
        const activeData = await activeRes.json();

        if (myTodayRes.status === 401) {
          console.warn('JWT token invalid or expired');
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          // window.location.href = '/login';
        }

        const myTodayData = await myTodayRes.json();
        const recentData = await recentRes.json();
        const roomStatusData = await roomStatusRes.json();

        setWelcomeMessage(overviewData.message);

        setStats([
          {
            title: 'Active Bookings',
            value: activeData.count.toString(),
            icon: Calendar,
            color: 'green',
          },
          {
            title: 'My Bookings Today',
            value: myTodayData.count.toString(),
            icon: Clock,
            color: 'purple',
          },
        ]);

        setRecentBookings(recentData.bookings || []);
        setRoomsStatus(roomStatusData.rooms || []);
        setLoading(false);
      } catch (error) {
        console.error('Error loading dashboard data:', error);
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'available':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'occupied':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusTextColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'text-green-700';
      case 'occupied':
        return 'text-red-700';
      default:
        return 'text-gray-700';
    }
  };

  const getStatusColorClasses = (status: string) => {
    switch (status) {
      case 'available':
        return 'border-green-200 bg-green-50 hover:border-green-300';
      case 'occupied':
        return 'border-red-200 bg-red-50 hover:border-red-300';
      default:
        return 'border-gray-200 bg-gray-50 hover:border-gray-300';
    }
  };

  const getColorClasses = (color: string) => {
    const colors = {
      blue: 'bg-blue-50 text-blue-700 border-blue-200',
      green: 'bg-green-50 text-green-700 border-green-200',
      purple: 'bg-purple-50 text-purple-700 border-purple-200',
      orange: 'bg-orange-50 text-orange-700 border-orange-200',
    };
    return colors[color] || colors.blue;
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">Welcome To SITC Meeting Book! 👋</h2>
        <p className="text-blue-100">{loading ? 'Loading...' : welcomeMessage}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-xl ${getColorClasses(stat.color)}`}>
                  <Icon className="w-6 h-6" />
                </div>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-sm font-medium text-gray-600 mb-1">{stat.title}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Bookings</h3>
        {recentBookings.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <AlertCircle className="w-8 h-8 mx-auto mb-2 text-gray-400" />
            <p className="text-sm">No bookings found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recentBookings.map((booking) => (
              <div
                key={booking.id}
                className="border border-blue-100 bg-blue-50 p-4 rounded-lg shadow-sm hover:shadow-md transition duration-200"
              >
                <h4 className="text-base font-semibold text-blue-900 mb-2 flex items-center gap-2">
                  <CalendarDays className="w-5 h-5 text-blue-600" />
                  {booking.title}
                </h4>
                <p className="text-sm text-blue-800 flex items-center gap-2">
                  <DoorOpen className="w-4 h-4 text-blue-500" />
                  <span className="font-medium">Room:</span> {booking.roomName}
                </p>
                <p className="text-sm text-blue-800 flex items-center gap-2 mt-1">
                  <Clock4 className="w-4 h-4 text-blue-500" />
                  <span className="font-medium">Time:</span> {booking.date} • {booking.startTime} - {booking.endTime}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Room Availability Right Now</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {roomsStatus.map((room) => (
            <div
              key={room.id}
              className={`p-6 rounded-lg border-2 transition-all hover:shadow-sm ${getStatusColorClasses(room.status)}`}
            >
              <div className="text-center">
                <p className="font-medium text-gray-900 mb-2">{room.name}</p>
                <div className="flex items-center justify-center space-x-2">
                  {getStatusIcon(room.status)}
                  <span className={`text-sm font-medium ${getStatusTextColor(room.status)}`}>
                    {room.status === 'available' ? 'Available' : 'Occupied'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DashboardOverview;
