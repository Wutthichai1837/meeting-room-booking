'use client';

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import {
  CalendarDays,
  DoorOpen,
  Clock4,
  CheckCircle,
  XCircle,
  Pencil,
} from 'lucide-react';

interface Booking {
  id: number;
  title: string;
  description: string | null;
  start_time: string;
  end_time: string;
  attendees_count: number;
  status: string;
  created_at: string;
  room_name: string;
  room_location: string;
}

interface Pagination {
  currentPage: number;
  totalPages: number;
  totalRecords: number;
  limit: number;
}

export default function MyBookingsPage() {
  const { user, loading: authLoading } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingBookingId, setEditingBookingId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    room_name: '',
    start_time: '',
    end_time: '',
    attendees_count: 0,
    status: '',
  });

  useEffect(() => {
    const fetchBookings = async () => {
      if (!user) {
        setError('Please login');
        setLoading(false);
        return;
      }

      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      if (!token) {
        setError('Token not found');
        setLoading(false);
        return;
      }

      try {
        const res = await axios.get('/api/mybookings', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          params: {
            page: 1,
            limit: 10,
          },
        });

        if (res.data.success) {
          setBookings(res.data.data.bookings);
          setPagination(res.data.data.pagination);
        } else {
          setError(res.data.message || 'Error occurred');
        }
      } catch (err) {
        console.error('API error', err);
        setError('Unable to load data');
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading) {
      fetchBookings();
    }
  }, [authLoading, user]);

  const handleEdit = (booking: Booking) => {
    setEditingBookingId(booking.id);
    setEditForm({
      title: booking.title,
      description: booking.description || '',
      room_name: booking.room_name,
      start_time: booking.start_time.slice(0, 16),
      end_time: booking.end_time.slice(0, 16),
      attendees_count: booking.attendees_count,
      status: booking.status,
    });
  };

  const handleEditChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({
      ...prev,
      [name]: name === 'attendees_count' ? parseInt(value) || 0 : value,
    }));
  };

  const handleEditSubmit = async (bookingId: number) => {
    setIsSubmitting(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      if (!token) return;

      const updateData = {
        id: bookingId,
        title: editForm.title,
        description: editForm.description,
        start_time: editForm.start_time,
        end_time: editForm.end_time,
        attendees_count: editForm.attendees_count,
        status: editForm.status,
        room_name: editForm.room_name,
      };

      const response = await axios.put('/api/mybookings', updateData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        setBookings((prev) =>
          prev.map((b) =>
            b.id === bookingId
              ? {
                  ...b,
                  title: editForm.title,
                  description: editForm.description,
                  start_time: editForm.start_time,
                  end_time: editForm.end_time,
                  attendees_count: editForm.attendees_count,
                  status: editForm.status,
                  room_name: editForm.room_name,
                }
              : b
          )
        );
        setEditingBookingId(null);
      } else {
        setError(response.data.message || 'Update failed');
      }
    } catch (error: unknown) {
      const errMsg =
        (error as any)?.response?.data?.message || 'Unexpected error occurred';
      setError(errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading || loading) return <p>⏳ Loading...</p>;
  if (error) return <p className="text-red-500">❌ {error}</p>;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2 text-gray-900">
        <CalendarDays className="w-6 h-6 text-blue-600" />
        Your Booking List
      </h1>

      {bookings.length === 0 ? (
        <p className="text-center text-gray-500 text-lg">No bookings found.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-300 shadow-sm">
          <table className="w-full min-w-max bg-white">
            <thead className="bg-gray-100 text-gray-700 uppercase text-sm">
              <tr>
                <th className="border-b p-3 text-left">TITLE</th>
                <th className="border-b p-3 text-left">ROOM</th>
                <th className="border-b p-3 text-left">START TIME</th>
                <th className="border-b p-3 text-left">END TIME</th>
                <th className="border-b p-3 text-left">STATUS</th>
                <th className="border-b p-3 text-left">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="text-gray-800 text-sm">
              {bookings.map((b) => (
                <tr key={b.id} className="hover:bg-blue-50 transition-colors duration-200">
                  {editingBookingId === b.id ? (
                    <>
                      <td className="border-b p-3">
                        <input
                          type="text"
                          name="title"
                          value={editForm.title}
                          onChange={handleEditChange}
                          className="w-full border rounded px-2 py-1"
                        />
                      </td>
                      <td className="border-b p-3">
                        <input
                          type="text"
                          name="room_name"
                          value={editForm.room_name}
                          onChange={handleEditChange}
                          className="w-full border rounded px-2 py-1"
                        />
                      </td>
                      <td className="border-b p-3">
                        <input
                          type="datetime-local"
                          name="start_time"
                          value={editForm.start_time}
                          onChange={handleEditChange}
                          className="w-full border rounded px-2 py-1"
                        />
                      </td>
                      <td className="border-b p-3">
                        <input
                          type="datetime-local"
                          name="end_time"
                          value={editForm.end_time}
                          onChange={handleEditChange}
                          className="w-full border rounded px-2 py-1"
                        />
                      </td>
                      <td className="border-b p-3">
                        <select
                          name="status"
                          value={editForm.status}
                          onChange={handleEditChange}
                          className="w-full border rounded px-2 py-1"
                        >
                          <option value="confirmed">Confirmed</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </td>
                      <td className="border-b p-3">
                        <button
                          onClick={() => handleEditSubmit(b.id)}
                          disabled={isSubmitting}
                          className={`font-semibold hover:underline ${
                            isSubmitting
                              ? 'text-gray-400 cursor-not-allowed'
                              : 'text-green-600'
                          }`}
                        >
                          {isSubmitting ? 'Saving...' : 'Save'}
                        </button>
                        <button
                          onClick={() => setEditingBookingId(null)}
                          className="ml-2 text-gray-600 font-semibold hover:underline"
                        >
                          Cancel
                        </button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="border-b p-3 font-medium">{b.title}</td>
                      <td className="border-b p-3 flex items-center gap-2">
                        <DoorOpen className="w-4 h-4 text-blue-500" /> {b.room_name}
                      </td>
                      <td className="border-b p-3">
                        <Clock4 className="w-4 h-4 inline-block text-green-500 mr-1" />
                        {new Date(b.start_time).toLocaleString()}
                      </td>
                      <td className="border-b p-3">
                        <Clock4 className="w-4 h-4 inline-block text-red-500 mr-1" />
                        {new Date(b.end_time).toLocaleString()}
                      </td>
                      <td className="border-b p-3">
                        {b.status.toLowerCase() === 'confirmed' ? (
                          <span className="inline-flex items-center gap-1 text-green-600 font-semibold">
                            <CheckCircle className="w-4 h-4" /> Confirmed
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-red-600 font-semibold">
                            <XCircle className="w-4 h-4" />
                            {b.status.charAt(0).toUpperCase() + b.status.slice(1)}
                          </span>
                        )}
                      </td>
                      <td className="border-b p-3">
                        <button
                          onClick={() => handleEdit(b)}
                          className="text-blue-600 hover:underline inline-flex items-center gap-1"
                        >
                          <Pencil className="w-4 h-4" /> Edit
                        </button>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {pagination && (
        <div className="mt-4 text-center text-sm text-gray-600">
          Page {pagination.currentPage} of {pagination.totalPages} ({pagination.totalRecords} records)
        </div>
      )}
    </div>
  );
}
