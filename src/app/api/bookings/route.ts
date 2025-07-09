import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/database';
import { extractToken, verifyToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  console.log('🚀 เริ่มสร้างการจอง...');
  try {
    const authHeader = request.headers.get('authorization');
    const token = extractToken(authHeader);
    if (!token) {
      return NextResponse.json({ success: false, message: 'ไม่พบ token การยืนยันตัวตน' }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ success: false, message: 'Token ไม่ถูกต้อง' }, { status: 401 });
    }

    const userRow = await db.queryRow(
      `SELECT first_name, last_name FROM users WHERE id = ?`,
      [payload.userId]
    ) as any;

    const userFullName = `${userRow.first_name} ${userRow.last_name}`.trim();
    console.log('👤 ผู้จอง:', userFullName);

    const body = await request.json();
    const {
      roomId,
      title,
      description,
      startTime,
      endTime,
      attendeesCount,
      attendees,
      meetingTitle,
      date,
      startTime: formStartTime,
      endTime: formEndTime,
      attendees: formAttendees
    } = body;

    const meetingTitleToUse = title || meetingTitle;
    const startTimeToUse = date && (startTime || formStartTime) ? `${date} ${(startTime || formStartTime)}:00` : null;
    const endTimeToUse = date && (endTime || formEndTime) ? `${date} ${(endTime || formEndTime)}:00` : null;
    const attendeesCountToUse = attendeesCount || formAttendees;

    if (!roomId || !meetingTitleToUse || !startTimeToUse || !endTimeToUse) {
      return NextResponse.json({ success: false, message: 'กรุณากรอกข้อมูลให้ครบถ้วน' }, { status: 400 });
    }

    const start = new Date(startTimeToUse);
    const end = new Date(endTimeToUse);
    const now = new Date();

    if (start >= end) {
      return NextResponse.json({ success: false, message: 'เวลาสิ้นสุดต้องมากกว่าเวลาเริ่มต้น' }, { status: 400 });
    }
    if (start <= now) {
      return NextResponse.json({ success: false, message: 'ไม่สามารถจองในอดีตได้' }, { status: 400 });
    }

    const room = await db.queryRow(
      `SELECT id, name, capacity, is_active FROM meeting_rooms WHERE id = ?`,
      [roomId]
    ) as any;

    if (!room || !room.is_active) {
      return NextResponse.json({ success: false, message: 'ห้องไม่พร้อมใช้งาน' }, { status: 404 });
    }

    if (attendeesCountToUse && attendeesCountToUse > room.capacity) {
      return NextResponse.json(
        { success: false, message: `จำนวนผู้เข้าร่วมเกินความจุ (${room.capacity} คน)` },
        { status: 400 }
      );
    }

    const conflict = await db.queryRow(
      `SELECT id FROM bookings 
       WHERE room_id = ? AND status IN ('approved', 'confirmed')
       AND (
         (start_time < ? AND end_time > ?) OR
         (start_time < ? AND end_time > ?) OR
         (start_time >= ? AND end_time <= ?)
       )`,
      [roomId, startTimeToUse, startTimeToUse, endTimeToUse, endTimeToUse, startTimeToUse, endTimeToUse]
    );

    if (conflict) {
      return NextResponse.json({ success: false, message: 'ช่วงเวลาดังกล่าวถูกจองแล้ว' }, { status: 409 });
    }

    const insertResult = await db.query(
      `INSERT INTO bookings 
        (room_id, user_id, username, title, description, start_time, end_time, attendees_count, status) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'confirmed')`,
      [
        roomId,
        payload.userId,
        userFullName,
        meetingTitleToUse,
        description || null,
        startTimeToUse,
        endTimeToUse,
        attendeesCountToUse || 1
      ]
    );

    const bookingId = (insertResult as any).insertId;

    if (attendees && attendees.length > 0) {
      const attendeeQueries = attendees.map((attendee: { email: string; name?: string }) => ({
        sql: 'INSERT INTO booking_attendees (booking_id, email, name) VALUES (?, ?, ?)',
        params: [bookingId, attendee.email, attendee.name || null]
      }));
      await db.transaction(attendeeQueries);
    }

    return NextResponse.json({
      success: true,
      message: 'Bookings Successfull',
      data: {
        bookingId,
        roomName: room.name,
        title: meetingTitleToUse,
        startTime: startTimeToUse,
        endTime: endTimeToUse
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Create booking error:', error);
    return NextResponse.json({ success: false, message: 'เกิดข้อผิดพลาดในระบบ' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";

    const bookings = await db.query(
      `SELECT b.id, b.title, b.start_time, b.end_time, b.status, r.name as room_name, b.username
       FROM bookings b
       JOIN meeting_rooms r ON b.room_id = r.id
       WHERE b.title LIKE ? OR b.username LIKE ?
       ORDER BY b.start_time DESC`,
      [`%${search}%`, `%${search}%`]
    );

    return NextResponse.json({ success: true, data: bookings }, { status: 200 });
  } catch (error) {
    console.error('Fetch bookings error:', error);
    return NextResponse.json({ success: false, message: 'เกิดข้อผิดพลาดในการดึงข้อมูล' }, { status: 500 });
  }
}
