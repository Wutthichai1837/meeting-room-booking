'use client';

import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  Calendar,
  Clock,
  FileText,
  Loader2,
  MapPin,
  User,
  CheckCircle,
} from 'lucide-react';

interface Room {
  id: number;
  name: string;
  description: string;
  capacity: number;
  location: string;
  amenities: string[];
}

interface RoomCardProps {
  roomId: number;
  onBack: () => void;
  onBookingSuccess?: () => void;
}

// Helper function for retrieving token
const getAuthToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token') || sessionStorage.getItem('token') || 
         document.cookie.split('; ').find(row => row.startsWith('token='))?.split('=')[1] || null;
};

const RoomCard: React.FC<RoomCardProps> = ({ roomId, onBack, onBookingSuccess }) => {
  const [room, setRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState<'form' | 'confirm' | 'submitting'>('form');
  const [form, setForm] = useState({
    title: '',
    description: '',
    date: '',
    startTime: '',
    endTime: '',
    attendees: 1,
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!roomId) return;

    const fetchRoom = async () => {
      try {
        console.log('Fetching room:', roomId);
        const res = await fetch(`/api/meeting_rooms/${roomId}`);
        console.log('Response status:', res.status);
        const data = await res.json();
        console.log('Response data:', data);
        
        if (res.ok) {
          setRoom(data.room);
        } else {
          setError(data.message || 'Room not found');
        }
      } catch (err) {
        console.error('Fetch error:', err);
        setError('Failed to load room data');
      } finally {
        setLoading(false);
      }
    };

    fetchRoom();
  }, [roomId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === 'attendees' ? parseInt(value) : value,
    }));
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (timeString: string) => {
    return timeString;
  };

  const handleInitialSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!form.title || !form.date || !form.startTime || !form.endTime) {
      setError('Please fill in all required fields');
      return;
    }

    if (form.attendees > (room?.capacity || 0)) {
      setError('Number of attendees exceeds room capacity');
      return;
    }

    setStep('confirm');
  };

  const handleFinalSubmit = async () => {
    setStep('submitting');
    setError(null);

    try {
      const token = getAuthToken();
      
      if (!token) {
        setError('Please log in before booking');
        setStep('confirm');
        return;
      }

      const bookingData = {
        roomId: room?.id,
        title: form.title,
        description: form.description,
        date: form.date,
        startTime: form.startTime,
        endTime: form.endTime,
        attendees: form.attendees,
      };

      console.log('Sending booking data:', bookingData);

      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(bookingData),
      });

      const data = await response.json();
      console.log('API Response:', data);

      if (response.ok && data.success) {
        setSuccess(`✅ ${data.message || 'Booking successful!'} 
Room: ${data.data?.roomName || room?.name}
Title: ${data.data?.title || form.title}
Date: ${formatDate(form.date)} 
Time: ${formatTime(form.startTime)} - ${formatTime(form.endTime)}
Attendees: ${form.attendees} people`);

        setTimeout(() => {
          if (onBookingSuccess) {
            onBookingSuccess();
          }
        }, 2000);
      } else {
        if (response.status === 401) {
          setError('Please log in again (Token expired)');
          if (typeof window !== 'undefined') {
            localStorage.removeItem('token');
            sessionStorage.removeItem('token');
          }
        } else if (response.status === 409) {
          setError('This time slot is already booked, please choose another');
        } else if (response.status === 400) {
          setError(data.message || 'Invalid booking data');
        } else {
          setError(data.message || 'Booking failed');
        }
        setStep('confirm');
      }
    } catch (err) {
      console.error('Booking error:', err);
      setError('Server connection error');
      setStep('confirm');
    }
  };

  const handleBack = () => {
    if (step === 'confirm') {
      setStep('form');
      setError(null);
    } else {
      onBack();
    }
  };

  if (loading) {
    return (
      <div className="p-6 text-center">
        <Loader2 className="w-6 h-6 animate-spin mx-auto text-gray-600" />
        <p className="mt-2 text-gray-500">Loading room data...</p>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="p-6 text-center text-red-600">
        <p>{error || 'Room not found'}</p>
        <button onClick={onBack} className="mt-4 text-blue-600 underline">
          ← Back
        </button>
      </div>
    );
  }

  if (success) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="bg-white rounded-xl shadow-md p-6 text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="text-green-800 text-sm whitespace-pre-line">{success}</div>
            <div className="text-green-600 text-xs mt-2">Redirecting to room list...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <button onClick={handleBack} className="mb-4 flex items-center text-blue-600 hover:underline">
        <ArrowLeft className="w-4 h-4 mr-1" />
        {step === 'confirm' ? 'Back to edit form' : 'Back to meeting rooms'}
      </button>

      <div className="bg-white rounded-xl shadow-md p-6 space-y-6">
        <div>
          <h2 className="text-xl font-bold">{room.name}</h2>
          <p className="text-gray-600">{room.description}</p>
          <div className="text-sm text-gray-500 mt-1 flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            {room.location} • Capacity {room.capacity} people
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {room.amenities?.map((item, i) => (
              <span key={i} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                {item}
              </span>
            ))}
          </div>
        </div>

        {step === 'form' && (
          <form onSubmit={handleInitialSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium flex items-center gap-2 mb-1">
                <FileText className="w-4 h-4" /> Meeting title *
              </label>
              <input
                type="text"
                name="title"
                value={form.title}
                onChange={handleChange}
                className="w-full border border-gray-300 px-3 py-2 rounded-lg"
                placeholder="e.g., Project Report"
                required
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Additional details</label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                className="w-full border border-gray-300 px-3 py-2 rounded-lg"
                rows={3}
                placeholder="Details (if any)"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium flex items-center gap-2 mb-1">
                  <Calendar className="w-4 h-4" /> Date *
                </label>
                <input
                  type="date"
                  name="date"
                  value={form.date}
                  onChange={handleChange}
                  className="w-full border border-gray-300 px-3 py-2 rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="text-sm font-medium flex items-center gap-2 mb-1">
                  <Clock className="w-4 h-4" /> Start time *
                </label>
                <input
                  type="time"
                  name="startTime"
                  value={form.startTime}
                  onChange={handleChange}
                  className="w-full border border-gray-300 px-3 py-2 rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="text-sm font-medium flex items-center gap-2 mb-1">
                  <Clock className="w-4 h-4" /> End time *
                </label>
                <input
                  type="time"
                  name="endTime"
                  value={form.endTime}
                  onChange={handleChange}
                  className="w-full border border-gray-300 px-3 py-2 rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="text-sm font-medium flex items-center gap-2 mb-1">
                  <User className="w-4 h-4" /> Attendees *
                </label>
                <input
                  type="number"
                  name="attendees"
                  value={form.attendees}
                  onChange={handleChange}
                  min={1}
                  max={room.capacity}
                  className="w-full border border-gray-300 px-3 py-2 rounded-lg"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">Max: {room.capacity} people</p>
              </div>
            </div>

            {error && (
              <p className="text-red-600 text-sm mt-2">{error}</p>
            )}

            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg transition"
            >
              Review Booking
            </button>
          </form>
        )}

        {(step === 'confirm' || step === 'submitting') && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4 text-center">Confirm Booking Details</h3>
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <div className="flex justify-between">
                  <span className="font-medium">Meeting Title:</span>
                  <span>{form.title}</span>
                </div>
                
                {form.description && (
                  <div className="flex justify-between">
                    <span className="font-medium">Details:</span>
                    <span className="text-right max-w-xs">{form.description}</span>
                  </div>
                )}
                
                <div className="flex justify-between">
                  <span className="font-medium">Date:</span>
                  <span>{formatDate(form.date)}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="font-medium">Time:</span>
                  <span>{formatTime(form.startTime)} - {formatTime(form.endTime)}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="font-medium">Attendees:</span>
                  <span>{form.attendees} people</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="font-medium">Meeting Room:</span>
                  <span>{room.name}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="font-medium">Location:</span>
                  <span>{room.location}</span>
                </div>
              </div>
            </div>

            {error && (
              <p className="text-red-600 text-sm text-center">{error}</p>
            )}

            <div className="space-y-3">
              <button
                onClick={handleFinalSubmit}
                disabled={step === 'submitting'}
                className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-medium py-3 rounded-lg transition flex items-center justify-center gap-2"
              >
                {step === 'submitting' ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Booking...
                  </>
                ) : (
                  'Confirm Booking'
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RoomCard;
