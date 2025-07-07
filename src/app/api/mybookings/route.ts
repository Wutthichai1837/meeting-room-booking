import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/database';
import { extractToken, verifyToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    console.log('📦 GET /api/mybookings called');

    // 🔐 ตรวจสอบ token
    const authHeader = request.headers.get('authorization');
    const token = extractToken(authHeader);
    if (!token) {
      return NextResponse.json(
        { success: false, message: 'ไม่พบ token การยืนยันตัวตน' },
        { status: 401 }
      );
    }

    const payload = verifyToken(token);
    if (!payload || !payload.username) {
      return NextResponse.json(
        { success: false, message: 'Token ไม่ถูกต้อง' },
        { status: 401 }
      );
    }

    const username = payload.username; // ✅ ใช้จาก token โดยตรง

    // 📄 อ่าน query parameters
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = (page - 1) * limit;

    // 🧾 Query หลัก
    const baseQuery = `
      FROM bookings b
      JOIN meeting_rooms r ON b.room_id = r.id
      WHERE b.username = ?
    `;

    const dataQuery = `
      SELECT 
        b.id, b.title, b.description, b.start_time, b.end_time, 
        b.attendees_count, b.status, b.created_at,
        r.name as room_name, r.location as room_location
      ${baseQuery}
      ORDER BY b.start_time DESC
      LIMIT ? OFFSET ?
    `;

    const countQuery = `SELECT COUNT(*) as total ${baseQuery}`;
    const queryParams = [username];

    const countResult = await db.queryRow(countQuery, queryParams) as any;
    const totalRecords = countResult?.total || 0;

    const bookingsRaw = await db.query(dataQuery, [...queryParams, limit, offset]) as any[];

    const bookings = bookingsRaw.map(booking => ({
      ...booking,
      username,
    }));

    return NextResponse.json({
      success: true,
      message: 'ดึงข้อมูลการจองของผู้ใช้สำเร็จ',
      data: {
        bookings,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalRecords / limit),
          totalRecords,
          limit,
        },
      },
    });

  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาดใน API /mybookings:', error);
    return NextResponse.json(
      { success: false, message: 'เกิดข้อผิดพลาดในระบบ' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    console.log('📝 PUT /api/mybookings called');

    // 🔐 ตรวจสอบ token
    const authHeader = request.headers.get('authorization');
    const token = extractToken(authHeader);
    if (!token) {
      return NextResponse.json(
        { success: false, message: 'ไม่พบ token การยืนยันตัวตน' },
        { status: 401 }
      );
    }

    const payload = verifyToken(token);
    if (!payload || !payload.username) {
      return NextResponse.json(
        { success: false, message: 'Token ไม่ถูกต้อง' },
        { status: 401 }
      );
    }

    const username = payload.username;
    const { id, title, description, start_time, end_time, attendees_count, status, room_name } = await request.json();

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'กรุณาระบุ ID การจอง' },
        { status: 400 }
      );
    }

    // ตรวจสอบ room_id ถ้ามีการเปลี่ยน room_name
    let room_id = null;
    if (room_name) {
      const room = await db.queryRow(
        'SELECT id FROM meeting_rooms WHERE name = ?',
        [room_name]
      ) as any;
      
      if (!room) {
        return NextResponse.json(
          { success: false, message: 'ไม่พบห้องประชุมที่ระบุ' },
          { status: 400 }
        );
      }
      room_id = room.id;
    }

    // ตรวจสอบว่าการจองเป็นของผู้ใช้นี้หรือไม่
    const existingBooking = await db.queryRow(
      'SELECT * FROM bookings WHERE id = ? AND username = ?',
      [id, username]
    ) as any;

    if (!existingBooking) {
      return NextResponse.json(
        { success: false, message: 'ไม่พบการจองหรือไม่มีสิทธิ์แก้ไข' },
        { status: 404 }
      );
    }
    // อัพเดทข้อมูลการจอง
    const updateFields = [];
    const updateValues = [];
    
    if (title) {
      updateFields.push('title = ?');
      updateValues.push(title);
    }
    if (description !== undefined) {
      updateFields.push('description = ?');
      updateValues.push(description);
    }
    if (start_time) {
      updateFields.push('start_time = ?');
      updateValues.push(start_time);
    }
    if (end_time) {
      updateFields.push('end_time = ?');
      updateValues.push(end_time);
    }
    if (attendees_count !== undefined) {
      updateFields.push('attendees_count = ?');
      updateValues.push(attendees_count);
    }
    if (status) {
      updateFields.push('status = ?');
      updateValues.push(status);
    }
    if (room_id) {
      updateFields.push('room_id = ?');
      updateValues.push(room_id);
    }

    if (updateFields.length === 0) {
      return NextResponse.json(
        { success: false, message: 'ไม่มีข้อมูลที่ต้องอัพเดท' },
        { status: 400 }
      );
    }

    const updateQuery = `UPDATE bookings SET ${updateFields.join(', ')} WHERE id = ? AND username = ?`;
    updateValues.push(id, username);

    const result = await db.query(updateQuery, updateValues);
    
    console.log('Update result:', result);

    return NextResponse.json({
      success: true,
      message: 'แก้ไขการจองสำเร็จ'
    });

  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาดใน PUT /mybookings:', error);
    return NextResponse.json(
      { success: false, message: 'เกิดข้อผิดพลาดในระบบ' },
      { status: 500 }
    );
  }
}
