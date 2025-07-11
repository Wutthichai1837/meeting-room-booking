import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');

    if (date) {
      // ดึงข้อมูล popup เฉพาะวัน
      const bookings = await db.query(
        `
        SELECT 
          b.id,
          b.title,
          b.description,
          b.start_time,
          b.end_time,
          b.attendees_count,
          b.status,
          b.username,
          mr.name AS room_name,
          mr.location,
          u.department, -- JOIN department จาก users
          DATE(b.start_time) AS date,
          TIME_FORMAT(TIME(b.start_time), '%H:%i') AS start_time_format,
          TIME_FORMAT(TIME(b.end_time), '%H:%i') AS end_time_format
        FROM bookings b
        LEFT JOIN meeting_rooms mr ON b.room_id = mr.id
        LEFT JOIN users u ON b.user_id = u.id
        WHERE DATE(b.start_time) = ?
        AND b.status IN ('confirmed', 'pending')
        AND b.end_time >= NOW()
        ORDER BY b.start_time ASC
        `,
        [date]
      );

      return NextResponse.json({
        success: true,
        data: bookings,
        date: date,
      });
    } else {
      // ดึงข้อมูลทั้งหมดในช่วงแสดงบน calendar
      const bookings = await db.query(
        `
        SELECT 
          b.id,
          b.title,
          b.start_time,
          b.end_time,
          b.attendees_count,
          b.status,
          b.username,
          b.user_id,
          u.department, -- JOIN department จาก users
          mr.name as room_name,
          DATE(b.start_time) as date,
          TIME_FORMAT(TIME(b.start_time), '%H:%i') as start_time_format,
          TIME_FORMAT(TIME(b.end_time), '%H:%i') as end_time_format,
          CASE 
            WHEN b.status = 'confirmed' THEN 'bg-green-500'
            WHEN b.status = 'pending' THEN 'bg-yellow-500'
            WHEN b.status = 'cancelled' THEN 'bg-red-500'
            ELSE 'bg-gray-500'
          END as color
        FROM bookings b
        LEFT JOIN meeting_rooms mr ON b.room_id = mr.id
        LEFT JOIN users u ON b.user_id = u.id
        WHERE b.start_time >= CURDATE() - INTERVAL 30 DAY
        AND b.start_time <= CURDATE() + INTERVAL 60 DAY
        AND b.status IN ('confirmed', 'pending')
        AND b.end_time >= NOW()
        ORDER BY b.start_time ASC
        `
      );

      const formattedBookings = (bookings as {
        id: number;
        title: string;
        room_name: string;
        start_time_format: string;
        end_time_format: string;
        date: string;
        attendees_count: number;
        status: string;
        color: string;
        username: string;
        department: string;
        user_id: number;
      }[]).map((booking) => ({
        id: booking.id,
        title: booking.title,
        room: booking.room_name,
        startTime: booking.start_time_format,
        endTime: booking.end_time_format,
        date: booking.date,
        attendees: booking.attendees_count,
        status: booking.status,
        color: booking.color,
        username: booking.username,
        department: booking.department,
        userId: booking.user_id,
      }));

      return NextResponse.json(formattedBookings);
    }
  } catch (error) {
    console.error('Calendar view error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'เกิดข้อผิดพลาดในระบบ',
      },
      { status: 500 }
    );
  }
}
