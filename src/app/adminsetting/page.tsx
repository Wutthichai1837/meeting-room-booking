'use client';

import React, { useEffect, useState } from 'react';
import {
  Users,
  Building2,
  CalendarDays,
  Pencil,
  Trash2,
  Plus,
  Loader2,
  AlertCircle,
  X,
  Save,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react';

type TabType = 'users' | 'rooms' | 'bookings';

interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
  department: string;
  role: string;
  is_active: boolean;
  created_at: string;
}

interface MeetingRoom {
  id: number;
  name: string;
  description: string;
  location: string;
  capacity: number;
  is_active: boolean;
  created_at: string;
}

interface Booking {
  id: number;
  title: string;
  start_time: string;
  end_time: string;
  status: string;
  room_name: string;
  username: string;
}

const AdminSettings = () => {
  const [activeTab, setActiveTab] = useState<TabType>('users');
  const [users, setUsers] = useState<User[]>([]);
  const [rooms, setRooms] = useState<MeetingRoom[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editingUserId, setEditingUserId] = useState<number | null>(null);
  const [editingRoomId, setEditingRoomId] = useState<number | null>(null);

  const [userForm, setUserForm] = useState<Partial<User>>({});
  const [roomForm, setRoomForm] = useState<Partial<MeetingRoom>>({});

  const [showUserModal, setShowUserModal] = useState(false);
  const [showRoomModal, setShowRoomModal] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [deleteType, setDeleteType] = useState<'user' | 'room' | 'booking' | null>(null);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'users') await fetchUsers();
      else if (activeTab === 'rooms') await fetchRooms();
      else if (activeTab === 'bookings') await fetchBookings();
      setError(null);
    } catch (err: unknown) {
      const error = err as { message?: string };
      setError(error.message || 'System Error');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users');
      if (!res.ok) throw new Error('Failed to fetch users');
      const data = await res.json();
      setUsers(data.data || data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      setError('Failed to load users');
    }
  };

  const fetchRooms = async () => {
    try {
      const res = await fetch('/api/meeting_rooms');
      if (!res.ok) throw new Error('Failed to fetch rooms');
      const data = await res.json();
      setRooms(data.rooms || data.data || data || []);
    } catch (error) {
      console.error('Error fetching rooms:', error);
      setError('Failed to load rooms');
    }
  };

  const fetchBookings = async () => {
    try {
      const res = await fetch('/api/bookings');
      if (!res.ok) throw new Error('Failed to fetch bookings');
      const data = await res.json();
      setBookings(data.data || data || []);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      setError('Failed to load bookings');
    }
  };

  const handleUserChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setUserForm(prev => ({ ...prev, [name]: value }));
  };

  const handleEditUser = (user: User) => {
    setEditingUserId(user.id);
    setUserForm(user);
    setShowUserModal(true);
  };

  const handleSaveUser = async () => {
    try {
      const res = await fetch(`/api/users/${editingUserId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userForm),
      });
      if (!res.ok) throw new Error('Failed to save user');
      await fetchUsers();
      setShowUserModal(false);
      setEditingUserId(null);
      setUserForm({});
    } catch (error) {
      console.error('Error saving user:', error);
      setError('Failed to save user');
    }
  };

  const handleDeleteUser = async (id: number) => {
    try {
      const res = await fetch(`/api/users/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete user');
      await fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      setError('Failed to delete user');
    }
  };

  const handleRoomChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setRoomForm(prev => ({ 
      ...prev, 
      [name]: name === 'capacity' ? parseInt(value) || 0 : value 
    }));
  };

  const handleEditRoom = (room: MeetingRoom) => {
    setEditingRoomId(room.id);
    setRoomForm(room);
    setShowRoomModal(true);
  };

  const handleAddRoom = () => {
    setEditingRoomId(null);
    setRoomForm({});
    setShowRoomModal(true);
  };

  const handleSaveRoom = async () => {
    try {
      const url = editingRoomId 
        ? `/api/meeting_rooms/${editingRoomId}` 
        : '/api/meeting_rooms';
      const method = editingRoomId ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(roomForm),
      });
      
      if (!res.ok) throw new Error('Failed to save room');
      await fetchRooms();
      setShowRoomModal(false);
      setEditingRoomId(null);
      setRoomForm({});
    } catch (error) {
      console.error('Error saving room:', error);
      setError('Failed to save room');
    }
  };

  const handleDeleteRoom = async (id: number) => {
    try {
      const res = await fetch(`/api/meeting_rooms/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete room');
      await fetchRooms();
    } catch (error) {
      console.error('Error deleting room:', error);
      setError('Failed to delete room');
    }
  };

  const handleDeleteBooking = async (id: number) => {
    try {
      const res = await fetch(`/api/bookings/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete booking');
      await fetchBookings();
    } catch (error) {
      console.error('Error deleting booking:', error);
      setError('Failed to delete booking');
    }
  };

  const tabButton = (label: string, tab: TabType, Icon: React.ComponentType<{ size?: number }>) => (
    <button
      onClick={() => setActiveTab(tab)}
      className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all duration-200
        ${activeTab === tab 
          ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg' 
          : 'bg-white border-2 border-gray-200 text-gray-700 hover:border-blue-300 hover:shadow-md'}`}
    >
      <Icon size={18} />
      {label}
    </button>
  );

  const formatDateTime = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleString('th-TH', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
  };

  const confirmDelete = (id: number, type: 'user' | 'room' | 'booking') => {
    setConfirmDeleteId(id);
    setDeleteType(type);
  };

  const executeDelete = async () => {
    if (!confirmDeleteId || !deleteType) return;
    
    try {
      if (deleteType === 'user') await handleDeleteUser(confirmDeleteId);
      if (deleteType === 'room') await handleDeleteRoom(confirmDeleteId);
      if (deleteType === 'booking') await handleDeleteBooking(confirmDeleteId);
    } finally {
      setConfirmDeleteId(null);
      setDeleteType(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Settings</h1>
          <p className="text-gray-600">Manage users, rooms, and bookings</p>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-4 mb-8">
          {tabButton('Users', 'users', Users)}
          {tabButton('Rooms', 'rooms', Building2)}
          {tabButton('Bookings', 'bookings', CalendarDays)}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center gap-3 text-blue-600">
              <Loader2 className="animate-spin" size={24} />
              <span className="text-lg">Loading...</span>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2 text-red-700">
              <AlertCircle size={20} />
              <span className="font-medium">Error: {error}</span>
            </div>
          </div>
        )}

        {/* Content */}
        {!loading && !error && (
          <>
            {/* Users Tab */}
            {activeTab === 'users' && (
              <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-2xl font-bold text-gray-900">User Management</h2>
                  <p className="text-gray-600 mt-1">Manage system users and their permissions</p>
                </div>
                
                {users.length === 0 ? (
                  <div className="p-12 text-center text-gray-500">
                    <Users size={48} className="mx-auto mb-4 text-gray-400" />
                    <p>No users found</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          {['Username', 'Email', 'Name', 'Phone', 'Department', 'Role', 'Status', 'Actions'].map((header) => (
                            <th key={header} className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                              {header}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {users.map((user) => (
                          <tr key={user.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 text-sm text-gray-900">{user.username}</td>
                            <td className="px-6 py-4 text-sm text-gray-900">{user.email}</td>
                            <td className="px-6 py-4 text-sm text-gray-900">{`${user.first_name} ${user.last_name}`}</td>
                            <td className="px-6 py-4 text-sm text-gray-900">{user.phone}</td>
                            <td className="px-6 py-4 text-sm text-gray-900">{user.department}</td>
                            <td className="px-6 py-4 text-sm">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                user.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                              }`}>
                                {user.role}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                user.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                              }`}>
                                {user.is_active ? 'Active' : 'Active'}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm">
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleEditUser(user)}
                                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                  title="Edit user"
                                >
                                  <Pencil size={16} />
                                </button>
                                <button
                                  onClick={() => confirmDelete(user.id, 'user')}
                                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                  title="Delete user"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Rooms Tab */}
            {activeTab === 'rooms' && (
              <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Room Management</h2>
                    <p className="text-gray-600 mt-1">Manage meeting rooms and their details</p>
                  </div>
                  <button
                    onClick={handleAddRoom}
                    className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <Plus size={18} />
                    Add Room
                  </button>
                </div>
                
                {rooms.length === 0 ? (
                  <div className="p-12 text-center text-gray-500">
                    <Building2 size={48} className="mx-auto mb-4 text-gray-400" />
                    <p>No rooms found</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          {['Room Name', 'Description', 'Location', 'Capacity', 'Status', 'Actions'].map((header) => (
                            <th key={header} className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                              {header}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {rooms.map((room) => (
                          <tr key={room.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 text-sm font-medium text-gray-900">{room.name}</td>
                            <td className="px-6 py-4 text-sm text-gray-900">{room.description}</td>
                            <td className="px-6 py-4 text-sm text-gray-900">{room.location}</td>
                            <td className="px-6 py-4 text-sm text-gray-900">{room.capacity} people</td>
                            <td className="px-6 py-4 text-sm\">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                room.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                              }`}>
                                {room.is_active ? 'Active' : 'Inactive'}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm">
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleEditRoom(room)}
                                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                  title="Edit room"
                                >
                                  <Pencil size={16} />
                                </button>
                                <button
                                  onClick={() => confirmDelete(room.id, 'room')}
                                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                  title="Delete room"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Bookings Tab */}
            {activeTab === 'bookings' && (
              <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-2xl font-bold text-gray-900">Booking Management</h2>
                  <p className="text-gray-600 mt-1\">View and manage all room bookings</p>
                </div>
                
                {bookings.length === 0 ? (
                  <div className="p-12 text-center text-gray-500">
                    <CalendarDays size={48} className="mx-auto mb-4 text-gray-400" />
                    <p>No bookings found</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          {['Title', 'Room', 'User', 'Start Time', 'End Time', 'Status', 'Actions'].map((header) => (
                            <th key={header} className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                              {header}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {bookings.map((booking) => (
                          <tr key={booking.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 text-sm font-medium text-gray-900">{booking.title}</td>
                            <td className="px-6 py-4 text-sm text-gray-900">{booking.room_name}</td>
                            <td className="px-6 py-4 text-sm text-gray-900">{booking.username}</td>
                            <td className="px-6 py-4 text-sm text-gray-900">{formatDateTime(booking.start_time)}</td>
                            <td className="px-6 py-4 text-sm text-gray-900">{formatDateTime(booking.end_time)}</td>
                            <td className="px-6 py-4 text-sm\">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                booking.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                                booking.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                'bg-red-100 text-red-700'
                              }`}>
                                {booking.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm">
                              <button
                                onClick={() => confirmDelete(booking.id, 'booking')}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Delete booking"
                              >
                                <Trash2 size={16} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* User Modal */}
      {showUserModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <CheckCircle className="text-blue-600" size={24} />
                Edit User
              </h2>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                <input
                  name="username"
                  value={userForm.username || ''}
                  onChange={handleUserChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter username"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  name="email"
                  type="email"
                  value={userForm.email || ''}
                  onChange={handleUserChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter email"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                  <input
                    name="first_name"
                    value={userForm.first_name || ''}
                    onChange={handleUserChange}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="First name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                  <input
                    name="last_name"
                    value={userForm.last_name || ''}
                    onChange={handleUserChange}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Last name"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  name="phone"
                  value={userForm.phone || ''}
                  onChange={handleUserChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Phone number"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                <input
                  name="department"
                  value={userForm.department || ''}
                  onChange={handleUserChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Department"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select
                  name="role"
                  value={userForm.role || ''}
                  onChange={handleUserChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select role</option>
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>
            
            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={handleSaveUser}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Save size={16} />
                Save Changes
              </button>
               <button
                onClick={() => setShowUserModal(false)}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <X size={16} />
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Room Modal */}
      {showRoomModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200\">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <Building2 className="text-green-600\" size={24} />
                {editingRoomId ? 'Edit Room' : 'Add New Room'}
              </h2>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Room Name</label>
                <input
                  name="name"
                  value={roomForm.name || ''}
                  onChange={handleRoomChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Enter room name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  name="description"
                  value={roomForm.description || ''}
                  onChange={handleRoomChange}
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Enter room description"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <input
                  name="location"
                  value={roomForm.location || ''}
                  onChange={handleRoomChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Enter room location"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Capacity</label>
                <input
                  name="capacity"
                  type="number"
                  value={roomForm.capacity || ''}
                  onChange={handleRoomChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Enter room capacity"
                  min="1"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  name="is_active"
                  value={roomForm.is_active ? 'true' : 'false'}
                  onChange={(e) => setRoomForm(prev => ({ ...prev, is_active: e.target.value === 'true' }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
              </div>
            </div>
            
            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={async () => {
                  await handleSaveRoom();
                  setShowRoomModal(false);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Save size={16} />
                {editingRoomId ? 'Update Room' : 'Add Room'}
              </button>
              <button
                onClick={() => {
                  setShowRoomModal(false);
                  setEditingRoomId(null);
                  setRoomForm({});
                }}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <X size={16} />
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Delete Modal */}
      {confirmDeleteId && deleteType && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm">
            <div className="p-6 text-center">
              <div className="mx-auto flex items-center justify-center w-12 h-12 rounded-full bg-red-100 mb-4">
                <AlertTriangle className="text-red-600" size={24} />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Confirm Delete</h3>
              <p className="text-sm text-gray-500 mb-6">
                Are you sure you want to delete this {deleteType}? This action cannot be undone.
              </p>
              <div className="flex justify-center gap-3">
                <button
                  onClick={executeDelete}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  <Trash2 size={16} />
                  Delete
                </button>
                <button
                  onClick={() => {
                    setConfirmDeleteId(null);
                    setDeleteType(null);
                  }}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <X size={16} />
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSettings;