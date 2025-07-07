import { NextResponse } from 'next/server';
import { db } from '@/lib/database';

export async function GET() {
  try {
    const results = await db.query(
      `SELECT 
        b.id, 
        b.title, 
        b.username,
        DATE_FORMAT(b.start_time, '%Y-%m-%d') as date,
        TIME_FORMAT(b.start_time, '%H:%i') as startTime,
        TIME_FORMAT(b.end_time, '%H:%i') as endTime,
        r.name as roomName
      FROM bookings b
      LEFT JOIN meeting_rooms r ON b.room_id = r.id
      WHERE b.status = 'confirmed' 
      ORDER BY b.start_time DESC 
      LIMIT 5`
    );
    
    return NextResponse.json({ 
      bookings: Array.isArray(results) ? results : [] 
    });
  } catch (error) {
    console.error('recent-bookings error:', error);
    return NextResponse.json({ bookings: [] }, { status: 200 });
  }
}
