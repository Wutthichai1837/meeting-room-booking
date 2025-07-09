'use client';

import React from 'react';
import {
  LayoutDashboard,
  Calendar,
  MapPin,
  Clock,
  BarChart3,
  Settings,
  X
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: string;
  onTabChange: (tabId: string) => void;
  userRole: 'admin' | 'user';
}

const menuItems = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    description: 'Overview'
  },
  {
    id: 'rooms',
    label: 'Meeting Rooms',
    icon: MapPin,
    description: 'Book rooms'
  },
  {
    id: 'calendar',
    label: 'Calendar View',
    icon: Calendar,
    description: 'View Schedule Bookings'
  },
  {
    id: 'bookings',
    label: 'My Bookings',
    icon: Clock,
    description: 'Manage your reservations'
  },
  {
    id: 'reports',
    label: 'Reports',
    icon: BarChart3,
    description: 'Usage Reports'
  },
  {
    id: 'adminsetting',
    label: 'Admin Setting',
    icon: Settings,
    description: 'Manage all Control',
    onlyAdmin: true
  }
];

const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  activeTab,
  onTabChange,
  userRole
}) => {
  const handleMenuClick = (itemId: string) => {
    onTabChange(itemId);
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      onClose();
    }
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:sticky top-0 left-0 h-screen
          bg-white border-r border-gray-200
          transition-transform duration-300 ease-in-out
          z-50 lg:z-auto
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          w-64
        `}
      >
        <div className="flex flex-col h-full">
          {/* Mobile Close Button */}
          <div className="lg:hidden flex justify-end items-center px-4 py-3 border-b border-gray-200">
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="Close sidebar"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          {/* Navigation Menu */}
          <nav className="flex-1 px-4 py-6">
            <div className="space-y-2">
              {menuItems
                .filter(item => !item.onlyAdmin || userRole === 'admin')
                .map(item => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;

                  return (
                    <button
                      key={item.id}
                      onClick={() => handleMenuClick(item.id)}
                      className={`w-full flex items-start space-x-3 px-4 py-3 rounded-xl text-left transition-all duration-200 ${
                        isActive
                          ? 'bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 text-blue-700'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      <Icon
                        className={`w-5 h-5 mt-0.5 ${
                          isActive ? 'text-blue-600' : 'text-gray-500'
                        }`}
                      />
                      <div className="flex flex-col text-sm">
                        <span className={`font-medium ${isActive ? 'text-blue-700' : 'text-gray-900'}`}>
                          {item.label}
                        </span>
                        <span className="text-xs text-gray-500">{item.description}</span>
                      </div>
                    </button>
                  );
                })}
            </div>
          </nav>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
