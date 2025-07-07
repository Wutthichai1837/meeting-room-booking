'use client';

import React, { useState, useEffect } from 'react';
import { Users } from 'lucide-react';
import RoomCard from './RoomCard';

interface Room {
  id: number;
  name: string;
  description: string;
  capacity: number;
  image?: string | null;
  status: 'available';
  amenities: string[];
  location: string;
  nextAvailable?: string;
  currentBooking?: string;
}

interface MeetingRoomsProps {
  rooms?: Room[];
  onBook?: (roomId: number) => void;
}

const MeetingRooms: React.FC<MeetingRoomsProps> = ({ rooms: externalRooms, onBook }) => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const res = await fetch('/api/rooms');
        const data = await res.json();
        console.log('Rooms data from API:', data);
        const enriched = data.map((r: any) => ({
          ...r,
          status: 'available',
          image: `/images/${r.name.toLowerCase().replace(/\s/g, '-')}.jpg`,
          amenities: [],
        }));
        console.log('Enriched rooms:', enriched);
        setRooms(enriched);
      } catch (err) {
        console.error('Failed to fetch rooms:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchRooms();
  }, [externalRooms]);

  const handleBook = (roomId: number) => {
    if (onBook) {
      onBook(roomId);
    } else {
      console.log('Booking room with ID:', roomId);
    }
  };

  if (loading) {
    return (
      <div className="bg-gray-50 flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-4">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Meeting Rooms</h1>
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {rooms.map((room) => (
            <div
              key={room.id}
              className="bg-white rounded-lg shadow-md overflow-hidden flex flex-col hover:shadow-lg transition-shadow"
            >
              <div className="h-40 bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
                {room.image ? (
                  <img
                    src={room.image}
                    alt={room.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="text-center">
                    <Users className="h-16 w-16 mx-auto text-blue-400 mb-2" />
                    <span className="text-blue-600 font-medium">{room.name}</span>
                  </div>
                )}
              </div>

              <div className="p-4 flex flex-col flex-grow">
                <h3 className="font-semibold text-lg mb-2 text-center">{room.name}</h3>
                <p className="text-gray-600 mb-3 text-center text-sm">{room.description}</p>
                <div className="flex justify-between text-sm text-gray-600 mb-3">
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    <span>{room.capacity} person</span>
                  </div>
                </div>
                <div className="flex justify-center">
                  <button
                    onClick={() => handleBook(room.id)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
                    disabled={room.status !== 'available'}
                  >
                    {room.status === 'available'
                      ? 'Book Now'
                      : room.status === 'occupied'
                      ? 'Occupied'
                      : 'Maintenance'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const MeetingRoomApp: React.FC = () => {
  const [currentView, setCurrentView] = useState<'list' | 'booking'>('list');
  const [selectedRoomId, setSelectedRoomId] = useState<number | null>(null);

  const handleBookClick = (roomId: number) => {
    console.log('Book button clicked for room ID:', roomId, typeof roomId);
    setSelectedRoomId(roomId);
    setCurrentView('booking');
  };

  const handleBackToList = () => {
    setCurrentView('list');
    setSelectedRoomId(null);
  };

  const handleBookingSuccess = () => {
    setCurrentView('list');
    setSelectedRoomId(null);
  };

  return (
    <div>
      {currentView === 'list' && <MeetingRooms onBook={handleBookClick} />}
      {currentView === 'booking' && selectedRoomId && (
        <RoomCard
          roomId={selectedRoomId}
          onBack={handleBackToList}
          onBookingSuccess={handleBookingSuccess}
        />
      )}
    </div>
  );
};

export default MeetingRoomApp;