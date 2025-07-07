'use client';
import React, { useState, useEffect } from 'react';
import Header from '../../components/Header';
import Sidebar from '../../components/Sidebar';
import DashboardOverview from '../../components/DashboardOverview';
import CalendarView from '../../components/CalendarView';
import MeetingRooms from '../../components/meeting-room';
import MyBookings from '../../components/MyBookings';
import ReportsPage from '../reports/page';
import AdminSettings from '../adminsetting/page';

const Page = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [userRole, setUserRole] = useState<'admin' | 'user'>('user'); // 👈 default

  useEffect(() => {
  
    const storedUser = localStorage.getItem('user'); 
    if (storedUser) {
      const user = JSON.parse(storedUser);
      setUserRole(user.role === 'admin' ? 'admin' : 'user');
    }
  }, []);

  return (
    <div className="flex h-screen">
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        userRole={userRole} 
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header onMobileMenuToggle={() => setIsSidebarOpen(!isSidebarOpen)} />

        <main className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === 'dashboard' && <DashboardOverview />}
          {activeTab === 'rooms' && <MeetingRooms />}
          {activeTab === 'calendar' && <CalendarView />}
          {activeTab === 'bookings' && <MyBookings />}
          {activeTab === 'reports' && <ReportsPage />}
          {activeTab === 'adminsetting' && <AdminSettings />}
        </main>
      </div>
    </div>
  );
};

export default Page;
