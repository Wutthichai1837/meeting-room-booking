// File: /app/api/bookings/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/database';
import { extractToken, verifyToken } from '@/lib/auth';

// PUT: แก้ไขข้อมูลการจอง
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: paramId } = await params;
    const id = parseInt(paramId);
    const authHeader = request.headers.get('authorization');
    const token = extractToken(authHeader);
    if (!token) return NextResponse.json({ success: false, message: 'Missing token' }, { status: 401 });

    const payload = verifyToken(token);
    if (!payload) return NextResponse.json({ success: false, message: 'Invalid token' }, { status: 401 });

    const body = await request.json();
    const { title, roomName, startTime, endTime, status } = body;

    if (!title || !roomName || !startTime || !endTime || !status) {
      return NextResponse.json({ success: false, message: 'Incomplete data' }, { status: 400 });
    }

    const room = await db.queryRow(
      `SELECT id FROM meeting_rooms WHERE name = ? LIMIT 1`,
      [roomName]
    ) as { id: number } | null;

    if (!room) return NextResponse.json({ success: false, message: 'Room not found' }, { status: 404 });

    // อัปเดตข้อมูล booking
    await db.query(
      `UPDATE bookings SET title = ?, room_id = ?, start_time = ?, end_time = ?, status = ? WHERE id = ?`,
      [title, room.id, startTime, endTime, status, id]
    );

    return NextResponse.json({ success: true, message: 'Booking updated successfully' });

  } catch (err) {
    console.error('Update booking error:', err);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}


// DELETE: ลบการจอง
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: paramId } = await params;
    const bookingId = parseInt(paramId);

    if (isNaN(bookingId)) {
      return NextResponse.json({ success: false, message: 'Invalid booking ID' }, { status: 400 });
    }

    // ตรวจสอบว่าการจองมีอยู่หรือไม่
    const booking = await db.queryRow(
      `SELECT id, title, start_time FROM bookings WHERE id = ?`,
      [bookingId]
    );

    if (!booking) {
      return NextResponse.json({ success: false, message: 'การจองไม่พบ' }, { status: 404 });
    }
    
    // ลบการจอง
    await db.query('DELETE FROM bookings WHERE id = ?', [bookingId]);

    return NextResponse.json({
      success: true,
      message: 'ลบการจองสำเร็จ'
    }, { status: 200 });

  } catch (error) {
    console.error('Delete booking error:', error);
    return NextResponse.json({ success: false, message: 'เกิดข้อผิดพลาดในระบบ' }, { status: 500 });
  }
}