import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/database';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    // ✅ Get user info from JWT
    const { user, username } = getUserFromRequest(req);

    if (!user || !username) {
      return NextResponse.json(
        { message: 'Unauthorized - Invalid or missing token' },
        { status: 401 }
      );
    }

    // ✅ Get user's next booking
    const booking = await db.queryRow(
      `
      SELECT 
        title, 
        mr.name AS room_name, 
        TIME_FORMAT(start_time, '%H:%i') AS start_time, 
        TIME_FORMAT(end_time, '%H:%i') AS end_time
      FROM bookings b
      LEFT JOIN meeting_rooms mr ON b.room_id = mr.id
      WHERE DATE(b.start_time) = CURDATE()
      AND b.status = 'confirmed'
      AND b.username = ?
      ORDER BY b.start_time ASC
      LIMIT 1
      `,
      [username]
    );

    // ✅ Create message with booking info or no bookings found
    const message = booking
      ? `You have a booking titled "${booking.title}" in room ${booking.room_name} from ${booking.start_time} to ${booking.end_time}`
      : 'No bookings found for today';

    return NextResponse.json({
      message,
      booking: booking || null
    });
  } catch (error) {
    console.error('overview error:', error);
    return NextResponse.json(
      { message: 'Internal server error', booking: null },
      { status: 500 }
    );
  }
}
