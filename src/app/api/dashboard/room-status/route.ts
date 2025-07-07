import { NextResponse } from 'next/server';
import { db } from '@/lib/database';

export async function GET() {
  try {
    const roomsWithStatus = await db.query(
      `SELECT 
        r.id, 
        r.name,
        CASE 
          WHEN EXISTS (
            SELECT 1 FROM bookings b 
            WHERE b.room_id = r.id 
              AND b.status = 'confirmed'
              AND NOW() BETWEEN b.start_time AND b.end_time
          ) THEN 'occupied'
          ELSE 'available'
        END AS status
      FROM meeting_rooms r`
    );

    return NextResponse.json({ 
      rooms: Array.isArray(roomsWithStatus) ? roomsWithStatus : [] 
    });
  } catch (error) {
    console.error('room-status error:', error);
    return NextResponse.json({ rooms: [] }, { status: 200 });
  }
}