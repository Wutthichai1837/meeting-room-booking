// types/meeting-room.ts
export interface Room {
  id: number;
  name: string;
  description: string;
  capacity: number;
  image?: string | null;
  status: 'available' | 'occupied';
  amenities: string[];
  location: string;
  nextAvailable?: string;
  currentBooking?: string;
}

export interface BookingFormData {
  meetingTitle: string;
  description: string;
  date: string;
  startTime: string;
  endTime: string;
  attendees: number;
  roomId: number;
  roomName: string;
}

export interface BookingConfirmation extends BookingFormData {
  room: Room;
}