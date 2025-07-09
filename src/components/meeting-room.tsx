'use client';

import React, { useState, useEffect } from 'react';
import { Users } from 'lucide-react';
import RoomCard from './RoomCard';
import Image from 'next/image';

interface Room {
  id: number;
  name: string;
  description: string;
  capacity: number;
  image?: string | null;
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
        if (!res.ok) throw new Error(`Failed to fetch rooms: ${res.statusText}`);
        const data: Room[] = await res.json();

        const enriched = data.map((r) => ({
          ...r,
          image: `/images/${r.name.toLowerCase().replace(/\s/g, '-')}.jpg`,
          amenities: r.amenities || [],
        }));

        setRooms(enriched);
      } catch (err) {
        console.error('Failed to fetch rooms:', err);
      } finally {
        setLoading(false);
      }
    };

    if (externalRooms && externalRooms.length > 0) {
      setRooms(externalRooms);
      setLoading(false);
    } else {
      fetchRooms();
    }
  }, [externalRooms]);

  const handleBook = (roomId: number) => {
    if (onBook) {
      onBook(roomId);
    }
  };

  if (loading) {
    return (
      <div className="bg-gray-50 flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (rooms.length === 0) {
    return (
      <div className="bg-gray-50 flex items-center justify-center py-12 text-gray-500">
        No meeting rooms found.
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto px-4 py-4">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Meeting Rooms</h1>
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {rooms.map((room) => (
            <div
              key={room.id}
              className="bg-white rounded-lg shadow-md overflow-hidden flex flex-col hover:shadow-lg transition-shadow"
            >
              <div className="h-40 bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center relative">
                {room.image ? (
                  <Image
                    src={room.image}
                    alt={room.name}
                    width={300}
                    height={160}
                    className="object-cover w-full h-full"
                    priority
                    unoptimized={false} // Set true only if you don't want image optimization on Vercel
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
                    <span>{room.capacity} persons</span>
                  </div>
                </div>
                <div className="flex justify-center mt-auto">
                  <button
                    onClick={() => handleBook(room.id)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors text-sm"
                    type="button"
                  >
                    Book Now
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
