import { NextResponse } from 'next/server';
import { db } from '@/lib/database';

type Booking = {
  id: number;
  title: string;
  start_time: string;
  end_time: string;
  room_name: string;
  status: string;
  created_at: string;
  user_id: number;
};

export async function GET() {
  try {
    const now = new Date();
    const thaiTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Bangkok' }));
    const nowLocalStr = thaiTime.toISOString().slice(0, 19).replace('T', ' ');

    const notifyBeforeMinutes = 15;
    const notifyBeforeDate = new Date(thaiTime.getTime() + notifyBeforeMinutes * 60000);
    const notifyBeforeLocalStr = notifyBeforeDate.toISOString().slice(0, 19).replace('T', ' ');

    // ดึงข้อมูล upcoming bookings
    const upcomingBookingsResult = await db.query(
      `SELECT b.id, b.title, b.start_time, b.end_time, r.name as room_name, b.status,
              b.created_at, b.user_id
       FROM bookings b
       JOIN meeting_rooms r ON b.room_id = r.id
       WHERE b.start_time > ?
         AND b.status IN ('approved', 'confirmed')
       ORDER BY b.start_time ASC
       LIMIT 50`,
      [nowLocalStr]
    );
    const upcomingBookings = upcomingBookingsResult as Booking[];

    // ดึงข้อมูล bookings ที่กำลังจะเริ่ม (ภายใน 15 นาที)
    const nearBookingsResult = await db.query(
      `SELECT b.id, b.title, b.start_time, b.end_time, r.name as room_name, b.status,
              b.created_at, b.user_id
       FROM bookings b
       JOIN meeting_rooms r ON b.room_id = r.id
       WHERE b.start_time BETWEEN ? AND ?
         AND b.status IN ('approved', 'confirmed')
       ORDER BY b.start_time ASC`,
      [nowLocalStr, notifyBeforeLocalStr]
    );
    const nearBookings = nearBookingsResult as Booking[];

    // ดึงข้อมูล bookings ที่สร้างใหม่ล่าสุด (ภายใน 2 ชั่วโมง)
    const recentBookingsResult = await db.query(
      `SELECT b.id, b.title, b.start_time, b.end_time, r.name as room_name, b.status,
              b.created_at, b.user_id
       FROM bookings b
       JOIN meeting_rooms r ON b.room_id = r.id
       WHERE b.created_at >= DATE_SUB(NOW(), INTERVAL 2 HOUR)
         AND b.status IN ('approved', 'confirmed')
       ORDER BY b.created_at DESC
       LIMIT 20`
    );
    const recentBookings = recentBookingsResult as Booking[];

    const notifications: Array<{
      id: number;
      type: string;
      title: string;
      start_time: string;
      end_time: string;
      room_name: string;
      status: string;
      message: string;
      priority: string;
      created_at?: string;
      minutes_until?: number;
      hours_until?: number;
    }> = [];

    // การจองใหม่
    recentBookings.forEach((booking) => {
      notifications.push({
        id: booking.id,
        type: 'new_booking',
        title: booking.title,
        start_time: booking.start_time,
        end_time: booking.end_time,
        room_name: booking.room_name,
        status: booking.status,
        message: `New booking: ${booking.title}`,
        priority: 'medium',
        created_at: booking.created_at,
      });
    });

    // แจ้งเตือนใกล้เริ่ม
    nearBookings.forEach((booking) => {
      const startTime = new Date(booking.start_time);
      const diffMins = (startTime.getTime() - thaiTime.getTime()) / (1000 * 60);
      if (diffMins > 0 && diffMins <= 15) {
        notifications.push({
          id: booking.id,
          type: 'meeting_reminder',
          title: booking.title,
          start_time: booking.start_time,
          end_time: booking.end_time,
          room_name: booking.room_name,
          status: booking.status,
          message: `Meeting starts in ${Math.ceil(diffMins)} minutes`,
          priority: 'high',
          minutes_until: Math.ceil(diffMins),
        });
      }
    });

    // แจ้งเตือนประชุมที่จะมาถึงภายใน 24 ชั่วโมง
    upcomingBookings.forEach((booking) => {
      const startTime = new Date(booking.start_time);
      const diffHours = (startTime.getTime() - thaiTime.getTime()) / (1000 * 60 * 60);
      if (diffHours <= 24 && diffHours > 0.25) {
        notifications.push({
          id: booking.id,
          type: 'upcoming_meeting',
          title: booking.title,
          start_time: booking.start_time,
          end_time: booking.end_time,
          room_name: booking.room_name,
          status: booking.status,
          message: `Upcoming meeting: ${booking.title}`,
          priority: 'low',
          hours_until: Math.ceil(diffHours),
        });
      }
    });

    // เรียงลำดับตาม priority และเวลาเริ่ม
    notifications.sort((a, b) => {
      const priorityOrder: Record<string, number> = { high: 3, medium: 2, low: 1 };
      const aPriority = priorityOrder[a.priority] || 0;
      const bPriority = priorityOrder[b.priority] || 0;

      if (aPriority !== bPriority) return bPriority - aPriority;
      return new Date(a.start_time).getTime() - new Date(b.start_time).getTime();
    });

    return NextResponse.json({
      success: true,
      data: notifications.slice(0, 20),
      total: notifications.length,
      timestamp: thaiTime.toISOString(),
    });
  } catch (error) {
    console.error('Fetch notifications error:', error);
    return NextResponse.json(
      { success: false, message: 'Error fetching notifications' },
      { status: 500 }
    );
  }
}
